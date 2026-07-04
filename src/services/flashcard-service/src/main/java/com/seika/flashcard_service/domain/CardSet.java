package com.seika.flashcard_service.domain;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.util.List;

@Document(collection = "card_sets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CardSet {
    @Id
    private String id;

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;
    private String description;
    private String authorId;

    @Min(value = 0, message = "Giá không được nhỏ hơn 0")
    private BigDecimal price = BigDecimal.ZERO;

    @NotEmpty(message = "Bộ thẻ phải có ít nhất một thẻ")
    private List<Card> cards;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    public static class Card {
        @NotBlank(message = "Mặt trước không được để trống")
        private String frontSide;

        @NotBlank(message = "Mặt sau không được để trống")
        private String backSide;
    }
}

