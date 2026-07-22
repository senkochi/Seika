package com.seika.marketplace_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.entity.Order;
import com.seika.marketplace_service.entity.OrderItem;
import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.repository.OrderItemRepository;
import com.seika.marketplace_service.repository.OrderRepository;
import com.seika.marketplace_service.repository.PurchaseClaimRepository;
import com.seika.marketplace_service.repository.OutboxEventRepository;
import com.seika.marketplace_service.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderProductValidationTest {

    @Test
    void createOrderUsesPublishedProductAsCanonicalSource() {
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
        OutboxEventRepository outboxRepository = mock(OutboxEventRepository.class);
        ProductRepository productRepository = mock(ProductRepository.class);
        OrderService service = new OrderService(orderRepository, orderItemRepository, outboxRepository,
                productRepository, mock(PurchaseClaimRepository.class), new ObjectMapper().findAndRegisterModules());

        Product product = Product.builder()
                .id("product-1")
                .name("Canonical flashcard")
                .price(new BigDecimal("100"))
                .type(ProductType.FLASHCARD)
                .referenceId("deck-1")
                .sellerUserId("teacher-1")
                .active(true)
                .status(ProductStatus.PUBLISHED)
                .build();
        when(productRepository.findByIdAndActiveTrueAndStatus("product-1", ProductStatus.PUBLISHED))
                .thenReturn(Optional.of(product));
        when(orderRepository.existsByUserIdAndProductIdsAndStatuses(any(), anyList(), anyList()))
                .thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId("order-1");
            return order;
        });

        OrderItem tampered = OrderItem.builder()
                .productId("product-1")
                .productType(ProductType.QUIZ)
                .referenceId("forged-reference")
                .productName("Forged name")
                .sellerUserId("attacker")
                .unitPrice(BigDecimal.ONE)
                .quantity(1)
                .build();

        Order order = service.createOrder("student-1", List.of(tampered));

        assertThat(order.getTotalAmount()).isEqualByComparingTo("100");
        ArgumentCaptor<List<OrderItem>> itemsCaptor = ArgumentCaptor.forClass(List.class);
        verify(orderItemRepository).saveAll(itemsCaptor.capture());
        OrderItem saved = itemsCaptor.getValue().get(0);
        assertThat(saved.getProductName()).isEqualTo("Canonical flashcard");
        assertThat(saved.getProductType()).isEqualTo(ProductType.FLASHCARD);
        assertThat(saved.getReferenceId()).isEqualTo("deck-1");
        assertThat(saved.getSellerUserId()).isEqualTo("teacher-1");
        assertThat(saved.getUnitPrice()).isEqualByComparingTo("100");
        assertThat(saved.getTotalPrice()).isEqualByComparingTo("100");
    }

    @Test
    void createOrderRejectsProductThatIsNotActiveAndPublished() {
        ProductRepository productRepository = mock(ProductRepository.class);
        OrderService service = new OrderService(
                mock(OrderRepository.class),
                mock(OrderItemRepository.class),
                mock(OutboxEventRepository.class),
                productRepository,
                mock(PurchaseClaimRepository.class),
                new ObjectMapper().findAndRegisterModules());
        when(productRepository.findByIdAndActiveTrueAndStatus("product-1", ProductStatus.PUBLISHED))
                .thenReturn(Optional.empty());

        OrderItem item = OrderItem.builder().productId("product-1").quantity(1).build();

        assertThatThrownBy(() -> service.createOrder("student-1", List.of(item)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not available");
    }

    @Test
    void createOrderRejectsQuantityOtherThanOneForDigitalContent() {
        ProductRepository productRepository = mock(ProductRepository.class);
        OrderService service = new OrderService(
                mock(OrderRepository.class),
                mock(OrderItemRepository.class),
                mock(OutboxEventRepository.class),
                productRepository,
                mock(PurchaseClaimRepository.class),
                new ObjectMapper().findAndRegisterModules());
        Product product = Product.builder()
                .id("product-1")
                .name("Flashcard")
                .price(new BigDecimal("100"))
                .type(ProductType.FLASHCARD)
                .referenceId("deck-1")
                .sellerUserId("teacher-1")
                .active(true)
                .status(ProductStatus.PUBLISHED)
                .build();
        when(productRepository.findByIdAndActiveTrueAndStatus("product-1", ProductStatus.PUBLISHED))
                .thenReturn(Optional.of(product));

        OrderItem item = OrderItem.builder().productId("product-1").quantity(2).build();

        assertThatThrownBy(() -> service.createOrder("student-1", List.of(item)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("quantity must be 1");
    }
    @Test
    void repeatedCheckoutIdempotencyKeyReturnsExistingOrderWithoutCreatingAnotherDebit() {
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
        OutboxEventRepository outboxRepository = mock(OutboxEventRepository.class);
        ProductRepository productRepository = mock(ProductRepository.class);
        OrderService service = new OrderService(orderRepository, orderItemRepository, outboxRepository,
                productRepository, mock(PurchaseClaimRepository.class), new ObjectMapper().findAndRegisterModules());
        Order existing = Order.builder()
                .id("order-existing")
                .userId("student-1")
                .build();
        when(orderRepository.findByUserIdAndRequestKey("student-1", "checkout-123"))
                .thenReturn(Optional.of(existing));

        Order result = service.createOrder(
                "student-1",
                List.of(OrderItem.builder().productId("product-1").quantity(1).build()),
                "checkout-123");

        assertThat(result).isSameAs(existing);
        verify(orderRepository, org.mockito.Mockito.never()).save(any(Order.class));
        verify(outboxRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void concurrentCheckoutClaimConflictReturnsDomainConflict() {
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
        OutboxEventRepository outboxRepository = mock(OutboxEventRepository.class);
        ProductRepository productRepository = mock(ProductRepository.class);
        PurchaseClaimRepository claimRepository = mock(PurchaseClaimRepository.class);
        OrderService service = new OrderService(
                orderRepository,
                orderItemRepository,
                outboxRepository,
                productRepository,
                claimRepository,
                new ObjectMapper().findAndRegisterModules());
        Product product = Product.builder()
                .id("product-1")
                .name("Flashcard")
                .price(new BigDecimal("100"))
                .type(ProductType.FLASHCARD)
                .referenceId("deck-1")
                .sellerUserId("teacher-1")
                .active(true)
                .status(ProductStatus.PUBLISHED)
                .build();
        when(productRepository.findByIdAndActiveTrueAndStatus("product-1", ProductStatus.PUBLISHED))
                .thenReturn(Optional.of(product));
        when(orderRepository.existsByUserIdAndProductIdsAndStatuses(any(), anyList(), anyList()))
                .thenReturn(false);
        doThrow(new DataIntegrityViolationException("uk_purchase_claim_user_product"))
                .when(claimRepository).saveAllAndFlush(anyList());

        assertThatThrownBy(() -> service.createOrder(
                "student-1",
                List.of(OrderItem.builder().productId("product-1").quantity(1).build())))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already");
    }
}
