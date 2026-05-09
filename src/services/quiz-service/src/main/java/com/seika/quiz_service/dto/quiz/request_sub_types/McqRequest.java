package com.seika.quiz_service.dto.quiz.request_sub_types;

import com.fasterxml.jackson.annotation.JsonTypeName;
import com.seika.quiz_service.dto.quiz.QuizCreateRequest;
import lombok.Data;

import java.util.List;

@Data
@JsonTypeName("MULTIPLE_CHOICE")
public class McqRequest extends QuizCreateRequest {
    private List<String> options;
    private int correctOptionIndex;
}
