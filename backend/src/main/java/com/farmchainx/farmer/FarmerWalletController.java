package com.farmchainx.farmer;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/farmer/wallet")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FarmerWalletController {

    private final FarmerHelperService farmerHelperService;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(Authentication authentication) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        Wallet wallet = walletRepository.findByFarmerId(farmer.getId())
                .orElseGet(() -> Wallet.builder()
                        .farmer(farmer)
                        .totalEarnings(BigDecimal.ZERO)
                        .withdrawableBalance(BigDecimal.ZERO)
                        .build());

        Map<String, Object> result = new HashMap<>();
        result.put("totalEarnings", wallet.getTotalEarnings());
        result.put("withdrawableBalance", wallet.getWithdrawableBalance());
        // Placeholder pending payments until real settlement logic
        result.put("pendingPayments", BigDecimal.ZERO);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransaction>> getTransactions(Authentication authentication) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        Wallet wallet = walletRepository.findByFarmerId(farmer.getId())
                .orElseThrow(() -> new IllegalStateException("Wallet not found"));
        List<WalletTransaction> txns = walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId());
        return ResponseEntity.ok(txns);
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdrawToBank(@RequestBody WithdrawRequest request, Authentication authentication) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Invalid withdrawal amount");
        }
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        Wallet wallet = walletRepository.findByFarmerId(farmer.getId())
                .orElseThrow(() -> new IllegalStateException("Wallet not found"));
        if (wallet.getWithdrawableBalance().compareTo(request.getAmount()) < 0) {
            return ResponseEntity.badRequest().body("Insufficient balance");
        }
        // Deduct from withdrawable balance
        wallet.setWithdrawableBalance(wallet.getWithdrawableBalance().subtract(request.getAmount()));
        walletRepository.save(wallet);

        // Create transaction record
        WalletTransaction txn = WalletTransaction.builder()
                .wallet(wallet)
                .createdAt(java.time.OffsetDateTime.now())
                .amount(request.getAmount())
                .type("DEBIT")
                .description(request.getDescription() != null ? request.getDescription() : "Withdraw to bank")
                .build();
        walletTransactionRepository.save(txn);

        // Optionally, trigger payout logic here (integration with payment gateway, etc.)

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("newBalance", wallet.getWithdrawableBalance());
        return ResponseEntity.ok(result);
    }
}

