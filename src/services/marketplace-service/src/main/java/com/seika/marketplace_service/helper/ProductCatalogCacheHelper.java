package com.seika.marketplace_service.helper;

import com.seika.marketplace_service.dto.ProductResponse;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ProductCatalogCacheHelper {

    private final ProductRepository productRepository;

    @Cacheable(value = "marketplace:products:active", key = "'all'", unless = "#result == null || #result.isEmpty()")
    public List<ProductResponse> getActiveProductsCatalog() {
        return productRepository.findByActiveTrueAndStatusOrderByCreatedAtDesc(ProductStatus.PUBLISHED)
                .stream()
                .map(ProductResponse::fromEntity)
                .toList();
    }

    @Cacheable(value = "marketplace:products:detail", key = "#id", unless = "#result == null || #result.isEmpty()")
    public Optional<ProductResponse> getActiveProductById(String id) {
        return productRepository.findByIdAndActiveTrueAndStatus(id, ProductStatus.PUBLISHED)
                .map(ProductResponse::fromEntity);
    }
}
