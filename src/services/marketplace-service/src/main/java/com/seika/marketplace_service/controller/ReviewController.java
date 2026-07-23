package com.seika.marketplace_service.controller;

import com.seika.marketplace_service.dto.CreateReviewRequest;
import com.seika.marketplace_service.dto.ReviewResponse;
import com.seika.marketplace_service.entity.TeacherRating;
import com.seika.marketplace_service.service.ReviewService;
import com.seika.marketplace_service.service.TeacherRatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;
    private final TeacherRatingService teacherRatingService;

    @PostMapping("/reviews")
    public ResponseEntity<ReviewResponse> createReview(@Valid @RequestBody CreateReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.createReview(resolveUserId(), request));
    }

    @GetMapping("/products/{productId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getProductReviews(@PathVariable String productId) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId));
    }

    @GetMapping("/teachers/{teacherId}/rating")
    public ResponseEntity<TeacherRating> getTeacherRating(@PathVariable String teacherId) {
        return ResponseEntity.ok(teacherRatingService.getOrDefault(teacherId));
    }

    private static String resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || auth.getPrincipal().toString().isBlank()) {
            throw new IllegalStateException("User not authenticated");
        }
        return auth.getPrincipal().toString();
    }
}
