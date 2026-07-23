package com.seika.marketplace_service.service;

import java.util.List;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.seika.marketplace_service.entity.MarketplaceConfig;
import com.seika.marketplace_service.repository.MarketplaceConfigRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketplaceConfigService {

    public static final String KEY_ESCROW_HOLD_DAYS = "ESCROW_HOLD_DAYS";
    public static final String KEY_ESCROW_OPERATION_FEE_PERCENT = "ESCROW_OPERATION_FEE_PERCENT";
    public static final String KEY_TIER_PLATFORM_FEE_PERCENT = "TIER_PLATFORM_FEE_PERCENT";
    public static final String KEY_TIER_RATING_THRESHOLDS = "TIER_RATING_THRESHOLDS";
    public static final String KEY_TIER_CONSUME_RATE_MIN = "TIER_CONSUME_RATE_MIN";
    public static final String KEY_TIER_REFUND_RATE_MAX = "TIER_REFUND_RATE_MAX";
    public static final String KEY_TIER_APPROVAL_REJECTION_RATE_MAX = "TIER_APPROVAL_REJECTION_RATE_MAX";
    public static final String KEY_COLLUSION_LOOKBACK_DAYS = "COLLUSION_LOOKBACK_DAYS";
    public static final String KEY_COLLUSION_RISK_THRESHOLD = "COLLUSION_RISK_THRESHOLD";
    public static final String KEY_COLLUSION_TX_THRESHOLD = "COLLUSION_TX_THRESHOLD";
    public static final String KEY_COLLUSION_PROMO_BACKED_RATIO_THRESHOLD = "COLLUSION_PROMO_BACKED_RATIO_THRESHOLD";
    public static final String KEY_COLLUSION_NO_CONSUME_RATIO_THRESHOLD = "COLLUSION_NO_CONSUME_RATIO_THRESHOLD";
    public static final String KEY_WASH_HOLD_DAYS = "WASH_HOLD_DAYS";

    private final MarketplaceConfigRepository repository;

    private record DefaultEntry(String key, String value, String description) {}

    private static final List<DefaultEntry> DEFAULTS = List.of(
            new DefaultEntry(KEY_ESCROW_HOLD_DAYS, "7", "Số ngày giữ escrow trước khi release"),
            new DefaultEntry(KEY_ESCROW_OPERATION_FEE_PERCENT, "0", "Phí vận hành escrow trong pilot"),
            new DefaultEntry(KEY_TIER_PLATFORM_FEE_PERCENT, "{\"NEWBIE\":20,\"BRONZE\":15,\"SILVER\":10,\"GOLD\":5,\"ELITE\":3}", "Platform fee theo teacher tier"),
            new DefaultEntry(KEY_TIER_RATING_THRESHOLDS, "{\"NEWBIE\":{\"minReviews\":0,\"minRating\":0},\"BRONZE\":{\"minReviews\":5,\"minRating\":3.0},\"SILVER\":{\"minReviews\":20,\"minRating\":3.5},\"GOLD\":{\"minReviews\":100,\"minRating\":4.0},\"ELITE\":{\"minReviews\":500,\"minRating\":4.5}}", "Ngưỡng tier Phase 2"),
            new DefaultEntry(KEY_TIER_CONSUME_RATE_MIN, "{\"SILVER\":0.35,\"GOLD\":0.50,\"ELITE\":0.65}", "Ngưỡng consume rate tối thiểu theo tier"),
            new DefaultEntry(KEY_TIER_REFUND_RATE_MAX, "{\"BRONZE\":0.20,\"SILVER\":0.15,\"GOLD\":0.10,\"ELITE\":0.05}", "Ngưỡng refund rate tối đa theo tier"),
            new DefaultEntry(KEY_TIER_APPROVAL_REJECTION_RATE_MAX, "{\"BRONZE\":0.50,\"SILVER\":0.30,\"GOLD\":0.15,\"ELITE\":0.08}", "Ngưỡng approval rejection rate tối đa theo tier"),
            new DefaultEntry(KEY_COLLUSION_LOOKBACK_DAYS, "30", "Risk review lookback window"),
            new DefaultEntry(KEY_COLLUSION_RISK_THRESHOLD, "50", "Điểm risk tối thiểu để flag"),
            new DefaultEntry(KEY_COLLUSION_TX_THRESHOLD, "5", "Số giao dịch nghi vấn trong lookback"),
            new DefaultEntry(KEY_COLLUSION_PROMO_BACKED_RATIO_THRESHOLD, "0.6", "Tỷ lệ promo-backed nghi vấn"),
            new DefaultEntry(KEY_COLLUSION_NO_CONSUME_RATIO_THRESHOLD, "0.7", "Tỷ lệ không consume nghi vấn"),
            new DefaultEntry(KEY_WASH_HOLD_DAYS, "30", "Số ngày giữ cash-out khi confirmed wash")
    );

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDefaults() {
        for (DefaultEntry def : DEFAULTS) {
            if (!repository.existsById(def.key())) {
                repository.save(MarketplaceConfig.builder()
                        .key(def.key())
                        .value(def.value())
                        .description(def.description())
                        .build());
                log.info("Seeded MarketplaceConfig {} = {}", def.key(), def.value());
            }
        }
    }

    @Transactional(readOnly = true)
    public String getValue(String key, String defaultValue) {
        return repository.findById(key)
                .map(MarketplaceConfig::getValue)
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    public int getInt(String key, int defaultValue) {
        try {
            return Integer.parseInt(getValue(key, Integer.toString(defaultValue)));
        } catch (NumberFormatException exception) {
            return defaultValue;
        }
    }

    @Transactional(readOnly = true)
    public java.math.BigDecimal getBigDecimal(String key, java.math.BigDecimal defaultValue) {
        try {
            return new java.math.BigDecimal(getValue(key, defaultValue.toPlainString()));
        } catch (NumberFormatException exception) {
            return defaultValue;
        }
    }
    @Transactional(readOnly = true)
    public List<MarketplaceConfig> getAll() {
        return repository.findAll();
    }

    @Transactional
    public MarketplaceConfig update(String key, String value, String updatedBy) {
        MarketplaceConfig config = repository.findById(key)
                .orElseThrow(() -> new IllegalArgumentException("Marketplace config không tồn tại: " + key));
        config.setValue(value);
        config.setUpdatedBy(updatedBy);
        MarketplaceConfig saved = repository.save(config);
        log.info("Updated MarketplaceConfig {} by {}", key, updatedBy);
        return saved;
    }
}

