package com.cardy.walletService.service;

import com.cardy.walletService.entity.SystemConfig;
import com.cardy.walletService.repository.SystemConfigRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemConfigService {

    public static final String KEY_TOPUP_VND_PER_COIN = "TOPUP_VND_PER_COIN";
    public static final String KEY_WITHDRAWAL_VND_PER_COIN = "WITHDRAWAL_VND_PER_COIN";
    public static final String KEY_STUDENT_INITIAL_COIN = "STUDENT_INITIAL_COIN";
    public static final String KEY_TEACHER_INITIAL_COIN = "TEACHER_INITIAL_COIN";
    public static final String KEY_CASH_OUT_MIN_COINS = "CASH_OUT_MIN_COINS";
    public static final String KEY_CASH_OUT_MULTIPLE = "CASH_OUT_MULTIPLE";
    public static final String KEY_MIN_PRODUCT_PRICE = "MIN_PRODUCT_PRICE";
    public static final String KEY_MAX_PRODUCT_PRICE = "MAX_PRODUCT_PRICE";
    public static final String KEY_FLASHCARD_REWARD_COOLDOWN_DAYS = "FLASHCARD_REWARD_COOLDOWN_DAYS";

    private final SystemConfigRepository repository;
    private final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();

    private record DefaultEntry(String key, String value, String description) {}

    private static final List<DefaultEntry> DEFAULTS = List.of(
            new DefaultEntry(KEY_TOPUP_VND_PER_COIN, "100", "Số VNĐ Student trả cho 1 Coin (topUp)"),
            new DefaultEntry(KEY_WITHDRAWAL_VND_PER_COIN, "90", "Số VNĐ Teacher nhận cho 1 Coin rút (cashOut)"),
            new DefaultEntry(KEY_STUDENT_INITIAL_COIN, "500", "Số coin khởi đầu khi Student đăng ký"),
            new DefaultEntry(KEY_TEACHER_INITIAL_COIN, "0", "Số coin khởi đầu khi Teacher đăng ký"),
            new DefaultEntry(KEY_CASH_OUT_MIN_COINS, "10", "Số coin tối thiểu cho một lần cash-out"),
            new DefaultEntry(KEY_CASH_OUT_MULTIPLE, "10", "Cash-out phải là bội số của số coin này"),
            new DefaultEntry(KEY_MIN_PRODUCT_PRICE, "10", "Giá tối thiểu của sản phẩm trên marketplace (coin)"),
            new DefaultEntry(KEY_MAX_PRODUCT_PRICE, "100000", "Giá tối đa của sản phẩm trên marketplace (coin)"),
            new DefaultEntry(KEY_FLASHCARD_REWARD_COOLDOWN_DAYS, "3", "Số ngày cooldown giữa 2 lần nhận flashcard reward")
    );

    @PostConstruct
    public void seedDefaults() {
        repository.findByKey("COIN_TO_VND_RATE").ifPresent(old -> {
            repository.delete(old);
            cache.remove("COIN_TO_VND_RATE");
            log.info("Removed deprecated SystemConfig COIN_TO_VND_RATE");
        });
        for (DefaultEntry def : DEFAULTS) {
            repository.findByKey(def.key()).ifPresentOrElse(
                    existing -> log.debug("SystemConfig {} đã tồn tại với value={}", def.key(), existing.getValue()),
                    () -> {
                        repository.save(SystemConfig.builder()
                                .key(def.key())
                                .value(def.value())
                                .description(def.description())
                                .build());
                        log.info("Seeded SystemConfig {} = {}", def.key(), def.value());
                    }
            );
        }
        // Warm cache
        repository.findAll().forEach(c -> cache.put(c.getKey(), c.getValue()));
        log.info("SystemConfig cache warmed với {} entries", cache.size());

    }

    public String getString(String key, String defaultValue) {
        String cached = cache.get(key);
        if (cached != null) return cached;
        return repository.findByKey(key)
                .map(c -> {
                    cache.put(key, c.getValue());
                    return c.getValue();
                })
                .orElse(defaultValue);
    }

    public int getInt(String key, int defaultValue) {
        try {
            return Integer.parseInt(getString(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            log.warn("Config {} không parse được thành int, dùng default {}", key, defaultValue);
            return defaultValue;
        }
    }

    public BigDecimal getBigDecimal(String key, BigDecimal defaultValue) {
        try {
            return new BigDecimal(getString(key, defaultValue.toPlainString()));
        } catch (NumberFormatException e) {
            log.warn("Config {} không parse được thành BigDecimal, dùng default {}", key, defaultValue);
            return defaultValue;
        }
    }

    @Transactional(readOnly = true)
    public List<SystemConfig> getAll() {
        return repository.findAll();
    }

    @Transactional
    public SystemConfig update(String key, String value, String updatedBy) {
        SystemConfig config = repository.findByKey(key)
                .orElseThrow(() -> new IllegalArgumentException("Config không tồn tại: " + key));
        config.setValue(value);
        config.setUpdatedBy(updatedBy);
        SystemConfig saved = repository.save(config);
        cache.put(key, value);
        log.info("Updated SystemConfig {} = {} by {}", key, value, updatedBy);
        return saved;
    }
}
