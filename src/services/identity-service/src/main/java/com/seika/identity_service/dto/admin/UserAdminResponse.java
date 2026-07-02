package com.seika.identity_service.dto.admin;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserAdminResponse {
    String id;
    String username;
    Set<String> roles;
    boolean enabled;
}