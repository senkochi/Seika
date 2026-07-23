package com.seika.identity_service.service;

import com.seika.identity_service.dto.admin.PublicIdentitySnapshotResponse;
import com.seika.identity_service.entity.User;
import com.seika.identity_service.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PublicIdentitySnapshotServiceTest {

    @Test
    void publishesOneSnapshotPerUserInRequestedPage() {
        UserRepository userRepository = mock(UserRepository.class);
        UserEventPublisher eventPublisher = mock(UserEventPublisher.class);
        User first = User.builder().id("student-1").username("ngoc.anh").build();
        User second = User.builder().id("teacher-1").username("lan.nguyen").build();

        when(userRepository.findAll(org.mockito.ArgumentMatchers.any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(first, second)));

        PublicIdentitySnapshotService service =
                new PublicIdentitySnapshotService(userRepository, eventPublisher);

        PublicIdentitySnapshotResponse response = service.publishPage(0, 100);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(eventPublisher, org.mockito.Mockito.times(2))
                .publishPublicIdentitySnapshot(userCaptor.capture());
        assertThat(userCaptor.getAllValues()).containsExactly(first, second);
        assertThat(response.getPublished()).isEqualTo(2);
        assertThat(response.getPage()).isZero();
        assertThat(response.getTotalPages()).isEqualTo(1);
        assertThat(response.getTotalElements()).isEqualTo(2);
    }
}
