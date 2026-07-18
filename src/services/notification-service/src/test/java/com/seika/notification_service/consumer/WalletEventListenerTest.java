package com.seika.notification_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.notification_service.dto.CreateNotificationRequest;
import com.seika.notification_service.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class WalletEventListenerTest {

    @Test
    void ignoresLegacyWithdrawEventUsedForMarketplacePurchase() {
        NotificationService notificationService = mock(NotificationService.class);
        WalletEventListener listener = new WalletEventListener(
                notificationService,
                new ObjectMapper().findAndRegisterModules()
        );

        listener.handleWalletUpdatedEvent("""
                {
                  "eventId":"purchase-event-1",
                  "userId":"student-1",
                  "amount":-100,
                  "transactionType":"WITHDRAW",
                  "description":"Mua Flashcard: Animal"
                }
                """);

        verifyNoInteractions(notificationService);
    }

    @Test
    void createsOneNotificationForRealCashOut() {
        NotificationService notificationService = mock(NotificationService.class);
        WalletEventListener listener = new WalletEventListener(
                notificationService,
                new ObjectMapper().findAndRegisterModules()
        );

        listener.handleWalletUpdatedEvent("""
                {
                  "eventId":"cash-out-event-1",
                  "userId":"teacher-1",
                  "amount":-100,
                  "transactionType":"CASH_OUT",
                  "description":"Quy doi 100 Coin"
                }
                """);

        ArgumentCaptor<CreateNotificationRequest> captor =
                ArgumentCaptor.forClass(CreateNotificationRequest.class);
        verify(notificationService).createNotification(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo("teacher-1");
        assertThat(captor.getValue().getEventId()).isEqualTo("wallet_updated_cash-out-event-1");
        assertThat(captor.getValue().getTitle()).contains("Rút Coin thành công");
    }
}
