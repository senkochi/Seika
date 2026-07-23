package com.seika.identity_service.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicIdentitySnapshotResponse {
    private int published;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
