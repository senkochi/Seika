package com.seika.flashcard_service.service;

import com.seika.flashcard_service.client.WalletClient;
import com.seika.flashcard_service.domain.CardSet;
import com.seika.flashcard_service.domain.Purchase;
import com.seika.flashcard_service.dto.CardSetCreateDTO;
import com.seika.flashcard_service.dto.CardSetDTO;
import com.seika.flashcard_service.dto.WalletDTO;
import com.seika.flashcard_service.mapper.CardSetMapper;
import com.seika.flashcard_service.repository.CardSetRepository;
import com.seika.flashcard_service.repository.PurchaseRepository;
import feign.FeignException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CardSetService {

    @Autowired
    private CardSetRepository cardSetRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private WalletClient walletClient;

    @Autowired
    private CardSetMapper mapper;

    @Autowired
    private ContentEventPublisher contentEventPublisher;

    public CardSetDTO create(CardSetCreateDTO req, String authorId){
        CardSet cardSet = mapper.toEntity(req);
        cardSet.setAuthorId(authorId);
        CardSet res = cardSetRepository.save(cardSet);
        // Publish event so profile-service can update teacher stats and marketplace can create product
        contentEventPublisher.publishFlashcardSetCreated(
                res.getId(), 
                authorId, 
                res.getTitle(), 
                res.getDescription(), 
                res.getPrice()
        );
        return mapper.toDto(res);
    }

    public List<CardSetDTO> getAll(){
        return mapper.toDtoList(cardSetRepository.findAll());
    }

    public List<CardSetDTO> getByAuthor(String authorId){
        return mapper.toDtoList(cardSetRepository.findByAuthorId(authorId));
    }

    public CardSetDTO getById(String id){
        return mapper.toDto(cardSetRepository.findById(id).orElseThrow());
    }

    public List<CardSetDTO> getByKeyword(String keyword){
        return mapper.toDtoList(cardSetRepository.findByTitleContainingIgnoreCase(keyword));
    }

    public void buy(String cardSetId, String userId, String token){
        CardSet cardSet = cardSetRepository.findById(cardSetId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bộ thẻ"));

        if(purchaseRepository.existsByUserIdAndCardSetId(userId, cardSetId)){
            throw new IllegalStateException("Bạn đã sở hữu bộ thẻ này rồi");
        }

        WalletDTO req = new WalletDTO(cardSet.getPrice(), cardSet.getTitle());
        String fullToken = "Bearer " + token;

        try{
            walletClient.spend(fullToken, req);
        } catch (FeignException ex){
            System.err.println("Status code từ Wallet: " + ex.status());
            // In toàn bộ Body mà Wallet gửi sang
            System.err.println("Body lỗi từ Wallet: " + ex.contentUTF8());
            ex.printStackTrace();
            throw new RuntimeException("Giao dịch không hợp lệ hoặc lỗi hệ thống");
        }

        try{
            Purchase purchase = Purchase.builder()
                    .userId(userId)
                    .cardSetId(cardSetId)
                    .purchasePrice(cardSet.getPrice())
                    .build();
            purchaseRepository.save(purchase);
        } catch (Exception ex){
            walletClient.deposit(token, new WalletDTO(cardSet.getPrice(), "Hoàn tiền lỗi hệ thống"));
            throw new RuntimeException("Lỗi lưu trữ, đã hoàn lại tiền vào ví cho bạn!");
        }
    }

    public boolean isCardSetExists(String id){
        return cardSetRepository.existsById(id);
    }

    /**
     * Xóa flashcard set – chỉ author mới được xóa
     */
    public void delete(String id, String requesterId){
        CardSet cardSet = cardSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bộ thẻ: " + id));
        if (!cardSet.getAuthorId().equals(requesterId)){
            throw new IllegalStateException("Bạn không có quyền xóa bộ thẻ này");
        }
        cardSetRepository.deleteById(id);
    }

}
