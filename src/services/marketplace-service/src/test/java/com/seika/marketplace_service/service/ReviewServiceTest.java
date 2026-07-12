package com.seika.marketplace_service.service;

import com.seika.marketplace_service.dto.CreateReviewRequest;
import com.seika.marketplace_service.dto.ReviewResponse;
import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.entity.Review;
import com.seika.marketplace_service.entity.UserInventory;
import com.seika.marketplace_service.enums.ReviewStatus;
import com.seika.marketplace_service.repository.ProductRepository;
import com.seika.marketplace_service.repository.ReviewRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class ReviewServiceTest {

    @Test
    void createReviewSetsPendingRiskReviewIfCollusionFlagActive() {
        ReviewRepository reviewRepo = mock(ReviewRepository.class);
        ProductRepository productRepo = mock(ProductRepository.class);
        UserInventoryRepository inventoryRepo = mock(UserInventoryRepository.class);
        TeacherRatingService ratingService = mock(TeacherRatingService.class);
        CollusionFlagService collusionFlagService = mock(CollusionFlagService.class);

        ReviewService service = new ReviewService(reviewRepo, productRepo, inventoryRepo, ratingService, collusionFlagService);

        Product product = Product.builder().id("P1").sellerUserId("T1").build();
        when(productRepo.findById("P1")).thenReturn(Optional.of(product));

        UserInventory inventory = UserInventory.builder().id("INV1").userId("B1").productId("P1").orderId("ORD1").active(true).build();
        when(inventoryRepo.findByUserIdAndProductIdAndActiveTrue("B1", "P1")).thenReturn(Optional.of(inventory));
        when(reviewRepo.existsByBuyerIdAndProductId("B1", "P1")).thenReturn(false);

        when(collusionFlagService.hasActiveSuspiciousOrConfirmedFlag("T1", "B1")).thenReturn(true);

        when(reviewRepo.save(any(Review.class))).thenAnswer(inv -> {
            Review r = inv.getArgument(0);
            r.setId("REV1");
            return r;
        });

        CreateReviewRequest request = new CreateReviewRequest("P1", 5, "Great");
        ReviewResponse response = service.createReview("B1", request);

        ArgumentCaptor<Review> captor = ArgumentCaptor.forClass(Review.class);
        verify(reviewRepo).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ReviewStatus.PENDING_RISK_REVIEW);
        assertThat(response.getStatus()).isEqualTo("PENDING_RISK_REVIEW");
    }
}
