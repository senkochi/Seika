package com.seika.quiz_service.dto.quiz;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.seika.quiz_service.constant.enums.QuizType;
import com.seika.quiz_service.dto.quiz.request_sub_types.FillInBlankRequest;
import com.seika.quiz_service.dto.quiz.request_sub_types.MatchingRequest;
import com.seika.quiz_service.dto.quiz.request_sub_types.McqRequest;
import com.seika.quiz_service.dto.quiz.request_sub_types.ReorderRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = McqRequest.class, name = "MULTIPLE_CHOICE"),
        @JsonSubTypes.Type(value = ReorderRequest.class, name = "REORDER"),
        @JsonSubTypes.Type(value = MatchingRequest.class, name = "MATCHING"),
        @JsonSubTypes.Type(value = FillInBlankRequest.class, name = "FILL_IN_BLANK")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class QuizCreateRequest {
    private String questionText;
    private QuizType type;
}
