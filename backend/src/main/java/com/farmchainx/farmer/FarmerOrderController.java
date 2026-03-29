package com.farmchainx.farmer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/farmer/orders")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FarmerOrderController {

    private final FarmerHelperService farmerHelperService;
    private final OrderRepository orderRepository;

    @GetMapping
    public ResponseEntity<List<Order>> listOrders(Authentication authentication) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        List<Order> orders = orderRepository.findByFarmerIdOrderByCreatedAtDesc(farmer.getId());
        return ResponseEntity.ok(orders);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request
    ) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        Order order = orderRepository.findById(id)
                .filter(o -> o.getFarmer().getId().equals(farmer.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        order.setStatus(request.getStatus());
        Order saved = orderRepository.save(order);
        return ResponseEntity.ok(saved);
    }

    // Simple helper for seeding demo orders for a farmer
    @PostMapping("/demo")
    public ResponseEntity<List<Order>> seedDemoOrders(Authentication authentication) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        if (!orderRepository.findByFarmerIdOrderByCreatedAtDesc(farmer.getId()).isEmpty()) {
            return listOrders(authentication);
        }

        OffsetDateTime now = OffsetDateTime.now();
        Order o1 = Order.builder()
                .orderCode("#ORD1024")
                .farmer(farmer)
                .product(null)
                .customerName("John Smith")
                .quantity(50)
                .quantityUnit("kg")
                .status("Pending")
                .paymentStatus("Paid")
                .createdAt(now.minusDays(2))
                .build();

        Order o2 = Order.builder()
                .orderCode("#ORD1023")
                .farmer(farmer)
                .product(null)
                .customerName("Lisa White")
                .quantity(25)
                .quantityUnit("kg")
                .status("Shipped")
                .paymentStatus("Paid")
                .createdAt(now.minusDays(4))
                .build();

        Order o3 = Order.builder()
                .orderCode("#ORD1022")
                .farmer(farmer)
                .product(null)
                .customerName("Mark Rodriguez")
                .quantity(100)
                .quantityUnit("kg")
                .status("Completed")
                .paymentStatus("Paid")
                .createdAt(now.minusDays(6))
                .build();

        orderRepository.save(o1);
        orderRepository.save(o2);
        orderRepository.save(o3);
        return listOrders(authentication);
    }

    @Data
    public static class UpdateStatusRequest {
        @NotBlank
        private String status;
    }
}

