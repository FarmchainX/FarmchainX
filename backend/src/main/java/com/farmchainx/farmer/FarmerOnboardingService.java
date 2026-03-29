package com.farmchainx.farmer;

import com.farmchainx.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class FarmerOnboardingService {

    private final FarmerProfileRepository farmerProfileRepository;
    private final WalletRepository walletRepository;

    @Transactional
    public void createFarmerProfileAndWallet(User user) {
        if (farmerProfileRepository.findByUser(user).isPresent()) {
            return; // already exists
        }

        FarmerProfile profile = FarmerProfile.builder()
                .user(user)
                .displayName(user.getFullName())
                .notifyOrderUpdates(true)
                .notifyRiskAlerts(true)
                .language("en-IN")
                .timeZone("Asia/Kolkata")
                .build();
        profile = farmerProfileRepository.save(profile);

        Wallet wallet = Wallet.builder()
                .farmer(profile)
                .totalEarnings(BigDecimal.ZERO)
                .withdrawableBalance(BigDecimal.ZERO)
                .build();
        walletRepository.save(wallet);
    }
}

