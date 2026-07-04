package com.seika.quiz_service.dto.quiz.request_sub_types;

import com.fasterxml.jackson.annotation.JsonTypeName;
import com.seika.quiz_service.dto.quiz.QuizCreateRequest;
import lombok.Data;

import java.util.List;

@Data
@JsonTypeName("FILL_IN_BLANK")
public class FillInBlankRequest extends QuizCreateRequest {
    private List<String> acceptedAnswers;
}
