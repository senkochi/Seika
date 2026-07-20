package com.seika.marketplace_service.service;

import com.seika.marketplace_service.dto.ProductResponse;
import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.OrderStatus;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.helper.ProductCatalogCacheHelper;
import com.seika.marketplace_service.repository.OrderRepository;
import com.seika.marketplace_service.repository.ProductRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProductServiceTest {

    @Test
    void getActiveProductsHidesProductsWithPendingOrPaidOrdersEvenBeforeInventoryExists() {
        Product visible = Product.builder()
                .id("product-visible")
                .name("Visible")
                .status(ProductStatus.PUBLISHED)
                .active(true)
                .build();
        Product pendingPurchase = Product.builder()
                .id("product-pending")
                .name("Pending")
                .status(ProductStatus.PUBLISHED)
                .active(true)
                .build();

        ProductRepository productRepository = mock(ProductRepository.class);
        UserInventoryRepository inventoryRepository = mock(UserInventoryRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);
        ProductCatalogCacheHelper cacheHelper = mock(ProductCatalogCacheHelper.class);

        when(cacheHelper.getActiveProductsCatalog())
                .thenReturn(List.of(ProductResponse.fromEntity(visible), ProductResponse.fromEntity(pendingPurchase)));
        when(inventoryRepository.findByUserIdAndActiveTrue("student-1"))
                .thenReturn(List.of());
        when(orderRepository.findProductIdsByUserIdAndStatuses(eq("student-1"), anyList()))
                .thenAnswer(invocation -> {
                    List<OrderStatus> statuses = invocation.getArgument(1);
                    assertThat(statuses).contains(OrderStatus.PENDING_PAYMENT, OrderStatus.PAID);
                    return List.of("product-pending");
                });

        ProductService service = new ProductService(productRepository, inventoryRepository, orderRepository, null, cacheHelper);

        List<ProductResponse> products = service.getActiveProducts("student-1");

        assertThat(products).extracting(ProductResponse::getId).containsExactly("product-visible");
    }
}
