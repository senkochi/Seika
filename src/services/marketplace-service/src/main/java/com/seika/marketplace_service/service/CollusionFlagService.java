package com.seika.marketplace_service.service;

import com.seika.marketplace_service.config.RabbitMQConfig;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.entity.CollusionFlag;
import com.seika.marketplace_service.entity.OutboxEvent;
import com.seika.marketplace_service.entity.EscrowTransaction;
import com.seika.marketplace_service.entity.Review;
import com.seika.marketplace_service.entity.UserInventory;
import com.seika.marketplace_service.enums.CollusionFlagStatus;
import com.seika.marketplace_service.enums.ReviewStatus;
import com.seika.marketplace_service.enums.OutboxStatus;
import com.seika.marketplace_service.event.CollusionFlaggedEvent;
import com.seika.marketplace_service.repository.CollusionFlagRepository;
import com.seika.marketplace_service.repository.OutboxEventRepository;
import com.seika.marketplace_service.repository.EscrowTransactionRepository;
import com.seika.marketplace_service.repository.ReviewRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class CollusionFlagService {

    private static final BigDecimal DEFAULT_PROMO_RATIO_THRESHOLD = new BigDecimal("0.6");
    private static final BigDecimal DEFAULT_NO_CONSUME_RATIO_THRESHOLD = new BigDecimal("0.7");
    private static final BigDecimal DEFAULT_RECIPROCAL_RATIO_THRESHOLD = new BigDecimal("0.7");

    private final CollusionFlagRepository collusionFlagRepository;
    private final ReviewRepository reviewRepository;
    private final TeacherRatingService teacherRatingService;
    private final AdminActionLogService adminActionLogService;
    private final MarketplaceConfigService configService;
    private final ObjectMapper objectMapper;
    private final OutboxEventRepository outboxEventRepository;
    private final EscrowTransactionRepository escrowRepository;
    private final UserInventoryRepository userInventoryRepository;

    public CollusionFlagService(CollusionFlagRepository collusionFlagRepository,
                                ReviewRepository reviewRepository,
                                TeacherRatingService teacherRatingService,
                                AdminActionLogService adminActionLogService) {
        this(collusionFlagRepository, reviewRepository, teacherRatingService, adminActionLogService,
                null, null, null, null, null);
    }

    public CollusionFlagService(CollusionFlagRepository collusionFlagRepository,
                                ReviewRepository reviewRepository,
                                TeacherRatingService teacherRatingService,
                                AdminActionLogService adminActionLogService,
                                MarketplaceConfigService configService,
                                org.springframework.amqp.rabbit.core.RabbitTemplate ignoredRabbitTemplate) {
        this(collusionFlagRepository, reviewRepository, teacherRatingService, adminActionLogService,
                configService, null, null, null, null);
    }

    public CollusionFlagService(CollusionFlagRepository collusionFlagRepository,
                                ReviewRepository reviewRepository,
                                TeacherRatingService teacherRatingService,
                                AdminActionLogService adminActionLogService,
                                MarketplaceConfigService configService,
                                org.springframework.amqp.rabbit.core.RabbitTemplate ignoredRabbitTemplate,
                                EscrowTransactionRepository escrowRepository,
                                UserInventoryRepository userInventoryRepository) {
        this(collusionFlagRepository, reviewRepository, teacherRatingService, adminActionLogService,
                configService, null, null, escrowRepository, userInventoryRepository);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public CollusionFlagService(CollusionFlagRepository collusionFlagRepository,
                                ReviewRepository reviewRepository,
                                TeacherRatingService teacherRatingService,
                                AdminActionLogService adminActionLogService,
                                MarketplaceConfigService configService,
                                ObjectMapper objectMapper,
                                OutboxEventRepository outboxEventRepository,
                                EscrowTransactionRepository escrowRepository,
                                UserInventoryRepository userInventoryRepository) {
        this.collusionFlagRepository = collusionFlagRepository;
        this.reviewRepository = reviewRepository;
        this.teacherRatingService = teacherRatingService;
        this.adminActionLogService = adminActionLogService;
        this.configService = configService;
        this.objectMapper = objectMapper;
        this.outboxEventRepository = outboxEventRepository;
        this.escrowRepository = escrowRepository;
        this.userInventoryRepository = userInventoryRepository;
    }
    public static int computeRiskScore(int txCount, BigDecimal promoRatio, BigDecimal noConsumeRatio,
                                       BigDecimal reciprocalRatio, boolean reviewVelocityAbnormal) {
        int score = 0;
        if (txCount > 5) score += 25;
        if (promoRatio != null && promoRatio.compareTo(new BigDecimal("0.6")) > 0) score += 25;
        if (noConsumeRatio != null && noConsumeRatio.compareTo(new BigDecimal("0.7")) > 0) score += 20;
        if (reciprocalRatio != null && reciprocalRatio.compareTo(new BigDecimal("0.7")) > 0) score += 15;
        if (reviewVelocityAbnormal) score += 15;
        return Math.min(100, score);
    }

    @Transactional
    public int scanRecentEscrowsForCollusion() {
        return scanRecentEscrowsForCollusion(Instant.now());
    }

    @Transactional
    public int scanRecentEscrowsForCollusion(Instant now) {
        if (escrowRepository == null) {
            return 0;
        }
        int lookbackDays = configInt(MarketplaceConfigService.KEY_COLLUSION_LOOKBACK_DAYS, 30);
        Instant lookbackStart = now.minus(lookbackDays, ChronoUnit.DAYS);
        List<EscrowTransaction> escrows = escrowRepository.findByCreatedAtBetween(lookbackStart, now);
        Map<Pair, List<EscrowTransaction>> byPair = new HashMap<>();
        for (EscrowTransaction escrow : escrows) {
            if (escrow.getSellerId() == null || escrow.getBuyerId() == null) {
                continue;
            }
            byPair.computeIfAbsent(Pair.of(escrow.getSellerId(), escrow.getBuyerId()), ignored -> new java.util.ArrayList<>())
                    .add(escrow);
        }

        int created = 0;
        for (Map.Entry<Pair, List<EscrowTransaction>> entry : byPair.entrySet()) {
            Pair pair = entry.getKey();
            List<EscrowTransaction> pairEscrows = entry.getValue();
            // After canonicalization, pair.teacherId()/buyerId() is whichever UUID sorts first.
            // Re-derive the real roles by majority seller in the pair's escrows so risk attribution
            // remains "the user that acts as seller most often" vs the counter-party buyer.
            String teacherId = deriveTeacherId(pairEscrows, pair);
            String buyerId = deriveBuyerId(pair, teacherId);
            BigDecimal gross = sum(pairEscrows, EscrowTransaction::getGrossAmount);
            BigDecimal promo = sum(pairEscrows, EscrowTransaction::getPromoBackedAmount);
            BigDecimal promoRatio = ratio(promo, gross);
            BigDecimal noConsumeRatio = ratio(BigDecimal.valueOf(countNoConsume(pairEscrows)), BigDecimal.valueOf(pairEscrows.size()));
            BigDecimal reciprocalRatio = ratio(
                    BigDecimal.valueOf(byPair.getOrDefault(pair, List.of()).size()),
                    BigDecimal.valueOf(pairEscrows.size()));
            boolean reviewVelocityAbnormal = pairEscrows.size() > configInt(MarketplaceConfigService.KEY_COLLUSION_TX_THRESHOLD, 5) * 2;
            CollusionFlag flag = detectAndFlagCollusion(teacherId, buyerId, pairEscrows.size(),
                    promoRatio, noConsumeRatio, reciprocalRatio, reviewVelocityAbnormal, lookbackStart, now);
            if (flag != null) {
                created++;
            }
        }
        return created;
    }

    private static String deriveTeacherId(List<EscrowTransaction> pairEscrows, Pair pair) {
        java.util.Map<String, Integer> sellerCounts = new HashMap<>();
        for (EscrowTransaction escrow : pairEscrows) {
            sellerCounts.merge(escrow.getSellerId(), 1, Integer::sum);
        }
        String majoritySeller = null;
        int majorityCount = -1;
        for (java.util.Map.Entry<String, Integer> e : sellerCounts.entrySet()) {
            if (e.getValue() > majorityCount) {
                majorityCount = e.getValue();
                majoritySeller = e.getKey();
            }
        }
        if (majoritySeller == null) {
            return pair.teacherId();
        }
        return majoritySeller;
    }

    private static String deriveBuyerId(Pair pair, String teacherId) {
        if (teacherId == null) {
            return pair.buyerId();
        }
        if (teacherId.equals(pair.teacherId())) {
            return pair.buyerId();
        }
        return pair.teacherId();
    }

    @Transactional
    public CollusionFlag detectAndFlagCollusion(String teacherId, String buyerId,
                                                int txCount, BigDecimal promoRatio,
                                                BigDecimal noConsumeRatio, BigDecimal reciprocalRatio,
                                                boolean reviewVelocityAbnormal) {
        Instant now = Instant.now();
        return detectAndFlagCollusion(teacherId, buyerId, txCount, promoRatio, noConsumeRatio, reciprocalRatio,
                reviewVelocityAbnormal, now.minus(30, ChronoUnit.DAYS), now);
    }

    private CollusionFlag detectAndFlagCollusion(String teacherId, String buyerId,
                                                int txCount, BigDecimal promoRatio,
                                                BigDecimal noConsumeRatio, BigDecimal reciprocalRatio,
                                                boolean reviewVelocityAbnormal,
                                                Instant lookbackStart, Instant lookbackEnd) {
        boolean existingActive = collusionFlagRepository.existsByTeacherIdAndBuyerIdAndStatusIn(
                teacherId, buyerId, List.of(CollusionFlagStatus.SUSPICIOUS, CollusionFlagStatus.CONFIRMED));
        if (existingActive) {
            return collusionFlagRepository.findFirstByTeacherIdAndBuyerIdAndStatusInOrderByCreatedAtDesc(
                    teacherId, buyerId, List.of(CollusionFlagStatus.SUSPICIOUS, CollusionFlagStatus.CONFIRMED)).orElse(null);
        }

        int score = computeConfiguredRiskScore(txCount, promoRatio, noConsumeRatio, reciprocalRatio, reviewVelocityAbnormal);
        if (score < configInt(MarketplaceConfigService.KEY_COLLUSION_RISK_THRESHOLD, 50)) {
            return null;
        }

        CollusionFlag flag = CollusionFlag.builder()
                .teacherId(teacherId)
                .buyerId(buyerId)
                .riskScore(score)
                .transactionCount(txCount)
                .promoBackedRatio(zero(promoRatio))
                .noConsumeRatio(zero(noConsumeRatio))
                .reciprocalRatio(zero(reciprocalRatio))
                .reviewVelocityAbnormal(reviewVelocityAbnormal)
                .lookbackStart(lookbackStart)
                .lookbackEnd(lookbackEnd)
                .lastEvaluatedAt(lookbackEnd)
                .status(CollusionFlagStatus.SUSPICIOUS)
                .build();
        CollusionFlag saved = collusionFlagRepository.save(flag);
        transitionValidReviewsToPending(teacherId, buyerId, lookbackStart);
        return saved;
    }

    @Transactional
    public CollusionFlag confirmCollusion(String flagId, String adminId, String reason) {
        validateReason(reason);
        CollusionFlag flag = getFlagOrThrow(flagId);
        if (flag.getStatus() == CollusionFlagStatus.CONFIRMED) {
            return flag;
        }
        flag.setStatus(CollusionFlagStatus.CONFIRMED);
        flag.setAdminId(adminId);
        flag.setAdminReason(reason);
        flag.setResolvedAt(Instant.now());
        CollusionFlag saved = collusionFlagRepository.save(flag);

        adminActionLogService.logAction(adminId, "CONFIRM_COLLUSION", "COLLUSION_FLAG", flagId, reason, null);
        publishEvent(saved);
        return saved;
    }

    @Transactional
    public CollusionFlag markMalicious(String flagId, String adminId, String reason) {
        validateReason(reason);
        CollusionFlag flag = getFlagOrThrow(flagId);
        if (flag.getStatus() == CollusionFlagStatus.MALICIOUS) {
            return flag;
        }
        flag.setStatus(CollusionFlagStatus.MALICIOUS);
        flag.setAdminId(adminId);
        flag.setAdminReason(reason);
        flag.setResolvedAt(Instant.now());
        CollusionFlag saved = collusionFlagRepository.save(flag);

        List<Review> pendingReviews = reviewRepository.findBySellerIdAndBuyerIdAndStatus(
                flag.getTeacherId(), flag.getBuyerId(), ReviewStatus.PENDING_RISK_REVIEW);
        if (!pendingReviews.isEmpty()) {
            for (Review r : pendingReviews) {
                r.setStatus(ReviewStatus.EXCLUDED_WASH);
            }
            reviewRepository.saveAll(pendingReviews);
            teacherRatingService.recompute(flag.getTeacherId());
        }

        adminActionLogService.logAction(adminId, "MARK_MALICIOUS", "COLLUSION_FLAG", flagId, reason, null);
        publishEvent(saved);
        return saved;
    }

    @Transactional
    public CollusionFlag dismissFlag(String flagId, String adminId, String reason) {
        validateReason(reason);
        CollusionFlag flag = getFlagOrThrow(flagId);
        if (flag.getStatus() == CollusionFlagStatus.DISMISSED) {
            return flag;
        }
        flag.setStatus(CollusionFlagStatus.DISMISSED);
        flag.setAdminId(adminId);
        flag.setAdminReason(reason);
        flag.setResolvedAt(Instant.now());
        CollusionFlag saved = collusionFlagRepository.save(flag);

        List<Review> pendingReviews = reviewRepository.findBySellerIdAndBuyerIdAndStatus(
                flag.getTeacherId(), flag.getBuyerId(), ReviewStatus.PENDING_RISK_REVIEW);
        if (!pendingReviews.isEmpty()) {
            for (Review r : pendingReviews) {
                r.setStatus(ReviewStatus.VALID);
            }
            reviewRepository.saveAll(pendingReviews);
            teacherRatingService.recompute(flag.getTeacherId());
        }

        adminActionLogService.logAction(adminId, "DISMISS_COLLUSION", "COLLUSION_FLAG", flagId, reason, null);
        return saved;
    }

    @Transactional(readOnly = true)
    public CollusionFlag getFlag(String flagId) {
        return getFlagOrThrow(flagId);
    }

    @Transactional(readOnly = true)
    public boolean hasActiveSuspiciousOrConfirmedFlag(String teacherId, String buyerId) {
        return collusionFlagRepository.existsByTeacherIdAndBuyerIdAndStatusIn(
                teacherId, buyerId, List.of(CollusionFlagStatus.SUSPICIOUS, CollusionFlagStatus.CONFIRMED));
    }

    int transitionValidReviewsToPending(String teacherId, String buyerId, Instant lookbackStart) {
        List<Review> validReviews = reviewRepository.findBySellerIdAndBuyerIdAndStatusAndCreatedAtGreaterThanEqual(
                teacherId, buyerId, ReviewStatus.VALID, lookbackStart);
        if (!validReviews.isEmpty()) {
            for (Review review : validReviews) {
                review.setStatus(ReviewStatus.PENDING_RISK_REVIEW);
            }
            reviewRepository.saveAll(validReviews);
            teacherRatingService.recompute(teacherId);
            log.info("Transitioned {} VALID reviews to PENDING_RISK_REVIEW for teacherId={} buyerId={} lookbackStart={}",
                    validReviews.size(), teacherId, buyerId, lookbackStart);
        }
        return validReviews.size();
    }

    private int computeConfiguredRiskScore(int txCount, BigDecimal promoRatio, BigDecimal noConsumeRatio,
                                           BigDecimal reciprocalRatio, boolean reviewVelocityAbnormal) {
        int score = 0;
        if (txCount > configInt(MarketplaceConfigService.KEY_COLLUSION_TX_THRESHOLD, 5)) score += 25;
        if (promoRatio != null && promoRatio.compareTo(configBigDecimal(
                MarketplaceConfigService.KEY_COLLUSION_PROMO_BACKED_RATIO_THRESHOLD, DEFAULT_PROMO_RATIO_THRESHOLD)) > 0) score += 25;
        if (noConsumeRatio != null && noConsumeRatio.compareTo(configBigDecimal(
                MarketplaceConfigService.KEY_COLLUSION_NO_CONSUME_RATIO_THRESHOLD, DEFAULT_NO_CONSUME_RATIO_THRESHOLD)) > 0) score += 20;
        if (reciprocalRatio != null && reciprocalRatio.compareTo(DEFAULT_RECIPROCAL_RATIO_THRESHOLD) > 0) score += 15;
        if (reviewVelocityAbnormal) score += 15;
        return Math.min(100, score);
    }

    private long countNoConsume(List<EscrowTransaction> escrows) {
        long count = 0;
        for (EscrowTransaction escrow : escrows) {
            if (userInventoryRepository == null) {
                count++;
                continue;
            }
            boolean consumed = userInventoryRepository
                    .findByOrderIdAndProductIdAndActiveTrue(escrow.getOrderId(), escrow.getProductId())
                    .map(UserInventory::getConsumedAt)
                    .isPresent();
            if (!consumed) {
                count++;
            }
        }
        return count;
    }

    private BigDecimal sum(List<EscrowTransaction> escrows, java.util.function.Function<EscrowTransaction, BigDecimal> getter) {
        return escrows.stream().map(getter).map(this::zero).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal ratio(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return zero(numerator).divide(denominator, 4, RoundingMode.HALF_UP);
    }

    private BigDecimal zero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private int configInt(String key, int defaultValue) {
        return configService == null ? defaultValue : configService.getInt(key, defaultValue);
    }

    private BigDecimal configBigDecimal(String key, BigDecimal defaultValue) {
        return configService == null ? defaultValue : configService.getBigDecimal(key, defaultValue);
    }

    private void validateReason(String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Reason must not be empty");
        }
    }

    private CollusionFlag getFlagOrThrow(String flagId) {
        return collusionFlagRepository.findById(flagId)
                .orElseThrow(() -> new IllegalArgumentException("Collusion flag not found: " + flagId));
    }

    private int resolveWashHoldDays() {
        return configInt(MarketplaceConfigService.KEY_WASH_HOLD_DAYS, 30);
    }

    private void publishEvent(CollusionFlag flag) {
        if (outboxEventRepository == null || objectMapper == null) {
            log.debug("Skipping CollusionFlaggedEvent outbox enqueue because outbox dependencies are not available for flagId={}", flag.getId());
            return;
        }

        CollusionFlaggedEvent event = CollusionFlaggedEvent.builder()
                .flagId(flag.getId())
                .teacherId(flag.getTeacherId())
                .buyerId(flag.getBuyerId())
                .riskScore(flag.getRiskScore())
                .status(flag.getStatus().name())
                .reason(flag.getAdminReason())
                .holdDays(resolveWashHoldDays())
                .build();
        try {
            outboxEventRepository.save(OutboxEvent.builder()
                    .aggregateType("CollusionFlag")
                    .aggregateId(flag.getId())
                    .eventType(RabbitMQConfig.COLLUSION_FLAGGED_ROUTING_KEY)
                    .payload(objectMapper.writeValueAsString(event))
                    .status(OutboxStatus.PENDING)
                    .build());
            log.info("Queued CollusionFlaggedEvent in outbox for flagId {} status {}", flag.getId(), flag.getStatus());
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize collusion.flagged outbox payload", exception);
        }
    }
    private record Pair(String teacherId, String buyerId) {
        static Pair of(String a, String b) {
            // Canonicalize: order the two IDs so (T,B) and (B,T) collapse to one map key.
            // The first field is whichever UUID sorts first lexicographically; the second
            // is the counter-party. Callers MUST NOT rely on field meaning without
            // re-deriving roles from the underlying escrows (see deriveTeacherId/deriveBuyerId).
            if (a == null && b == null) {
                return new Pair(null, null);
            }
            if (a == null) {
                return new Pair(b, a);
            }
            if (b == null) {
                return new Pair(a, b);
            }
            int cmp = a.compareTo(b);
            if (cmp <= 0) {
                return new Pair(a, b);
            }
            return new Pair(b, a);
        }
    }
}
