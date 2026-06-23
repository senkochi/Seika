package com.seika.flashcard_service.dto;

import com.seika.flashcard_service.domain.CardSet;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardSetDTO {
    private String id;
    private String title;
    private String description;
    private String authorId;
    private BigDecimal price;
    private Integer totalCards;
    private List<CardSet.Card> cards;
}