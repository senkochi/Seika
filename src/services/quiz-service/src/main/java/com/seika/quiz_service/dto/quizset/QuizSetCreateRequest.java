package com.seika.quiz_service.dto.quizset;

import com.seika.quiz_service.dto.quiz.QuizCreateRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizSetCreateRequest {
    private String title;
    private String description;
    private java.math.BigDecimal price;
    private List<QuizCreateRequest> questions;
}
