package com.seika.quiz_service.dto.quiz;

import com.seika.quiz_service.constant.enums.QuizType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class QuizResponse {
    private String id;
    private String questionText;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private QuizType type;

    // MULTIPLE_CHOICE
    private List<String> options;
    private Integer correctOptionIndex;

    // MATCHING
    private Map<String, String> matchingPairs;

    // REORDER
    private List<String> correctOrder;

    // FILL_IN_THE_BLANK
    private List<String> acceptedAnswers;
}
