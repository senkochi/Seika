package com.seika.flashcard_service.service;

import com.seika.flashcard_service.client.WalletClient;
import com.seika.flashcard_service.config.RabbitMQConfig;
import com.seika.flashcard_service.domain.CardSet;
import com.seika.flashcard_service.domain.ProductSales;
import com.seika.flashcard_service.domain.Purchase;
import com.seika.flashcard_service.domain.StudySession;
import com.seika.flashcard_service.dto.CardSetCreateDTO;
import com.seika.flashcard_service.dto.CardSetDTO;
import com.seika.flashcard_service.dto.LearnProgressDTO;
import com.seika.flashcard_service.dto.SystemConfigDTO;
import com.seika.flashcard_service.dto.WalletDTO;
import com.seika.flashcard_service.dto.statistics.FlashcardStatisticsOverview;
import com.seika.flashcard_service.dto.statistics.StudentActivityResponse;
import com.seika.flashcard_service.dto.statistics.TopCardSetResponse;
import com.seika.flashcard_service.mapper.CardSetMapper;
import com.seika.flashcard_service.repository.CardSetRepository;
import com.seika.flashcard_service.repository.ProductSalesRepository;
import com.seika.flashcard_service.repository.PurchaseRepository;
import com.seika.flashcard_service.repository.StudySessionRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CardSetService {

    private final CardSetRepository cardSetRepository;
    private final PurchaseRepository purchaseRepository;
    private final StudySessionRepository studySessionRepository;
    private final ProductSalesRepository productSalesRepository;
    private final WalletClient walletClient;
    private final CardSetMapper mapper;
    private final ContentEventPublisher contentEventPublisher;
    private final RabbitTemplate rabbitTemplate;

    public CardSetDTO create(CardSetCreateDTO req, String authorId){
        if (req.getPrice() != null && req.getPrice() < 0) {
            throw new IllegalArgumentException("Giá sản phẩm không được nhỏ hơn 0!");
        }
        if (req.getPrice() != null && req.getPrice() > 0) {
            BigDecimal minPrice = new BigDecimal("10");
            BigDecimal maxPrice = new BigDecimal("100000");
            try {
                List<SystemConfigDTO> configs = walletClient.getConfigs();
                if (configs != null) {
                    for (SystemConfigDTO cfg : configs) {
                        if ("MIN_PRODUCT_PRICE".equals(cfg.getKey()) && cfg.getValue() != null) {
                            minPrice = new BigDecimal(cfg.getValue());
                        } else if ("MAX_PRODUCT_PRICE".equals(cfg.getKey()) && cfg.getValue() != null) {
                            maxPrice = new BigDecimal(cfg.getValue());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Không thể lấy config từ wallet-service, dùng giá trị mặc định: {}", e.getMessage());
            }
            BigDecimal reqPrice = BigDecimal.valueOf(req.getPrice());
            if (reqPrice.compareTo(minPrice) < 0 || reqPrice.compareTo(maxPrice) > 0) {
                throw new IllegalArgumentException("Giá sản phẩm phải nằm trong khoảng từ " + minPrice + " đến " + maxPrice + " coin!");
            }
        }
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

    public CardSetDTO update(String id, CardSetCreateDTO req, String requesterId){
        CardSet cardSet = cardSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bộ thẻ: " + id));
        if (!cardSet.getAuthorId().equals(requesterId)){
            throw new IllegalStateException("Bạn không có quyền cập nhật bộ thẻ này");
        }

        if (req.getPrice() != null && req.getPrice() < 0) {
            throw new IllegalArgumentException("Giá sản phẩm không được nhỏ hơn 0!");
        }
        if (req.getPrice() != null && req.getPrice() > 0) {
            BigDecimal minPrice = new BigDecimal("10");
            BigDecimal maxPrice = new BigDecimal("100000");
            try {
                List<SystemConfigDTO> configs = walletClient.getConfigs();
                if (configs != null) {
                    for (SystemConfigDTO cfg : configs) {
                        if ("MIN_PRODUCT_PRICE".equals(cfg.getKey()) && cfg.getValue() != null) {
                            minPrice = new BigDecimal(cfg.getValue());
                        } else if ("MAX_PRODUCT_PRICE".equals(cfg.getKey()) && cfg.getValue() != null) {
                            maxPrice = new BigDecimal(cfg.getValue());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Không thể lấy config từ wallet-service, dùng giá trị mặc định: {}", e.getMessage());
            }
            BigDecimal reqPrice = BigDecimal.valueOf(req.getPrice());
            if (reqPrice.compareTo(minPrice) < 0 || reqPrice.compareTo(maxPrice) > 0) {
                throw new IllegalArgumentException("Giá sản phẩm phải nằm trong khoảng từ " + minPrice + " đến " + maxPrice + " coin!");
            }
        }

        cardSet.setTitle(req.getTitle());
        cardSet.setDescription(req.getDescription());
        cardSet.setPrice(req.getPrice() != null ? BigDecimal.valueOf(req.getPrice()) : BigDecimal.ZERO);
        cardSet.setCards(req.getCards());

        CardSet res = cardSetRepository.save(cardSet);

        // Publish event for updating marketplace product
        contentEventPublisher.publishFlashcardSetUpdated(
                res.getId(),
                requesterId,
                res.getTitle(),
                res.getDescription(),
                res.getPrice()
        );

        return mapper.toDto(res);
    }

    // -------------------------------------------------------------------------
    // Learn progress + teacher statistics
    // -------------------------------------------------------------------------

    /**
     * Persist a StudySession document for teacher analytics before forwarding
     * the original LearnProgress event to downstream consumers (reward-service,
     * notification-service, ...).
     *
     * <p>{@code LearnProgressDTO.result} is interpreted as 0-100 progress
     * percentage (kept consistent with quiz-service scores).
     */
    public void recordLearnProgress(LearnProgressDTO req) {
        if (req.getUserId() == null || req.getCardSetId() == null) {
            log.warn("Skipping StudySession record — missing userId/cardSetId");
            return;
        }

        boolean firstConsume = req.getResult() > 0
                && !studySessionRepository.existsByUserIdAndCardSetId(req.getUserId(), req.getCardSetId());

        StudySession session = StudySession.builder()
                .id(UUID.randomUUID().toString())
                .userId(req.getUserId())
                .cardSetId(req.getCardSetId())
                .completed(req.getResult() >= 100)
                .progress(req.getResult())
                .studiedAt(Instant.now())
                .build();
        studySessionRepository.save(session);
        if (firstConsume) {
            contentEventPublisher.publishFlashcardSetConsumed(req.getCardSetId(), req.getUserId());
        }

        // Forward to existing fanout exchange for downstream consumers
        req.setCreatedAt(req.getCreatedAt() != null ? req.getCreatedAt() : java.time.LocalDateTime.now());
        rabbitTemplate.convertAndSend(RabbitMQConfig.LEARN_FANOUT_EXCHANGE, req);
        log.info("Recorded StudySession for cardSet {} user {} progress {}",
                req.getCardSetId(), req.getUserId(), req.getResult());
    }

    /**
     * Aggregate teacher-level overview: total CardSets, total purchases (from
     * local product_sales mirror), distinct students and total revenue.
     */
    public FlashcardStatisticsOverview getStatisticsForAuthor(String authorId) {
        List<CardSet> cardSets = cardSetRepository.findByAuthorId(authorId);
        long totalCardSets = cardSets.size();

        List<ProductSales> sales = productSalesRepository.findByTeacherUserId(authorId);
        long totalPurchases = sales.size();

        BigDecimal totalRevenue = sales.stream()
                .map(ProductSales::getPrice)
                .filter(p -> p != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalStudents = sales.stream()
                .map(ProductSales::getBuyerUserId)
                .filter(id -> id != null)
                .distinct()
                .count();

        return FlashcardStatisticsOverview.builder()
                .totalCardSets(totalCardSets)
                .totalPurchases(totalPurchases)
                .totalStudents(totalStudents)
                .totalRevenue(totalRevenue)
                .build();
    }

    /**
     * Per-deck activity list (one row per buyer). Combines local Purchase
     * records with the latest StudySession timestamp so the teacher knows who
     * bought and whether they actually studied the deck.
     */
    public List<StudentActivityResponse> getStudentsForCardSet(String cardSetId, String requesterId) {
        CardSet cardSet = cardSetRepository.findById(cardSetId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bộ thẻ: " + cardSetId));
        if (!cardSet.getAuthorId().equals(requesterId)) {
            throw new IllegalStateException("Bạn không có quyền xem danh sách học sinh của bộ thẻ này");
        }

        List<Purchase> purchases = purchaseRepository.findByCardSetId(cardSetId);
        Map<String, StudySession> latestByUser = studySessionRepository
                .findByCardSetIdInOrderByStudiedAtDesc(List.of(cardSetId)).stream()
                .collect(Collectors.toMap(
                        StudySession::getUserId,
                        s -> s,
                        (a, b) -> a.getStudiedAt().isAfter(b.getStudiedAt()) ? a : b
                ));

        return purchases.stream()
                .map(p -> StudentActivityResponse.builder()
                        .userId(p.getUserId())
                        .cardSetId(p.getCardSetId())
                        .purchasePrice(p.getPurchasePrice())
                        .purchasedAt(p.getPurchaseAt())
                        .lastProgress(latestByUser.containsKey(p.getUserId())
                                ? latestByUser.get(p.getUserId()).getProgress()
                                : null)
                        .completed(latestByUser.containsKey(p.getUserId())
                                && latestByUser.get(p.getUserId()).isCompleted())
                        .build())
                .sorted(Comparator.comparing(StudentActivityResponse::getPurchasedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    /**
     * Top-selling CardSets for the teacher, ordered by purchase count desc.
     */
    public List<TopCardSetResponse> getTopSellingCardSets(String authorId, int limit) {
        List<CardSet> cardSets = cardSetRepository.findByAuthorId(authorId);
        if (cardSets.isEmpty()) {
            return List.of();
        }

        Map<String, String> titlesById = cardSets.stream()
                .collect(Collectors.toMap(CardSet::getId, CardSet::getTitle, (a, b) -> a));

        List<ProductSales> sales = productSalesRepository.findByTeacherUserId(authorId);

        Map<String, BigDecimal> revenueByCardSet = sales.stream()
                .filter(s -> s.getProductId() != null)
                .collect(Collectors.groupingBy(
                        ProductSales::getProductId,
                        Collectors.reducing(BigDecimal.ZERO,
                                s -> s.getPrice() == null ? BigDecimal.ZERO : s.getPrice(),
                                BigDecimal::add)
                ));

        Map<String, Long> countByCardSet = sales.stream()
                .filter(s -> s.getProductId() != null)
                .collect(Collectors.groupingBy(ProductSales::getProductId, Collectors.counting()));

        return countByCardSet.entrySet().stream()
                .map(e -> TopCardSetResponse.builder()
                        .cardSetId(e.getKey())
                        .title(titlesById.getOrDefault(e.getKey(), "(unknown)"))
                        .totalSold(e.getValue())
                        .totalRevenue(revenueByCardSet.getOrDefault(e.getKey(), BigDecimal.ZERO))
                        .build())
                .sorted(Comparator.comparingLong(TopCardSetResponse::getTotalSold).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }
}
