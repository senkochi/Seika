package com.seika.quiz_service.dto.quiz.request_sub_types;

import com.fasterxml.jackson.annotation.JsonTypeName;
import com.seika.quiz_service.dto.quiz.QuizCreateRequest;
import lombok.Data;

import java.util.Map;

@Data
@JsonTypeName("MATCHING")
public class MatchingRequest extends QuizCreateRequest {
    private Map<String, String> matchingPairs;
}
