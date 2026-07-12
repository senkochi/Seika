package com.seika.marketplace_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollusionActionRequest {

    @NotBlank(message = "Action is required (CONFIRM_COLLUSION, MARK_MALICIOUS, DISMISS)")
    private String action;

    @NotBlank(message = "Reason must not be empty")
    private String reason;
}
