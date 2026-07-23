package com.seika.identity_service.service;

import com.seika.identity_service.dto.admin.PublicIdentitySnapshotResponse;
import com.seika.identity_service.entity.User;
import com.seika.identity_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicIdentitySnapshotService {

    private final UserRepository userRepository;
    private final UserEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public PublicIdentitySnapshotResponse publishPage(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("id").ascending());
        Page<User> users = userRepository.findAll(pageable);
        int published = 0;

        for (User user : users.getContent()) {
            eventPublisher.publishPublicIdentitySnapshot(user);
            published++;
        }

        log.info(
                "Published public identity snapshot page={} size={} published={}",
                page,
                size,
                published);
        return PublicIdentitySnapshotResponse.builder()
                .published(published)
                .page(users.getNumber())
                .size(users.getSize())
                .totalElements(users.getTotalElements())
                .totalPages(users.getTotalPages())
                .build();
    }
}
