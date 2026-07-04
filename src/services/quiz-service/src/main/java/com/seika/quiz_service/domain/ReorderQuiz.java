package com.seika.quiz_service.domain;

import com.fasterxml.jackson.annotation.JsonTypeName;
import com.seika.quiz_service.constant.enums.QuizType;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.TypeAlias;

import java.util.List;

@Data
@TypeAlias("REORDER")
@JsonTypeName("REORDER")
public class ReorderQuiz extends BaseQuiz {
    private List<String> correctOrder;

    public ReorderQuiz() {
        super(QuizType.REORDER);
    }
}
