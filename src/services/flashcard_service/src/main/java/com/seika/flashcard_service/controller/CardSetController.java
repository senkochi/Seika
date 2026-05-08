package com.seika.flashcard_service.controller;

import com.seika.flashcard_service.config.RabbitMQConfig;
import com.seika.flashcard_service.dto.CardSetCreateDTO;
import com.seika.flashcard_service.dto.CardSetDTO;
import com.seika.flashcard_service.dto.LearnProgressDTO;
import com.seika.flashcard_service.service.CardSetService;
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
    public ResponseEntity<CardSetDTO> create(
            @Valid @RequestBody CardSetCreateDTO req,
            @AuthenticationPrincipal Jwt jwt){
        String authorId = jwt.getSubject();
        CardSetDTO cardSet = cardSetService.create(req, authorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(cardSet);
    }

    @GetMapping()
    public List<CardSetDTO> getMarket(){
        return cardSetService.getAll();
    }

    @GetMapping("/author/{userId}")
    public List<CardSetDTO> getByAuthor(@PathVariable String userId){
        return cardSetService.getByAuthor(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CardSetDTO> getById(@PathVariable String id){
        return ResponseEntity.ok(cardSetService.getById(id));
    }

    @GetMapping("/search")
    public List<CardSetDTO> search(@RequestParam String key) {
        return cardSetService.getByKeyword(key);
    }

    @PostMapping("/buy")
    public ResponseEntity<?> buy(
            @RequestParam String id,
            @AuthenticationPrincipal Jwt jwt
    ){
        String userId = jwt.getClaim("userId");
        cardSetService.buy(id, userId, jwt.getTokenValue());
        return ResponseEntity.ok("Đã mua thẻ thành công");
    }

    @PostMapping("/learn")
    public ResponseEntity<?> sendProgress(@RequestBody LearnProgressDTO req){
        boolean exists = cardSetService.isCardSetExists(req.getCardSetId());
        if(!exists){
            return ResponseEntity.badRequest().body("Cardset ID không tồn tại");
        }

        req.setCreatedAt(LocalDateTime.now());
        rabbitTemplate.convertAndSend(RabbitMQConfig.LEARN_FANOUT_EXCHANGE, req);
        return ResponseEntity.ok("Đã ghi nhận, tiến độ đang được xử lí");
    }
}

