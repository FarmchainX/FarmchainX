package com.farmchainx.customer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/cart")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerCartController {

    private final CustomerHelperService helperService;
    private final CustomerCartItemRepository cartItemRepository;
    private final JdbcTemplate jdbcTemplate;

    public CustomerCartController(
            CustomerHelperService helperService,
            CustomerCartItemRepository cartItemRepository,
            JdbcTemplate jdbcTemplate
    ) {
        this.helperService = helperService;
        this.cartItemRepository = cartItemRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getCart(Authentication authentication) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select ci.id, ci.product_id as productId, ci.quantity,
                       p.name as productName, p.price_per_unit as pricePerUnit, p.unit, p.image_url as imageUrl,
                       coalesce(p.stock_quantity, 0) as stockQuantity,
                       (coalesce(p.price_per_unit, 0) * ci.quantity) as lineTotal
                from customer_cart_items ci
                join products p on ci.product_id = p.id
                where ci.customer_id = ?
                order by ci.id desc
                """,
                customer.getId()
        );

        return ResponseEntity.ok(rows);
    }

    @PostMapping
    public ResponseEntity<Void> addToCart(Authentication authentication, @Valid @RequestBody AddToCartRequest request) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());

        Integer available = jdbcTemplate.query(
                "select stock_quantity from products where id = ?",
                rs -> rs.next() ? rs.getInt("stock_quantity") : null,
                request.getProductId()
        );
        if (available == null || available < request.getQuantity()) {
            return ResponseEntity.badRequest().build();
        }

        CustomerCartItem item = cartItemRepository.findByCustomerIdAndProductId(customer.getId(), request.getProductId())
                .orElseGet(() -> CustomerCartItem.builder()
                        .customer(customer)
                        .productId(request.getProductId())
                        .quantity(0)
                        .createdAt(OffsetDateTime.now())
                        .build());

        int nextQuantity = item.getQuantity() + request.getQuantity();
        if (nextQuantity > available) {
            return ResponseEntity.badRequest().build();
        }

        item.setQuantity(nextQuantity);
        cartItemRepository.save(item);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateQuantity(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateQuantityRequest request
    ) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        CustomerCartItem item = cartItemRepository.findById(id).orElse(null);
        if (item == null || !item.getCustomer().getId().equals(customer.getId())) {
            return ResponseEntity.notFound().build();
        }

        Integer available = jdbcTemplate.query(
                "select stock_quantity from products where id = ?",
                rs -> rs.next() ? rs.getInt("stock_quantity") : 0,
                item.getProductId()
        );

        if (available == null || request.getQuantity() > available) {
            return ResponseEntity.badRequest().build();
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeItem(Authentication authentication, @PathVariable Long id) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        CustomerCartItem item = cartItemRepository.findById(id).orElse(null);
        if (item == null || !item.getCustomer().getId().equals(customer.getId())) {
            return ResponseEntity.notFound().build();
        }
        cartItemRepository.delete(item);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class AddToCartRequest {
        @NotNull
        private Long productId;

        @NotNull
        @Min(1)
        private Integer quantity;
    }

    @Data
    public static class UpdateQuantityRequest {
        @NotNull
        @Min(1)
        private Integer quantity;
    }
}

