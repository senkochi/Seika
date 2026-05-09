package com.seika.flashcard_service.domain;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "purchase")
@CompoundIndex(name = "user_cardset_unique", def = "{'userId': 1, 'cardSetId': 1}", unique = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Purchase {
    @Id
    private String id;

    @NotBlank(message = "ID người dùng không được để trống")
    private String userId;

    @NotBlank(message = "ID bộ thẻ không được để trống")
    private String cardSetId;

    @Min(value = 0, message = "Giá bộ thẻ không được nhỏ hơn 0")
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @Builder.Default
    private LocalDateTime purchaseAt = LocalDateTime.now();
}
