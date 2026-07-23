package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.SellerIdentityProjection;
import com.seika.marketplace_service.repository.ProductRepository;
import com.seika.marketplace_service.repository.SellerIdentityProjectionRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.cache.CacheManager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SellerIdentityProjectionServiceTest {

    @Test
    void syncStoresUsernameAndBackfillsExistingProducts() {
        SellerIdentityProjectionRepository identityRepository =
                mock(SellerIdentityProjectionRepository.class);
        ProductRepository productRepository = mock(ProductRepository.class);
        when(identityRepository.findById("teacher-1")).thenReturn(Optional.empty());
        when(productRepository.updateTeacherDisplayNameBySellerUserId(
                "teacher-1", "lan.nguyen")).thenReturn(3);

        SellerIdentityProjectionService service =
                new SellerIdentityProjectionService(
                        identityRepository, productRepository, mock(CacheManager.class));

        int updatedProducts = service.sync("teacher-1", "  lan.nguyen  ");

        ArgumentCaptor<SellerIdentityProjection> projectionCaptor =
                ArgumentCaptor.forClass(SellerIdentityProjection.class);
        verify(identityRepository).save(projectionCaptor.capture());
        verify(productRepository)
                .updateTeacherDisplayNameBySellerUserId("teacher-1", "lan.nguyen");
        assertThat(projectionCaptor.getValue().getUserId()).isEqualTo("teacher-1");
        assertThat(projectionCaptor.getValue().getUsername()).isEqualTo("lan.nguyen");
        assertThat(updatedProducts).isEqualTo(3);
    }

    @Test
    void findUsernameReturnsLocalProjectionWithoutRemoteCall() {
        SellerIdentityProjectionRepository identityRepository =
                mock(SellerIdentityProjectionRepository.class);
        ProductRepository productRepository = mock(ProductRepository.class);
        when(identityRepository.findById("teacher-1")).thenReturn(Optional.of(
                SellerIdentityProjection.builder()
                        .userId("teacher-1")
                        .username("lan.nguyen")
                        .build()));

        SellerIdentityProjectionService service =
                new SellerIdentityProjectionService(
                        identityRepository, productRepository, mock(CacheManager.class));

        assertThat(service.findUsername("teacher-1")).contains("lan.nguyen");
    }
}
