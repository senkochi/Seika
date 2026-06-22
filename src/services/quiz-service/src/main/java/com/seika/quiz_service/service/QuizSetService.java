package com.seika.quiz_service.service;

import com.seika.quiz_service.domain.QuizSet;
import com.seika.quiz_service.dto.quiz.QuizResponse;
import com.seika.quiz_service.dto.quizset.QuizSetCreateRequest;
import com.seika.quiz_service.dto.quizset.QuizSetResponse;
import com.seika.quiz_service.exception.ForbiddenException;
import com.seika.quiz_service.exception.ResourceNotFoundException;
import com.seika.quiz_service.repository.QuizSetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizSetService {

    private final QuizSetRepository quizSetRepository;
    private final QuizService quizService;

    @Transactional
    public QuizSetResponse create(QuizSetCreateRequest request, String createdBy) {
        log.info("Creating new QuizSet: {} by user: {}", request.getTitle(), createdBy);

        // Create individual quizzes and collect their IDs
        List<QuizResponse> createdQuizzes = request.getQuestions().stream()
                .map(qReq -> quizService.create(qReq, createdBy))
                .collect(Collectors.toList());

        List<String> quizIds = createdQuizzes.stream()
                .map(QuizResponse::getId)
                .collect(Collectors.toList());

        QuizSet quizSet = QuizSet.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .quizIds(quizIds)
                .createdBy(createdBy)
                .build();

        QuizSet saved = quizSetRepository.save(quizSet);

        return convertToResponse(saved, createdQuizzes);
    }

    public List<QuizSetResponse> getByCreatedBy(String userId) {
        return quizSetRepository.findByCreatedBy(userId).stream()
                .map(this::convertToResponseWithFetchedQuizzes)
                .collect(Collectors.toList());
    }

    public QuizSetResponse getById(String id) {
        QuizSet quizSet = quizSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QuizSet", id));
        return convertToResponseWithFetchedQuizzes(quizSet);
    }

    public void deleteByOwner(String id, String requesterId) {
        log.info("Deleting QuizSet id: {} requested by: {}", id, requesterId);
        QuizSet quizSet = quizSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QuizSet", id));

        if (!quizSet.getCreatedBy().equals(requesterId)) {
            throw new ForbiddenException("You are not allowed to delete this QuizSet");
        }

        // Optional: delete associated quizzes
        quizSet.getQuizIds().forEach(quizId -> {
            try {
                quizService.deleteByOwner(quizId, requesterId);
            } catch (Exception e) {
                log.warn("Could not delete quiz {} when deleting quizSet {}", quizId, id);
            }
        });

        quizSetRepository.deleteById(id);
        log.info("QuizSet {} deleted successfully", id);
    }

    private QuizSetResponse convertToResponseWithFetchedQuizzes(QuizSet quizSet) {
        List<QuizResponse> quizzes = quizSet.getQuizIds().stream()
                .map(id -> {
                    try {
                        return quizService.getById(id);
                    } catch (Exception e) {
                        log.warn("Could not fetch quiz {} for quizSet {}", id, quizSet.getId());
                        return null;
                    }
                })
                .filter(q -> q != null)
                .collect(Collectors.toList());

        return convertToResponse(quizSet, quizzes);
    }

    private QuizSetResponse convertToResponse(QuizSet quizSet, List<QuizResponse> quizzes) {
        return QuizSetResponse.builder()
                .id(quizSet.getId())
                .title(quizSet.getTitle())
                .description(quizSet.getDescription())
                .quizzes(quizzes)
                .createdBy(quizSet.getCreatedBy())
                .createdAt(quizSet.getCreatedAt())
                .updatedAt(quizSet.getUpdatedAt())
                .build();
    }
}
