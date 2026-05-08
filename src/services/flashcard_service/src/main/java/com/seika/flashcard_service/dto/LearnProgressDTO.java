package com.seika.flashcard_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnProgressDTO {
    private String userId;
    private String cardSetId;
    private int result;
    private LocalDateTime createdAt;
}