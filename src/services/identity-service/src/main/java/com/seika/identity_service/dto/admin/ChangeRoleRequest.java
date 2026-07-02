package com.seika.identity_service.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChangeRoleRequest {
    @NotBlank
    @Pattern(regexp = "STUDENT|TEACHER", message = "Role phải là STUDENT hoặc TEACHER")
    String role;
}