package com.seika.quiz_service.service;

import com.seika.quiz_service.client.WalletClient;
import com.seika.quiz_service.domain.BaseQuiz;
import com.seika.quiz_service.domain.ProductSales;
import com.seika.quiz_service.domain.QuizAttempt;
import com.seika.quiz_service.domain.QuizSet;
import com.seika.quiz_service.dto.SystemConfigDTO;
import com.seika.quiz_service.dto.quiz.QuizResponse;
import com.seika.quiz_service.dto.quizset.QuizSetCreateRequest;
import com.seika.quiz_service.dto.quizset.QuizSetResponse;
import com.seika.quiz_service.dto.statistics.QuizAttemptResponse;
import com.seika.quiz_service.dto.statistics.QuizStatisticsOverview;
import com.seika.quiz_service.dto.statistics.TopQuizSetResponse;
import com.seika.quiz_service.exception.ForbiddenException;
import com.seika.quiz_service.exception.ResourceNotFoundException;
import com.seika.quiz_service.repository.ProductSalesRepository;
import com.seika.quiz_service.repository.QuizAttemptRepository;
import com.seika.quiz_service.repository.QuizSetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizSetService {

    private final QuizSetRepository quizSetRepository;
    private final QuizService quizService;
    private final MongoTemplate mongoTemplate;
    private final ContentEventPublisher contentEventPublisher;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ProductSalesRepository productSalesRepository;
    private final WalletClient walletClient;

    @Transactional
    public QuizSetResponse create(QuizSetCreateRequest request, String createdBy) {
        log.info("Creating new QuizSet: {} by user: {}", request.getTitle(), createdBy);
        if (request.getPrice() != null && request.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Giá sản phẩm không được nhỏ hơn 0!");
        }
        if (request.getPrice() != null && request.getPrice().compareTo(BigDecimal.ZERO) > 0) {
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
            if (request.getPrice().compareTo(minPrice) < 0 || request.getPrice().compareTo(maxPrice) > 0) {
                throw new IllegalArgumentException("Giá sản phẩm phải nằm trong khoảng từ " + minPrice + " đến " + maxPrice + " coin!");
            }
        }

        // Create individual quizzes and collect their IDs
        List<QuizResponse> createdQuizzes = request.getQuestions().stream()
                .map(qReq -> quizService.create(qReq, createdBy))
                .collect(Collectors.toList());

        List<String> quizIds = createdQuizzes.stream()
                .map(QuizResponse::getId)
                .collect(Collectors.toList());

        QuizSet quizSet = QuizSet.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice() != null ? request.getPrice() : java.math.BigDecimal.ZERO)
                .quizIds(quizIds)
                .createdBy(createdBy)
                .build();

        QuizSet saved = quizSetRepository.save(quizSet);

        // Publish event so profile-service can update teacher stats
        contentEventPublisher.publishQuizSetCreated(saved.getId(), createdBy, saved.getTitle(), saved.getDescription(), saved.getPrice());

        return convertToResponse(saved, createdQuizzes);
    }

    public List<QuizSetResponse> getByCreatedBy(String userId) {
        return quizSetRepository.findByCreatedBy(userId).stream()
                .map(this::convertToResponseWithFetchedQuizzes)
                .collect(Collectors.toList());
    }

    public QuizSetResponse getById(String id) {
        QuizSet quizSet = quizSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QuizSet", id));
        return convertToResponseWithFetchedQuizzes(quizSet);
    }

    public void deleteByOwner(String id, String requesterId) {
        log.info("Deleting QuizSet id: {} requested by: {}", id, requesterId);
        QuizSet quizSet = quizSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QuizSet", id));

        if (!quizSet.getCreatedBy().equals(requesterId)) {
            throw new ForbiddenException("You are not allowed to delete this QuizSet");
        }

        // Optional: delete associated quizzes
        quizSet.getQuizIds().forEach(quizId -> {
            try {
                quizService.deleteByOwner(quizId, requesterId);
            } catch (Exception e) {
                log.warn("Could not delete quiz {} when deleting quizSet {}", quizId, id);
            }
        });

        quizSetRepository.deleteById(id);
        log.info("QuizSet {} deleted successfully", id);
    }

    private void deleteQuizById(String id, String requesterId) {
        ObjectId objectId;
        try {
            objectId = new ObjectId(id);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid ObjectId format for deleting quiz: {}", id);
            return;
        }

        Query query = Query.query(Criteria.where("_id").is(objectId));
        BaseQuiz quiz = mongoTemplate.findOne(query, BaseQuiz.class, "quizzes");
        if (quiz != null) {
            if (!quiz.getCreatedBy().equals(requesterId)) {
                throw new ForbiddenException("You are not allowed to delete this quiz");
            }
            mongoTemplate.remove(query, BaseQuiz.class, "quizzes");
            log.info("Deleted quiz {} via MongoTemplate", id);
        }
    }

    @Transactional
    public QuizSetResponse update(String id, QuizSetCreateRequest request, String requesterId) {
        log.info("Updating QuizSet id: {} by user: {}", id, requesterId);
        QuizSet quizSet = quizSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QuizSet", id));

        if (!quizSet.getCreatedBy().equals(requesterId)) {
            throw new ForbiddenException("You are not allowed to update this QuizSet");
        }

        if (request.getPrice() != null && request.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Giá sản phẩm không được nhỏ hơn 0!");
        }

        if (request.getPrice() != null && request.getPrice().compareTo(BigDecimal.ZERO) > 0) {
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
            if (request.getPrice().compareTo(minPrice) < 0 || request.getPrice().compareTo(maxPrice) > 0) {
                throw new IllegalArgumentException("Giá sản phẩm phải nằm trong khoảng từ " + minPrice + " đến " + maxPrice + " coin!");
            }
        }

        // Delete old quizzes safely
        if (quizSet.getQuizIds() != null) {
            quizSet.getQuizIds().forEach(quizId -> {
                try {
                    deleteQuizById(quizId, requesterId);
                } catch (Exception e) {
                    log.warn("Could not delete old quiz {} when updating quizSet {}", quizId, id);
                }
            });
        }

        // Create new quizzes
        List<QuizResponse> createdQuizzes = request.getQuestions().stream()
                .map(qReq -> quizService.create(qReq, requesterId))
                .collect(Collectors.toList());

        List<String> quizIds = createdQuizzes.stream()
                .map(QuizResponse::getId)
                .collect(Collectors.toList());

        // Update fields
        quizSet.setTitle(request.getTitle());
        quizSet.setDescription(request.getDescription());
        quizSet.setPrice(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO);
        quizSet.setQuizIds(quizIds);

        QuizSet saved = quizSetRepository.save(quizSet);

        // Publish update event
        contentEventPublisher.publishQuizSetUpdated(saved.getId(), requesterId, saved.getTitle(), saved.getDescription(), saved.getPrice());

        return convertToResponse(saved, createdQuizzes);
    }

    private QuizSetResponse convertToResponseWithFetchedQuizzes(QuizSet quizSet) {
        List<QuizResponse> quizzes = quizSet.getQuizIds().stream()
                .map(id -> {
                    try {
                        return fetchQuizById(id);
                    } catch (Exception e) {
                        log.warn("Could not fetch quiz {} for quizSet {}", id, quizSet.getId());
                        return null;
                    }
                })
                .filter(q -> q != null)
                .collect(Collectors.toList());

        return convertToResponse(quizSet, quizzes);
    }

    /**
     * Fetch a quiz by its string ID, querying the underlying _id field directly
     * via MongoTemplate. The polymorphic MongoRepository.findById on BaseQuiz does
     * not resolve the _id mapping correctly when documents are stored with an
     * ObjectId _id but the entity declares {@code @Id String id}, so we bypass it
     * by querying the {@code _id} field with an explicit Criteria.
     */
    private QuizResponse fetchQuizById(String id) {
        ObjectId objectId;
        try {
            objectId = new ObjectId(id);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Quiz", id);
        }

        Query query = Query.query(Criteria.where("_id").is(objectId));
        BaseQuiz quiz = mongoTemplate.findOne(query, BaseQuiz.class, "quizzes");
        if (quiz == null) {
            throw new ResourceNotFoundException("Quiz", id);
        }
        return quizService.convertToResponse(quiz);
    }

    private QuizSetResponse convertToResponse(QuizSet quizSet, List<QuizResponse> quizzes) {
        return QuizSetResponse.builder()
                .id(quizSet.getId())
                .title(quizSet.getTitle())
                .description(quizSet.getDescription())
                .price(quizSet.getPrice())
                .quizzes(quizzes)
                .createdBy(quizSet.getCreatedBy())
                .createdAt(quizSet.getCreatedAt())
                .updatedAt(quizSet.getUpdatedAt())
                .build();
    }

    // -------------------------------------------------------------------------
    // Teacher statistics
    // -------------------------------------------------------------------------

    /**
     * Aggregate overview for the teacher identified by {@code authorId}:
     * total QuizSets, attempts, pass-rate, revenue (from local product sales
     * mirror) and distinct students.
     */
    @Transactional(readOnly = true)
    public QuizStatisticsOverview getStatisticsForAuthor(String authorId) {
        log.info("Building statistics overview for teacher {}", authorId);

        List<QuizSet> quizSets = quizSetRepository.findByCreatedBy(authorId);
        long totalQuizSets = quizSets.size();

        List<String> quizSetIds = quizSets.stream().map(QuizSet::getId).collect(Collectors.toList());

        long totalAttempts = quizSetIds.isEmpty()
                ? 0L
                : quizAttemptRepository.countByQuizSetIdIn(quizSetIds);

        long totalPassed = quizSetIds.isEmpty()
                ? 0L
                : quizAttemptRepository.countByQuizSetIdInAndPassed(quizSetIds, true);

        double passRate = totalAttempts == 0
                ? 0.0
                : Math.round((double) totalPassed * 10000.0 / totalAttempts) / 100.0;

        List<ProductSales> sales = productSalesRepository.findByTeacherUserId(authorId);
        BigDecimal totalRevenue = sales.stream()
                .map(ProductSales::getPrice)
                .filter(p -> p != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalStudents = sales.stream()
                .map(ProductSales::getBuyerUserId)
                .filter(id -> id != null)
                .distinct()
                .count();

        return QuizStatisticsOverview.builder()
                .totalQuizSets(totalQuizSets)
                .totalAttempts(totalAttempts)
                .totalPassed(totalPassed)
                .passRate(passRate)
                .totalRevenue(totalRevenue)
                .totalStudents(totalStudents)
                .build();
    }

    /**
     * Drill-down: attempts for a specific QuizSet, ordered newest first.
     * Only the QuizSet owner may call this — otherwise {@link ForbiddenException}
     * is thrown.
     */
    @Transactional(readOnly = true)
    public List<QuizAttemptResponse> getAttemptsForQuizSet(String quizSetId, String requesterId) {
        QuizSet quizSet = quizSetRepository.findById(quizSetId)
                .orElseThrow(() -> new ResourceNotFoundException("QuizSet", quizSetId));

        if (!quizSet.getCreatedBy().equals(requesterId)) {
            throw new ForbiddenException("You are not allowed to view attempts for this QuizSet");
        }

        return quizAttemptRepository.findByQuizSetIdInOrderByAttemptAtDesc(List.of(quizSetId)).stream()
                .map(this::toAttemptResponse)
                .collect(Collectors.toList());
    }

    private QuizAttemptResponse toAttemptResponse(QuizAttempt a) {
        return QuizAttemptResponse.builder()
                .id(a.getId())
                .userId(a.getUserId())
                .quizSetId(a.getQuizSetId())
                .quizId(a.getQuizId())
                .score(a.getScore())
                .passed(a.isPassed())
                .attemptAt(a.getAttemptAt())
                .build();
    }

    /**
     * Top-selling QuizSets for the teacher, ordered by {@code totalSold} desc.
     */
    @Transactional(readOnly = true)
    public List<TopQuizSetResponse> getTopSellingQuizSets(String authorId, int limit) {
        List<QuizSet> quizSets = quizSetRepository.findByCreatedBy(authorId);
        if (quizSets.isEmpty()) {
            return List.of();
        }

        Map<String, String> titlesById = quizSets.stream()
                .collect(Collectors.toMap(QuizSet::getId, QuizSet::getTitle, (a, b) -> a));

        List<ProductSales> sales = productSalesRepository.findByTeacherUserId(authorId);

        Map<String, long[]> aggregate = sales.stream()
                .filter(s -> s.getProductId() != null)
                .collect(Collectors.groupingBy(
                        ProductSales::getProductId,
                        Collectors.teeing(
                                Collectors.counting(),
                                Collectors.reducing(BigDecimal.ZERO,
                                        s -> s.getPrice() == null ? BigDecimal.ZERO : s.getPrice(),
                                        BigDecimal::add),
                                (count, revenue) -> new long[]{count, revenue.longValue()}
                        )
                ));

        return aggregate.entrySet().stream()
                .map(entry -> TopQuizSetResponse.builder()
                        .quizSetId(entry.getKey())
                        .title(titlesById.getOrDefault(entry.getKey(), "(unknown)"))
                        .totalSold(entry.getValue()[0])
                        .totalRevenue(BigDecimal.valueOf(entry.getValue()[1]))
                        .build())
                .sorted(Comparator.comparingLong(TopQuizSetResponse::getTotalSold).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }
}
