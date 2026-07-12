package com.seika.marketplace_service.repository;

import com.seika.marketplace_service.entity.CollusionFlag;
import com.seika.marketplace_service.enums.CollusionFlagStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CollusionFlagRepository extends JpaRepository<CollusionFlag, String> {
    Page<CollusionFlag> findByStatusOrderByCreatedAtDesc(CollusionFlagStatus status, Pageable pageable);
    List<CollusionFlag> findByTeacherIdAndBuyerIdAndStatusIn(String teacherId, String buyerId, List<CollusionFlagStatus> statuses);
    Optional<CollusionFlag> findFirstByTeacherIdAndBuyerIdAndStatusInOrderByCreatedAtDesc(String teacherId, String buyerId, List<CollusionFlagStatus> statuses);
    boolean existsByTeacherIdAndBuyerIdAndStatusIn(String teacherId, String buyerId, List<CollusionFlagStatus> statuses);
}
