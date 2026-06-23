package com.seika.quiz_service.repository;

import com.seika.quiz_service.domain.QuizSet;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizSetRepository extends MongoRepository<QuizSet, String> {
    List<QuizSet> findByCreatedBy(String createdBy);
}
