package com.seika.flashcard_service.repository;

import com.seika.flashcard_service.domain.Purchase;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PurchaseRepository extends MongoRepository<Purchase, String> {
    boolean existsByUserIdAndCardSetId(String userId, String cardSetId);

    List<Purchase> findByUserId(String userId);

    List<Purchase> findByCardSetId(String cardSetId);
}
