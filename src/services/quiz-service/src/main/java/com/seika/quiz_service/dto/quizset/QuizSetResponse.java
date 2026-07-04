package com.seika.quiz_service.dto.quizset;

import com.seika.quiz_service.dto.quiz.QuizResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizSetResponse {
    private String id;
    private String title;
    private String description;
    private java.math.BigDecimal price;
    private List<QuizResponse> quizzes;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
