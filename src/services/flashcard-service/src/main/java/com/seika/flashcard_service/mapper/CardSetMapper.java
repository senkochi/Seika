package com.seika.flashcard_service.mapper;

import com.seika.flashcard_service.domain.CardSet;
import com.seika.flashcard_service.dto.CardSetCreateDTO;
import com.seika.flashcard_service.dto.CardSetDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CardSetMapper {
    @Mapping(target = "totalCards", expression = "java(cardSet.getCards() != null ? cardSet.getCards().size() : 0)")
    CardSetDTO toDto(CardSet cardSet);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "authorId", ignore = true)
    CardSet toEntity(CardSetCreateDTO cardSetCreateDTO);

    List<CardSetDTO> toDtoList(List<CardSet> cardSets);
}
