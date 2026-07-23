package com.seika.marketplace_service.repository;

import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Lock;

import java.lang.reflect.Method;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class EscrowRepositoryLockingTest {

    @Test
    void walletActionLookupsUseDatabaseWriteLocks() throws Exception {
        Method byId = EscrowTransactionRepository.class.getMethod("findById", String.class);
        Method byOrderItem = EscrowTransactionRepository.class.getMethod("findByOrderItemId", String.class);
        Method dueEscrows = EscrowTransactionRepository.class.getMethod(
                "findByStatusAndNeedsAdminDecisionFalseAndReleaseAtLessThanEqualAndCreditRequestedAtIsNullAndRefundRequestedAtIsNull",
                com.seika.marketplace_service.enums.EscrowStatus.class,
                Instant.class);

        assertThat(byId.getAnnotation(Lock.class).value()).isEqualTo(LockModeType.PESSIMISTIC_WRITE);
        assertThat(byOrderItem.getAnnotation(Lock.class).value()).isEqualTo(LockModeType.PESSIMISTIC_WRITE);
        assertThat(dueEscrows.getAnnotation(Lock.class).value()).isEqualTo(LockModeType.PESSIMISTIC_WRITE);
    }
}
