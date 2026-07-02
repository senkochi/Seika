package com.seika.identity_service.dto.admin;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminDashboardStatsResponse {
    long totalTeachers;
    long totalStudents;
    long totalUsers;
    long totalEnabledUsers;
    long totalDisabledUsers;
    long pendingProducts;       // -1 nếu marketplace-service lỗi
    String totalCoinCirculation; // BigDecimal, string để tránh mất precision ở FE
}