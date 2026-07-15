package com.seika.marketplace_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.config.RabbitMQConfig;
import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.entity.TeacherRating;
import com.seika.marketplace_service.enums.ReviewStatus;
import com.seika.marketplace_service.enums.TeacherTier;
import com.seika.marketplace_service.event.TeacherTierUpdatedEvent;
import com.seika.marketplace_service.repository.ProductRepository;
import com.seika.marketplace_service.repository.ReviewRepository;
import com.seika.marketplace_service.repository.TeacherRatingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherRatingService {
    private static final String DEFAULT_TIER_CONSUME_RATE_MIN = "{\"SILVER\":0.35,\"GOLD\":0.50,\"ELITE\":0.65}";
    private static final String DEFAULT_TIER_REFUND_RATE_MAX = "{\"BRONZE\":0.20,\"SILVER\":0.15,\"GOLD\":0.10,\"ELITE\":0.05}";
    private static final String DEFAULT_TIER_APPROVAL_REJECTION_RATE_MAX = "{\"BRONZE\":0.50,\"SILVER\":0.30,\"GOLD\":0.15,\"ELITE\":0.08}";

    private final TeacherRatingRepository teacherRatingRepository;
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final com.seika.marketplace_service.repository.EscrowTransactionRepository escrowTransactionRepository;
    private final com.seika.marketplace_service.repository.UserInventoryRepository userInventoryRepository;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;
    private final MarketplaceConfigService configService;

    public TeacherRatingService(TeacherRatingRepository teacherRatingRepository,
                                ReviewRepository reviewRepository,
                                ProductRepository productRepository,
                                com.seika.marketplace_service.repository.EscrowTransactionRepository escrowTransactionRepository,
                                com.seika.marketplace_service.repository.UserInventoryRepository userInventoryRepository,
                                RabbitTemplate rabbitTemplate,
                                ObjectMapper objectMapper) {
        this(teacherRatingRepository, reviewRepository, productRepository, escrowTransactionRepository,
                userInventoryRepository, rabbitTemplate, objectMapper, null);
    }

    @Transactional(readOnly = true)
    public TeacherRating getOrDefault(String teacherId) {
        return teacherRatingRepository.findById(teacherId)
                .orElse(TeacherRating.builder().teacherId(teacherId).build());
    }

    @Transactional
    public TeacherRating recompute(String teacherId) {
        TeacherRating existing = teacherRatingRepository.findById(teacherId)
                .orElse(TeacherRating.builder().teacherId(teacherId).build());
        TeacherTier oldTier = existing.getTier();

        BigDecimal average = reviewRepository.averageRating(teacherId, ReviewStatus.VALID)
                .setScale(2, RoundingMode.HALF_UP);
        long validCount = reviewRepository.countBySellerIdAndStatus(teacherId, ReviewStatus.VALID);
        long excludedCount = reviewRepository.countBySellerIdAndStatusIn(teacherId,
                List.of(ReviewStatus.EXCLUDED_WASH, ReviewStatus.DELETED_BY_ADMIN));

        List<Product> teacherProducts = productRepository.findBySellerUserIdOrderByCreatedAtDesc(teacherId);
        List<String> productIds = teacherProducts.stream().map(Product::getId).toList();

        // 1. consumeRate = consumed / completed purchases
        BigDecimal consumeRate = BigDecimal.ZERO;
        if (!productIds.isEmpty() && userInventoryRepository != null) {
            List<com.seika.marketplace_service.entity.UserInventory> inventories = userInventoryRepository.findByProductIdIn(productIds);
            long totalInv = inventories.size();
            long consumedInv = inventories.stream().filter(inv -> inv.getConsumedAt() != null).count();
            if (totalInv > 0) {
                consumeRate = BigDecimal.valueOf(consumedInv)
                        .divide(BigDecimal.valueOf(totalInv), 4, RoundingMode.HALF_UP);
            }
        }

        // 2. refundRate = refunded / (released + refunded escrows)
        BigDecimal refundRate = BigDecimal.ZERO;
        if (escrowTransactionRepository != null) {
            List<com.seika.marketplace_service.entity.EscrowTransaction> escrows = escrowTransactionRepository.findBySellerId(teacherId);
            long totalResolved = escrows.stream()
                    .filter(e -> e.getStatus() == com.seika.marketplace_service.enums.EscrowStatus.RELEASED
                              || e.getStatus() == com.seika.marketplace_service.enums.EscrowStatus.REFUNDED)
                    .count();
            long refundedCount = escrows.stream()
                    .filter(e -> e.getStatus() == com.seika.marketplace_service.enums.EscrowStatus.REFUNDED)
                    .count();
            if (totalResolved > 0) {
                refundRate = BigDecimal.valueOf(refundedCount)
                        .divide(BigDecimal.valueOf(totalResolved), 4, RoundingMode.HALF_UP);
            }
        }

        // 3. approvalRejectionRate = rejected / total reviewed products
        BigDecimal approvalRejectionRate = BigDecimal.ZERO;
        long reviewedProducts = teacherProducts.stream()
                .filter(p -> p.getStatus() == com.seika.marketplace_service.enums.ProductStatus.PUBLISHED
                          || p.getStatus() == com.seika.marketplace_service.enums.ProductStatus.REJECTED
                          || p.getStatus() == com.seika.marketplace_service.enums.ProductStatus.HIDDEN)
                .count();
        long rejectedProducts = teacherProducts.stream()
                .filter(p -> p.getStatus() == com.seika.marketplace_service.enums.ProductStatus.REJECTED)
                .count();
        if (reviewedProducts > 0) {
            approvalRejectionRate = BigDecimal.valueOf(rejectedProducts)
                    .divide(BigDecimal.valueOf(reviewedProducts), 4, RoundingMode.HALF_UP);
        }

        TeacherTier tier = calculateTier(average, validCount, consumeRate, refundRate, approvalRejectionRate);
        BigDecimal fee = feeForTier(tier);

        existing.setAverageRating(average);
        existing.setValidReviewCount(validCount);
        existing.setExcludedReviewCount(excludedCount);
        existing.setConsumeRate(consumeRate);
        existing.setRefundRate(refundRate);
        existing.setApprovalRejectionRate(approvalRejectionRate);
        existing.setTier(tier);
        existing.setTierFeePercent(fee);
        TeacherRating saved = teacherRatingRepository.save(existing);
        denormalizeProducts(saved);

        if (oldTier != tier) {
            publishTierUpdated(saved);
        }
        return saved;
    }

    public TeacherTier calculateTier(BigDecimal averageRating, long validReviewCount) {
        return calculateTier(averageRating, validReviewCount, BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO);
    }

    public TeacherTier calculateTier(BigDecimal averageRating, long validReviewCount,
                                     BigDecimal consumeRate, BigDecimal refundRate,
                                     BigDecimal approvalRejectionRate) {
        BigDecimal rating = averageRating == null ? BigDecimal.ZERO : averageRating;
        BigDecimal consume = consumeRate == null ? BigDecimal.ZERO : consumeRate;
        BigDecimal refund = refundRate == null ? BigDecimal.ZERO : refundRate;
        BigDecimal reject = approvalRejectionRate == null ? BigDecimal.ZERO : approvalRejectionRate;

        if (validReviewCount >= 500
                && rating.compareTo(new BigDecimal("4.5")) >= 0
                && consume.compareTo(minConsume(TeacherTier.ELITE)) >= 0
                && refund.compareTo(maxRefund(TeacherTier.ELITE)) <= 0
                && reject.compareTo(maxApprovalRejection(TeacherTier.ELITE)) <= 0) {
            return TeacherTier.ELITE;
        }
        if (validReviewCount >= 100
                && rating.compareTo(new BigDecimal("4.0")) >= 0
                && consume.compareTo(minConsume(TeacherTier.GOLD)) >= 0
                && refund.compareTo(maxRefund(TeacherTier.GOLD)) <= 0
                && reject.compareTo(maxApprovalRejection(TeacherTier.GOLD)) <= 0) {
            return TeacherTier.GOLD;
        }
        if (validReviewCount >= 20
                && rating.compareTo(new BigDecimal("3.5")) >= 0
                && consume.compareTo(minConsume(TeacherTier.SILVER)) >= 0
                && refund.compareTo(maxRefund(TeacherTier.SILVER)) <= 0) {
            return TeacherTier.SILVER;
        }
        if (validReviewCount >= 5
                && rating.compareTo(new BigDecimal("3.0")) >= 0) {
            return TeacherTier.BRONZE;
        }
        return TeacherTier.NEWBIE;
    }

    private BigDecimal minConsume(TeacherTier tier) {
        return configuredThreshold(MarketplaceConfigService.KEY_TIER_CONSUME_RATE_MIN,
                DEFAULT_TIER_CONSUME_RATE_MIN, tier, BigDecimal.ZERO);
    }

    private BigDecimal maxRefund(TeacherTier tier) {
        return configuredThreshold(MarketplaceConfigService.KEY_TIER_REFUND_RATE_MAX,
                DEFAULT_TIER_REFUND_RATE_MAX, tier, BigDecimal.ONE);
    }

    private BigDecimal maxApprovalRejection(TeacherTier tier) {
        return configuredThreshold(MarketplaceConfigService.KEY_TIER_APPROVAL_REJECTION_RATE_MAX,
                DEFAULT_TIER_APPROVAL_REJECTION_RATE_MAX, tier, BigDecimal.ONE);
    }

    private BigDecimal configuredThreshold(String key, String defaultJson, TeacherTier tier, BigDecimal fallback) {
        try {
            String raw = configService == null ? defaultJson : configService.getValue(key, defaultJson);
            ObjectMapper mapper = objectMapper == null ? new ObjectMapper() : objectMapper;
            Map<String, BigDecimal> values = mapper.readValue(raw,
                    new com.fasterxml.jackson.core.type.TypeReference<>() {});
            return values.getOrDefault(tier.name(), fallback);
        } catch (Exception exception) {
            return fallback;
        }
    }

    public BigDecimal feeForTier(TeacherTier tier) {
        return switch (tier == null ? TeacherTier.NEWBIE : tier) {
            case ELITE -> new BigDecimal("3");
            case GOLD -> new BigDecimal("5");
            case SILVER -> new BigDecimal("10");
            case BRONZE -> new BigDecimal("15");
            case NEWBIE -> new BigDecimal("20");
        };
    }

    private void denormalizeProducts(TeacherRating rating) {
        List<Product> products = productRepository.findBySellerUserIdOrderByCreatedAtDesc(rating.getTeacherId());
        for (Product product : products) {
            product.setTeacherTier(rating.getTier());
            product.setTeacherAverageRating(rating.getAverageRating());
            product.setTeacherValidReviewCount(rating.getValidReviewCount());
            if (product.getTeacherDisplayName() == null || product.getTeacherDisplayName().isBlank()) {
                product.setTeacherDisplayName(product.getSellerUserId());
            }
        }
        productRepository.saveAll(products);
    }

    private void publishTierUpdated(TeacherRating rating) {
        TeacherTierUpdatedEvent event = TeacherTierUpdatedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(RabbitMQConfig.TEACHER_TIER_UPDATED_ROUTING_KEY)
                .teacherId(rating.getTeacherId())
                .tier(rating.getTier().name())
                .averageRating(rating.getAverageRating())
                .validReviewCount(rating.getValidReviewCount())
                .tierFeePercent(rating.getTierFeePercent())
                .occurredAt(Instant.now())
                .build();
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.MARKETPLACE_EVENTS_EXCHANGE,
                    RabbitMQConfig.TEACHER_TIER_UPDATED_ROUTING_KEY,
                    objectMapper.writeValueAsString(event));
        } catch (JsonProcessingException exception) {
            log.error("Failed to publish teacher.tier.updated for teacherId={}", rating.getTeacherId(), exception);
        }
    }
}
