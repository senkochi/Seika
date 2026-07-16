package com.seika.marketplace_service.controller;

import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProductControllerTest {

    @Test
    void getProductReturnsPublishedActiveProduct() {
        ProductService productService = mock(ProductService.class);
        ProductController controller = new ProductController(productService);
        Product product = Product.builder()
                .id("P1")
                .name("Advanced Algebra Pack")
                .type(ProductType.QUIZ)
                .price(new BigDecimal("120"))
                .status(ProductStatus.PUBLISHED)
                .active(true)
                .build();
        when(productService.getActiveProductById("P1")).thenReturn(Optional.of(product));

        ResponseEntity<Product> response = controller.getProduct("P1");

        assertThat(response.getBody()).isSameAs(product);
    }

    @Test
    void getProductRejectsMissingOrUnpublishedProduct() {
        ProductService productService = mock(ProductService.class);
        ProductController controller = new ProductController(productService);
        when(productService.getActiveProductById("hidden-product")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.getProduct("hidden-product"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Product not found");
    }
}
