package com.seika.marketplace_service.repository;

import com.seika.marketplace_service.entity.Review;
import com.seika.marketplace_service.enums.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, String> {
    boolean existsByBuyerIdAndProductId(String buyerId, String productId);
    List<Review> findByProductIdAndStatusOrderByCreatedAtDesc(String productId, ReviewStatus status);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.sellerId = :sellerId AND r.status = :status")
    BigDecimal averageRating(@Param("sellerId") String sellerId, @Param("status") ReviewStatus status);

    long countBySellerIdAndStatus(String sellerId, ReviewStatus status);
    long countBySellerIdAndStatusIn(String sellerId, List<ReviewStatus> statuses);
    List<Review> findBySellerIdAndBuyerIdAndStatus(String sellerId, String buyerId, ReviewStatus status);
}
