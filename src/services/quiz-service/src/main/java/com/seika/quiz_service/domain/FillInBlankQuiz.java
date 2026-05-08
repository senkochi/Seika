package com.seika.quiz_service.domain;

import com.seika.quiz_service.constant.enums.QuizType;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.TypeAlias;

import java.util.List;

@Data
@TypeAlias("FILL_BLANK")
public class FillInBlankQuiz extends BaseQuiz {
    // Chấp nhận danh sách các đáp án (đề phòng đồng nghĩa)
    private List<String> acceptedAnswers;

    public FillInBlankQuiz() {
        super(QuizType.FILL_IN_THE_BLANK);
    }
}
