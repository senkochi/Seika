package com.cardy.walletService.consumer;

import com.cardy.walletService.dto.LearnProgressDTO;
import com.cardy.walletService.dto.TransactionReqDTO;
import com.cardy.walletService.repository.WalletRepository;
import com.cardy.walletService.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WalletConsumer {

    private final WalletService walletService;

    private static final BigDecimal REWARD = BigDecimal.valueOf(20);

    @RabbitListener(queues = "wallet.queue")
    @Transactional
    public void learnReward(LearnProgressDTO req){
        System.out.println("--- Wallet Service: Nhận tin nhắn thưởng ---");
        System.out.println("Cộng tiền cho User: " + req.getUserId());

        TransactionReqDTO dto = new TransactionReqDTO(REWARD, "Nhận thường học thẻ");
        UUID userId = UUID.fromString(req.getUserId());

        walletService.reward(userId, dto);

        System.out.println("✅ Đã cộng 20 xu vào ví của " + req.getUserId());
    }

}
