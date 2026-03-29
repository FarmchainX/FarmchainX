package com.farmchainx.farmer;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FarmerDashboardService {

    private final FarmerHelperService farmerHelperService;
    private final BatchRepository batchRepository;
    private final ProductRepository productRepository;
    private final WalletRepository walletRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboard(String email) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(email);

        long activeBatches = batchRepository.findByFarmerId(farmer.getId()).size();
        long productsListed = productRepository.findByBatchFarmerId(farmer.getId()).size();

        var walletOpt = walletRepository.findByFarmerId(farmer.getId());
        BigDecimal totalEarnings = walletOpt.map(Wallet::getTotalEarnings).orElse(BigDecimal.ZERO);

        List<Order> recentOrders = orderRepository.findByFarmerIdOrderByCreatedAtDesc(farmer.getId());
        List<Map<String, Object>> recentOrdersList = recentOrders.stream()
                .limit(5)
                .map(o -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", o.getId());
                    row.put("orderCode", o.getOrderCode());
                    row.put("customerName", o.getCustomerName());
                    row.put("productName", o.getProduct() != null ? o.getProduct().getName() : "—");
                    row.put("quantity", o.getQuantity() + " " + (o.getQuantityUnit() != null ? o.getQuantityUnit() : ""));
                    row.put("status", o.getStatus());
                    row.put("paymentStatus", o.getPaymentStatus());
                    return row;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("farmerName", farmer.getUser().getFullName());
        result.put("activeBatches", activeBatches);
        result.put("productsListed", productsListed);
        result.put("totalEarnings", totalEarnings);
        result.put("aiCropHealthScore", 86); // placeholder
        result.put("recentOrders", recentOrdersList);
        return result;
    }
}

