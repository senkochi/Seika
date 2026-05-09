package com.seika.quiz_service.domain;

import com.fasterxml.jackson.annotation.JsonTypeName;
import com.seika.quiz_service.constant.enums.QuizType;
import lombok.Data;
import org.springframework.data.annotation.TypeAlias;

import java.util.Map;

@Data
@TypeAlias("MATCHING")
@JsonTypeName("MATCHING")
public class MatchingQuiz extends BaseQuiz {
    private Map<String, String> matchingPairs;

    public MatchingQuiz() {
        super(QuizType.MATCHING);
    }
}
