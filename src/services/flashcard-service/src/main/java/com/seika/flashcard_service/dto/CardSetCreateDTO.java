package com.seika.flashcard_service.dto;

import com.seika.flashcard_service.domain.CardSet;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CardSetCreateDTO {
    private String title;
    private String description;
    private Double price;
    private List<CardSet.Card> cards;
}
