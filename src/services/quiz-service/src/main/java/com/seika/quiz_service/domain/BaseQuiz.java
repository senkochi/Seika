package com.seika.quiz_service.domain;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.seika.quiz_service.constant.enums.QuizType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "quizzes")
@NoArgsConstructor
@AllArgsConstructor
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type" // use type field to differentiate
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = MultipleChoiceQuiz.class, name = "MULTIPLE_CHOICE"),
        @JsonSubTypes.Type(value = ReorderQuiz.class, name = "REORDER"),
        @JsonSubTypes.Type(value = MatchingQuiz.class, name = "MATCHING"),
        @JsonSubTypes.Type(value = FillInBlankQuiz.class, name = "FILL_IN_BLANK")
})
public abstract class BaseQuiz {
    @Id
    private String id;
    private String questionText;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;
    private String createdBy;
    private QuizType type;

    public BaseQuiz(QuizType type) {
        this.type = type;
    }
}
