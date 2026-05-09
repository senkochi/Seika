package com.seika.quiz_service.domain;

import com.fasterxml.jackson.annotation.JsonTypeName;
import com.seika.quiz_service.constant.enums.QuizType;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.TypeAlias;

import java.util.List;

@Data
@TypeAlias("MCQ")
@JsonTypeName("MULTIPLE_CHOICE")
public class MultipleChoiceQuiz extends BaseQuiz {
    private List<String> options;
    private int correctOptionIndex;

    public MultipleChoiceQuiz(){
        super(QuizType.MULTIPLE_CHOICE);
    }
}
