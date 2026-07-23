package com.seika.marketplace_service.repository;

import com.seika.marketplace_service.entity.AdminActionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminActionLogRepository extends JpaRepository<AdminActionLog, String> {
    List<AdminActionLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, String targetId);
    Page<AdminActionLog> findByAdminIdOrderByCreatedAtDesc(String adminId, Pageable pageable);
}
