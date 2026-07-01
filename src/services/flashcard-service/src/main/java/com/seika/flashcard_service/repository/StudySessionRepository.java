package com.seika.flashcard_service.repository;

import com.seika.flashcard_service.domain.StudySession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface StudySessionRepository extends MongoRepository<StudySession, String> {

    long countByCardSetIdIn(Collection<String> cardSetIds);

    long countDistinctUserIdByCardSetIdIn(Collection<String> cardSetIds);

    List<StudySession> findByCardSetIdInOrderByStudiedAtDesc(Collection<String> cardSetIds);
}