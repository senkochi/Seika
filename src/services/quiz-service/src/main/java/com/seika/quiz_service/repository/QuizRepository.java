package com.seika.quiz_service.repository;

import com.seika.quiz_service.domain.BaseQuiz;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends MongoRepository<BaseQuiz, String> {
    
    /**
     * Find quizzes by type
     */
    List<BaseQuiz> findByType(String type);
    
    /**
     * Find quizzes created by a specific user
     */
    List<BaseQuiz> findByCreatedBy(String createdBy);
    
    /**
     * Find quiz by ID
     */
    Optional<BaseQuiz> findById(String id);
}
