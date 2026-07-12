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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final TeacherRatingService teacherRatingService;

    @Transactional
    public ReviewResponse createReview(String buyerId, CreateReviewRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + request.getProductId()));
        UserInventory inventory = userInventoryRepository.findByUserIdAndProductIdAndActiveTrue(buyerId, product.getId())
                .orElseThrow(() -> new IllegalStateException("Review requires an active verified purchase"));
        if (reviewRepository.existsByBuyerIdAndProductId(buyerId, product.getId())) {
            throw new IllegalStateException("You already reviewed this product");
        }
        Review review = Review.builder()
                .buyerId(buyerId)
                .sellerId(product.getSellerUserId())
                .productId(product.getId())
                .orderId(inventory.getOrderId())
                .rating(request.getRating())
                .comment(request.getComment())
                .status(ReviewStatus.VALID)
                .build();
        Review saved = reviewRepository.save(review);
        teacherRatingService.recompute(product.getSellerUserId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getProductReviews(String productId) {
        return reviewRepository.findByProductIdAndStatusOrderByCreatedAtDesc(productId, ReviewStatus.VALID)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .buyerId(review.getBuyerId())
                .sellerId(review.getSellerId())
                .productId(review.getProductId())
                .orderId(review.getOrderId())
                .rating(review.getRating())
                .comment(review.getComment())
                .status(review.getStatus().name())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
