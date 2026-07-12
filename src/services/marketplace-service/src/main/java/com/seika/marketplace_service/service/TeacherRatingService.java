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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherRatingService {
    private final TeacherRatingRepository teacherRatingRepository;
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

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
        TeacherTier tier = calculateTier(average, validCount);
        BigDecimal fee = feeForTier(tier);

        existing.setAverageRating(average);
        existing.setValidReviewCount(validCount);
        existing.setExcludedReviewCount(excludedCount);
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
        BigDecimal rating = averageRating == null ? BigDecimal.ZERO : averageRating;
        if (validReviewCount >= 500 && rating.compareTo(new BigDecimal("4.5")) >= 0) {
            return TeacherTier.ELITE;
        }
        if (validReviewCount >= 100 && rating.compareTo(new BigDecimal("4.0")) >= 0) {
            return TeacherTier.GOLD;
        }
        if (validReviewCount >= 20 && rating.compareTo(new BigDecimal("3.5")) >= 0) {
            return TeacherTier.SILVER;
        }
        if (validReviewCount >= 5 && rating.compareTo(new BigDecimal("3.0")) >= 0) {
            return TeacherTier.BRONZE;
        }
        return TeacherTier.NEWBIE;
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
