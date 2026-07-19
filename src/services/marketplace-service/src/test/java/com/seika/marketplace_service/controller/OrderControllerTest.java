package com.seika.marketplace_service.controller;

import com.seika.marketplace_service.dto.CreateOrderItemRequest;
import com.seika.marketplace_service.dto.CreateOrderRequest;
import com.seika.marketplace_service.entity.Order;
import com.seika.marketplace_service.entity.OrderItem;
import com.seika.marketplace_service.enums.OrderStatus;
import com.seika.marketplace_service.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderControllerTest {

    @Test
    void createOrderOnlyRequiresProductIdAndQuantityFromClient() {
        OrderService orderService = mock(OrderService.class);
        OrderController controller = new OrderController(orderService);
        HttpServletRequest httpRequest = mock(HttpServletRequest.class);
        when(httpRequest.getHeader("X-User-Id")).thenReturn("student-1");
        when(orderService.createOrder(eq("student-1"), anyList())).thenReturn(Order.builder()
                .id("order-1")
                .userId("student-1")
                .status(OrderStatus.PENDING_PAYMENT)
                .totalAmount(new BigDecimal("100"))
                .build());

        CreateOrderRequest request = CreateOrderRequest.builder()
                .items(List.of(CreateOrderItemRequest.builder()
                        .productId("product-1")
                        .quantity(1)
                        .build()))
                .build();

        controller.createOrder(request, httpRequest);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<OrderItem>> itemsCaptor = ArgumentCaptor.forClass(List.class);
        verify(orderService).createOrder(eq("student-1"), itemsCaptor.capture());
        OrderItem item = itemsCaptor.getValue().get(0);
        assertThat(item.getProductId()).isEqualTo("product-1");
        assertThat(item.getQuantity()).isEqualTo(1);
        assertThat(item.getProductType()).isNull();
        assertThat(item.getUnitPrice()).isNull();
        assertThat(item.getSellerUserId()).isNull();
    }
}
