package com.seika.marketplace_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

import com.seika.marketplace_service.entity.InboxEvent;

public interface InboxEventRepository extends JpaRepository<InboxEvent, String> {
	Optional<InboxEvent> findByMessageId(String messageId);
}
