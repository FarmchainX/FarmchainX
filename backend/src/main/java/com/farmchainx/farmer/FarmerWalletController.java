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
import java.math.RoundingMode;
import java.util.Comparator;
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
    private final OrderRepository orderRepository;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(Authentication authentication) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        BigDecimal derivedOrderTotal = deriveOrderEarningsTotal(farmer.getId());

        Wallet wallet = walletRepository.findByFarmerId(farmer.getId())
                .orElseGet(() -> Wallet.builder()
                        .farmer(farmer)
                        .totalEarnings(BigDecimal.ZERO)
                        .withdrawableBalance(BigDecimal.ZERO)
                        .build());

        Map<String, Object> result = new HashMap<>();
        BigDecimal walletTotal = wallet.getTotalEarnings() == null ? BigDecimal.ZERO : wallet.getTotalEarnings();
        BigDecimal walletWithdrawable = wallet.getWithdrawableBalance() == null ? BigDecimal.ZERO : wallet.getWithdrawableBalance();

        result.put("totalEarnings", walletTotal.compareTo(BigDecimal.ZERO) > 0 ? walletTotal : derivedOrderTotal);
        result.put("withdrawableBalance", walletWithdrawable.compareTo(BigDecimal.ZERO) > 0 ? walletWithdrawable : derivedOrderTotal);
        // Placeholder pending payments until real settlement logic
        result.put("pendingPayments", BigDecimal.ZERO);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<Map<String, Object>>> getTransactions(Authentication authentication) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        List<Map<String, Object>> txns = walletRepository.findByFarmerId(farmer.getId())
                .map(wallet -> walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId()).stream()
                        .map(txn -> {
                            Map<String, Object> row = new HashMap<>();
                            row.put("id", txn.getId());
                            row.put("createdAt", txn.getCreatedAt());
                            row.put("description", txn.getDescription());
                            row.put("amount", txn.getAmount());
                            row.put("type", txn.getType());
                            return row;
                        })
                        .toList())
                .orElse(List.of());

        if (!txns.isEmpty()) {
            return ResponseEntity.ok(txns);
        }

        // Fallback for older users where wallet transactions were never persisted.
        List<Map<String, Object>> derived = orderRepository.findByFarmerIdOrderByCreatedAtDesc(farmer.getId()).stream()
                .filter(order -> !"Refunded".equalsIgnoreCase(order.getPaymentStatus()))
                .filter(order -> order.getOrderAmount() != null && order.getOrderAmount().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(order -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", "order-" + order.getId());
                    row.put("createdAt", order.getCreatedAt());
                    row.put("description", "Order " + (order.getOrderCode() == null ? "" : order.getOrderCode()));
                    row.put("amount", order.getOrderAmount());
                    row.put("type", "CREDIT");
                    return row;
                })
                .toList();

        return ResponseEntity.ok(derived);
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdrawToBank(@RequestBody WithdrawRequest request, Authentication authentication) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Invalid withdrawal amount");
        }
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        Wallet wallet = walletRepository.findByFarmerId(farmer.getId())
                .orElseThrow(() -> new IllegalStateException("Wallet not found"));

        BigDecimal withdrawable = wallet.getWithdrawableBalance() == null ? BigDecimal.ZERO : wallet.getWithdrawableBalance();
        if (withdrawable.compareTo(BigDecimal.ZERO) <= 0) {
            BigDecimal derivedOrderTotal = deriveOrderEarningsTotal(farmer.getId());
            if (derivedOrderTotal.compareTo(BigDecimal.ZERO) > 0) {
                // Bootstrap wallet balances from existing paid/non-refunded order earnings.
                if (wallet.getTotalEarnings() == null || wallet.getTotalEarnings().compareTo(BigDecimal.ZERO) <= 0) {
                    wallet.setTotalEarnings(derivedOrderTotal);
                }
                wallet.setWithdrawableBalance(derivedOrderTotal);
                walletRepository.save(wallet);
                withdrawable = derivedOrderTotal;
            }
        }

        if (withdrawable.compareTo(request.getAmount()) < 0) {
            return ResponseEntity.badRequest().body("Insufficient balance");
        }
        // Deduct from withdrawable balance
        wallet.setWithdrawableBalance(withdrawable.subtract(request.getAmount()));
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

    private BigDecimal deriveOrderEarningsTotal(Long farmerId) {
        return orderRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId).stream()
                .filter(order -> !"Refunded".equalsIgnoreCase(order.getPaymentStatus()))
                .map(Order::getOrderAmount)
                .filter(amount -> amount != null && amount.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }
}

