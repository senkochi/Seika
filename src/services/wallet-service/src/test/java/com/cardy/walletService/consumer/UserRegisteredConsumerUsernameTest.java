package com.cardy.walletService.consumer;

import com.cardy.walletService.service.WalletService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class UserRegisteredConsumerUsernameTest {

    @Test
    void userRegisteredEventSynchronizesUsernameIntoWallet() {
        WalletService walletService = mock(WalletService.class);
        UserRegisteredConsumer consumer =
                new UserRegisteredConsumer(walletService, new ObjectMapper().findAndRegisterModules());

        consumer.handleUserRegistered("""
                {
                  "eventId": "event-1",
                  "eventType": "user.registered",
                  "userId": "90be3875-2f50-4cb1-835c-504afb0a67f6",
                  "payload": {
                    "username": "ngoc.anh",
                    "roles": ["STUDENT"]
                  }
                }
                """);

        verify(walletService).createWallet(
                UUID.fromString("90be3875-2f50-4cb1-835c-504afb0a67f6"),
                false,
                "ngoc.anh");
    }

    @Test
    void publicIdentitySnapshotSynchronizesExistingWalletUsername() {
        WalletService walletService = mock(WalletService.class);
        UserRegisteredConsumer consumer =
                new UserRegisteredConsumer(walletService, new ObjectMapper().findAndRegisterModules());

        consumer.handleUserRegistered("""
                {
                  "eventId": "event-2",
                  "eventType": "user.public-identity.snapshot",
                  "userId": "90be3875-2f50-4cb1-835c-504afb0a67f6",
                  "payload": {
                    "username": "ngoc.anh"
                  }
                }
                """);

        verify(walletService).syncUsername(
                UUID.fromString("90be3875-2f50-4cb1-835c-504afb0a67f6"),
                "ngoc.anh");
    }
}
