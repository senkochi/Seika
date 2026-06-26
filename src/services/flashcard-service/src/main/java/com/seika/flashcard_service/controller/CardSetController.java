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
        String authorId = jwt.getClaimAsString("userId");
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
            return ResponseEntity.badRequest().body("Cardset ID kh\u00f4ng t\u1ed3n t\u1ea1i");
        }

        req.setCreatedAt(LocalDateTime.now());
        rabbitTemplate.convertAndSend(RabbitMQConfig.LEARN_FANOUT_EXCHANGE, req);
        return ResponseEntity.ok("\u0110\u00e3 ghi nh\u1eadn, ti\u1ebfn \u0111\u1ed9 \u0111ang \u0111\u01b0\u1ee3c x\u1eed l\u00ed");
    }

    @PostMapping("/complete")
    public ResponseEntity<?> completeDeck(
            @RequestParam String deckId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        
        com.seika.flashcard_service.dto.DeckCompletedEvent event = com.seika.flashcard_service.dto.DeckCompletedEvent.builder()
                .eventId(java.util.UUID.randomUUID().toString())
                .correlationId("deck-" + deckId + "-user-" + userId)
                .userId(userId)
                .deckId(deckId)
                .completedAt(LocalDateTime.now().toString())
                .build();
                
        rabbitTemplate.convertAndSend(RabbitMQConfig.LEARNING_EVENTS_EXCHANGE, RabbitMQConfig.DECK_COMPLETED_ROUTING_KEY, event);
        return ResponseEntity.ok("Deck completed event published");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
        String requesterId = jwt.getSubject();
        cardSetService.delete(id, requesterId);
        return ResponseEntity.ok("X\u00f3a b\u1ed9 th\u1ebb th\u00e0nh c\u00f4ng");
    }
}

