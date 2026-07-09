package com.seika.marketplace_service.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMarketplaceConfigRequest {
    @NotBlank
    private String value;
}
