package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.AdminActionLog;
import com.seika.marketplace_service.repository.AdminActionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminActionLogService {

    private final AdminActionLogRepository adminActionLogRepository;

    @Transactional
    public AdminActionLog logAction(String adminId, String actionType, String targetType,
                                    String targetId, String reason, String metadata) {
        log.info("Admin action logged: adminId={}, actionType={}, targetType={}, targetId={}, reason={}",
                adminId, actionType, targetType, targetId, reason);
        AdminActionLog logEntry = AdminActionLog.builder()
                .adminId(adminId)
                .actionType(actionType)
                .targetType(targetType)
                .targetId(targetId)
                .reason(reason)
                .metadata(metadata)
                .build();
        return adminActionLogRepository.save(logEntry);
    }
}
