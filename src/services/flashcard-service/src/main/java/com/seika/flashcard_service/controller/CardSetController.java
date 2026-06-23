package com.seika.flashcard_service.controller;

import com.seika.flashcard_service.config.RabbitMQConfig;
import com.seika.flashcard_service.dto.CardSetCreateDTO;
import com.seika.flashcard_service.dto.CardSetDTO;
import com.seika.flashcard_service.dto.LearnProgressDTO;
import com.seika.flashcard_service.service.CardSetService;
import com.seika.flashcard_service.shared.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/flashcards")
public class CardSetController {
    @Autowired
    private CardSetService cardSetService;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @PostMapping
    public ResponseEntity<ApiResponse<CardSetDTO>> create(
            @Valid @RequestBody CardSetCreateDTO req,
            @AuthenticationPrincipal Jwt jwt){
        String authorId = jwt.getSubject();
        CardSetDTO cardSet = cardSetService.create(req, authorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(cardSet));
    }

    @GetMapping()
    public ResponseEntity<ApiResponse<List<CardSetDTO>>> getMarket(){
        return ResponseEntity.ok(ApiResponse.success(cardSetService.getAll()));
    }

    @GetMapping("/author/{userId}")
    public ResponseEntity<ApiResponse<List<CardSetDTO>>> getByAuthor(@PathVariable String userId){
        return ResponseEntity.ok(ApiResponse.success(cardSetService.getByAuthor(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CardSetDTO>> getById(@PathVariable String id){
        return ResponseEntity.ok(ApiResponse.success(cardSetService.getById(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<CardSetDTO>>> search(@RequestParam String key) {
        return ResponseEntity.ok(ApiResponse.success(cardSetService.getByKeyword(key)));
    }

    @PostMapping("/buy")
    public ResponseEntity<ApiResponse<Void>> buy(
            @RequestParam String id,
            @AuthenticationPrincipal Jwt jwt
    ){
        String userId = jwt.getClaim("userId");
        cardSetService.buy(id, userId, jwt.getTokenValue());
        return ResponseEntity.ok(ApiResponse.success(null, "Đã mua thẻ thành công"));
    }

    @PostMapping("/learn")
    public ResponseEntity<ApiResponse<Void>> sendProgress(@RequestBody LearnProgressDTO req){
        boolean exists = cardSetService.isCardSetExists(req.getCardSetId());
        if(!exists){
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Cardset ID không tồn tại"));
        }

        req.setCreatedAt(LocalDateTime.now());
        rabbitTemplate.convertAndSend(RabbitMQConfig.LEARN_FANOUT_EXCHANGE, req);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã ghi nhận, tiến độ đang được xử lí"));
    }
}

