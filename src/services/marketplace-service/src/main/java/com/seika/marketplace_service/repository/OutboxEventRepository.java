package com.seika.marketplace_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

import com.seika.marketplace_service.entity.OutboxEvent;
import com.seika.marketplace_service.enums.OutboxStatus;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, String> {
	List<OutboxEvent> findTop50ByStatusInOrderByCreatedAtAsc(List<OutboxStatus> statuses);
}
