package com.seika.identity_service.service;

import com.seika.identity_service.dto.admin.PublicIdentitySnapshotResponse;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PublicIdentitySnapshotSchedulerTest {

    @Test
    void reconciliationPublishesEveryIdentityPage() {
        PublicIdentitySnapshotService snapshotService =
                mock(PublicIdentitySnapshotService.class);
        when(snapshotService.publishPage(0, 100)).thenReturn(response(0, 2));
        when(snapshotService.publishPage(1, 100)).thenReturn(response(1, 2));

        PublicIdentitySnapshotScheduler scheduler =
                new PublicIdentitySnapshotScheduler(snapshotService, 100);

        scheduler.reconcile();

        var ordered = inOrder(snapshotService);
        ordered.verify(snapshotService).publishPage(0, 100);
        ordered.verify(snapshotService).publishPage(1, 100);
        ordered.verifyNoMoreInteractions();
    }

    private PublicIdentitySnapshotResponse response(int page, int totalPages) {
        return PublicIdentitySnapshotResponse.builder()
                .page(page)
                .size(100)
                .totalPages(totalPages)
                .build();
    }
}
