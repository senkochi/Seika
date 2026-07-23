package com.seika.marketplace_service.dto;

import com.seika.marketplace_service.entity.Product;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProductResponseTest {

    @Test
    void legacySellerUuidIsNeverExposedAsTeacherDisplayName() {
        String sellerId = "fbcd0815-f2d8-4f64-835c-504afb0a67f6";
        Product product = Product.builder()
                .sellerUserId(sellerId)
                .teacherDisplayName(sellerId)
                .build();

        ProductResponse response = ProductResponse.fromEntity(product);

        assertThat(response.getTeacherDisplayName()).isNull();
    }

    @Test
    void usernameRemainsAvailableAsTeacherDisplayName() {
        Product product = Product.builder()
                .sellerUserId("fbcd0815-f2d8-4f64-835c-504afb0a67f6")
                .teacherDisplayName("lan.nguyen")
                .build();

        ProductResponse response = ProductResponse.fromEntity(product);

        assertThat(response.getTeacherDisplayName()).isEqualTo("lan.nguyen");
    }
}
