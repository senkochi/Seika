package com.seika.quiz_service.domain;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "quiz_sets")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizSet {
    @Id
    private String id;
    private String title;
    private String description;
    @Builder.Default
    private List<String> quizIds = new ArrayList<>();
    private String createdBy;
    private java.math.BigDecimal price = java.math.BigDecimal.ZERO;
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;
}
