package com.seika.flashcard_service.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardSetDTO {
    private String id;
    private String title;
    private String description;
    private BigDecimal price;
    private Integer totalCards;
}
