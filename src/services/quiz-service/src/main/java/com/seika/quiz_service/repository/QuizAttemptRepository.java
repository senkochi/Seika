package com.seika.quiz_service.repository;

import com.seika.quiz_service.domain.QuizAttempt;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface QuizAttemptRepository extends MongoRepository<QuizAttempt, String> {

    long countByQuizSetIdIn(Collection<String> quizSetIds);

    long countByQuizSetIdInAndPassed(Collection<String> quizSetIds, boolean passed);

    List<QuizAttempt> findByQuizSetIdInOrderByAttemptAtDesc(Collection<String> quizSetIds);
}