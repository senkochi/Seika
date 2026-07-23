package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.SellerIdentityProjection;
import com.seika.marketplace_service.repository.ProductRepository;
import com.seika.marketplace_service.repository.SellerIdentityProjectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SellerIdentityProjectionService {

    private static final int MAX_ID_LENGTH = 100;
    private static final int MAX_USERNAME_LENGTH = 100;

    private final SellerIdentityProjectionRepository identityRepository;
    private final ProductRepository productRepository;
    private final CacheManager cacheManager;

    @Transactional
    public int sync(String rawUserId, String rawUsername) {
        String userId = normalize(rawUserId, MAX_ID_LENGTH, "userId");
        String username = normalize(rawUsername, MAX_USERNAME_LENGTH, "username");

        SellerIdentityProjection projection = identityRepository.findById(userId)
                .orElseGet(() -> SellerIdentityProjection.builder()
                        .userId(userId)
                        .build());
        projection.setUsername(username);
        identityRepository.save(projection);

        int updatedProducts =
                productRepository.updateTeacherDisplayNameBySellerUserId(userId, username);
        if (updatedProducts > 0) {
            evictProductCaches();
        }
        log.info(
                "Synchronized seller username for userId={} updatedProducts={}",
                userId,
                updatedProducts);
        return updatedProducts;
    }

    @Transactional(readOnly = true)
    public Optional<String> findUsername(String rawUserId) {
        if (rawUserId == null || rawUserId.isBlank()) {
            return Optional.empty();
        }
        return identityRepository.findById(rawUserId.trim())
                .map(SellerIdentityProjection::getUsername)
                .filter(username -> !username.isBlank());
    }

    private String normalize(String value, int maxLength, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(fieldName + " is too long");
        }
        return normalized;
    }

    private void evictProductCaches() {
        clearCache("marketplace:products:active");
        clearCache("marketplace:products:detail");
    }

    private void clearCache(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
        }
    }
}
