package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.CollusionFlag;
import com.seika.marketplace_service.entity.Review;
import com.seika.marketplace_service.enums.CollusionFlagStatus;
import com.seika.marketplace_service.enums.ReviewStatus;
import com.seika.marketplace_service.repository.CollusionFlagRepository;
import com.seika.marketplace_service.repository.ReviewRepository;
import com.seika.marketplace_service.config.RabbitMQConfig;
import com.seika.marketplace_service.event.CollusionFlaggedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Slf4j
public class CollusionFlagService {

    private final CollusionFlagRepository collusionFlagRepository;
    private final ReviewRepository reviewRepository;
    private final TeacherRatingService teacherRatingService;
    private final AdminActionLogService adminActionLogService;
    private final MarketplaceConfigService configService;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    public CollusionFlagService(CollusionFlagRepository collusionFlagRepository,
                                ReviewRepository reviewRepository,
                                TeacherRatingService teacherRatingService,
                                AdminActionLogService adminActionLogService) {
        this(collusionFlagRepository, reviewRepository, teacherRatingService, adminActionLogService, null, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public CollusionFlagService(CollusionFlagRepository collusionFlagRepository,
                                ReviewRepository reviewRepository,
                                TeacherRatingService teacherRatingService,
                                AdminActionLogService adminActionLogService,
                                @org.springframework.beans.factory.annotation.Autowired(required = false)
                                MarketplaceConfigService configService,
                                @org.springframework.beans.factory.annotation.Autowired(required = false)
                                org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate) {
        this.collusionFlagRepository = collusionFlagRepository;
        this.reviewRepository = reviewRepository;
        this.teacherRatingService = teacherRatingService;
        this.adminActionLogService = adminActionLogService;
        this.configService = configService;
        this.rabbitTemplate = rabbitTemplate;
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
    public CollusionFlag detectAndFlagCollusion(String teacherId, String buyerId,
                                                int txCount, BigDecimal promoRatio,
                                                BigDecimal noConsumeRatio, BigDecimal reciprocalRatio,
                                                boolean reviewVelocityAbnormal) {
        boolean existingActive = collusionFlagRepository.existsByTeacherIdAndBuyerIdAndStatusIn(
                teacherId, buyerId, List.of(CollusionFlagStatus.SUSPICIOUS, CollusionFlagStatus.CONFIRMED));
        if (existingActive) {
            return collusionFlagRepository.findFirstByTeacherIdAndBuyerIdAndStatusInOrderByCreatedAtDesc(
                    teacherId, buyerId, List.of(CollusionFlagStatus.SUSPICIOUS, CollusionFlagStatus.CONFIRMED)).orElse(null);
        }

        int score = computeRiskScore(txCount, promoRatio, noConsumeRatio, reciprocalRatio, reviewVelocityAbnormal);
        if (score < 50) {
            return null;
        }

        Instant now = Instant.now();
        Instant lookbackStart = now.minus(30, ChronoUnit.DAYS);

        CollusionFlag flag = CollusionFlag.builder()
                .teacherId(teacherId)
                .buyerId(buyerId)
                .riskScore(score)
                .transactionCount(txCount)
                .promoBackedRatio(promoRatio == null ? BigDecimal.ZERO : promoRatio)
                .noConsumeRatio(noConsumeRatio == null ? BigDecimal.ZERO : noConsumeRatio)
                .reciprocalRatio(reciprocalRatio == null ? BigDecimal.ZERO : reciprocalRatio)
                .reviewVelocityAbnormal(reviewVelocityAbnormal)
                .lookbackStart(lookbackStart)
                .lookbackEnd(now)
                .lastEvaluatedAt(now)
                .status(CollusionFlagStatus.SUSPICIOUS)
                .build();
        CollusionFlag saved = collusionFlagRepository.save(flag);

        // Retroactively transition existing VALID reviews to PENDING_RISK_REVIEW and recompute rating
        List<Review> validReviews = reviewRepository.findBySellerIdAndBuyerIdAndStatus(
                teacherId, buyerId, ReviewStatus.VALID);
        if (!validReviews.isEmpty()) {
            for (Review review : validReviews) {
                review.setStatus(ReviewStatus.PENDING_RISK_REVIEW);
            }
            reviewRepository.saveAll(validReviews);
            teacherRatingService.recompute(teacherId);
        }

        return saved;
    }

    @Transactional
    public CollusionFlag confirmCollusion(String flagId, String adminId, String reason) {
        validateReason(reason);
        CollusionFlag flag = getFlagOrThrow(flagId);
        if (flag.getStatus() == CollusionFlagStatus.CONFIRMED) {
            return flag; // Idempotent
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
            return flag; // Idempotent
        }
        flag.setStatus(CollusionFlagStatus.MALICIOUS);
        flag.setAdminId(adminId);
        flag.setAdminReason(reason);
        flag.setResolvedAt(Instant.now());
        CollusionFlag saved = collusionFlagRepository.save(flag);

        // Transition PENDING_RISK_REVIEW reviews to EXCLUDED_WASH
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
            return flag; // Idempotent
        }
        flag.setStatus(CollusionFlagStatus.DISMISSED);
        flag.setAdminId(adminId);
        flag.setAdminReason(reason);
        flag.setResolvedAt(Instant.now());
        CollusionFlag saved = collusionFlagRepository.save(flag);

        // Restore PENDING_RISK_REVIEW reviews to VALID
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
    public boolean hasActiveSuspiciousOrConfirmedFlag(String teacherId, String buyerId) {
        return collusionFlagRepository.existsByTeacherIdAndBuyerIdAndStatusIn(
                teacherId, buyerId, List.of(CollusionFlagStatus.SUSPICIOUS, CollusionFlagStatus.CONFIRMED));
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
        if (configService == null) {
            return 30;
        }
        return configService.getInt(MarketplaceConfigService.KEY_WASH_HOLD_DAYS, 30);
    }

    private void publishEvent(CollusionFlag flag) {
        if (rabbitTemplate != null) {
            try {
                CollusionFlaggedEvent event = CollusionFlaggedEvent.builder()
                        .flagId(flag.getId())
                        .teacherId(flag.getTeacherId())
                        .buyerId(flag.getBuyerId())
                        .riskScore(flag.getRiskScore())
                        .status(flag.getStatus().name())
                        .reason(flag.getAdminReason())
                        .holdDays(resolveWashHoldDays())
                        .build();
                rabbitTemplate.convertAndSend(
                        RabbitMQConfig.MARKETPLACE_EVENTS_EXCHANGE,
                        RabbitMQConfig.COLLUSION_FLAGGED_ROUTING_KEY,
                        event
                );
                log.info("Published CollusionFlaggedEvent for flagId {} status {}", flag.getId(), flag.getStatus());
            } catch (Exception e) {
                log.error("Failed to publish CollusionFlaggedEvent for flagId {}: {}", flag.getId(), e.getMessage());
            }
        }
    }
}
