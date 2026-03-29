package com.farmchainx.customer;

import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/customer/orders")
@CrossOrigin(origins = "*")
public class CustomerOrderController {

    private final CustomerHelperService helperService;
    private final CustomerCartItemRepository cartItemRepository;
    private final CustomerAddressRepository addressRepository;
    private final CustomerPaymentMethodRepository paymentMethodRepository;
    private final JdbcTemplate jdbcTemplate;

    public CustomerOrderController(
            CustomerHelperService helperService,
            CustomerCartItemRepository cartItemRepository,
            CustomerAddressRepository addressRepository,
            CustomerPaymentMethodRepository paymentMethodRepository,
            JdbcTemplate jdbcTemplate
    ) {
        this.helperService = helperService;
        this.cartItemRepository = cartItemRepository;
        this.addressRepository = addressRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initializeColumns() {
        helperService.ensureOrderOwnershipColumn();
        helperService.ensureOrderAddressColumn();
        helperService.ensureOrderPaymentColumn();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> placeOrder(
            Authentication authentication,
            @Valid @RequestBody PlaceOrderRequest request
    ) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());

        CustomerAddress address = addressRepository.findById(request.getAddressId()).orElse(null);
        if (address == null || !address.getCustomer().getId().equals(customer.getId())) {
            return ResponseEntity.badRequest().build();
        }

        CustomerPaymentMethod paymentMethod = paymentMethodRepository.findById(request.getPaymentMethodId()).orElse(null);
        if (paymentMethod == null || !paymentMethod.getCustomer().getId().equals(customer.getId())) {
            return ResponseEntity.badRequest().build();
        }

        List<CustomerCartItem> cartItems = cartItemRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        if (cartItems.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        List<Long> orderIds = new ArrayList<>();
        List<Long> placedCartItemIds = new ArrayList<>();
        int skippedItems = 0;
        for (CustomerCartItem item : cartItems) {
            List<Map<String, Object>> productRows = jdbcTemplate.queryForList(
                    """
                    select p.id, p.price_per_unit as pricePerUnit, p.unit, p.stock_quantity as stockQuantity,
                           b.farmer_id as farmerId
                    from products p
                    join batches b on p.batch_id = b.id
                    where p.id = ?
                    """,
                    item.getProductId()
            );

            if (productRows.isEmpty()) {
                skippedItems++;
                continue;
            }

            Map<String, Object> product = productRows.get(0);
            int stock = product.get("stockQuantity") == null ? 0 : ((Number) product.get("stockQuantity")).intValue();
            if (stock < item.getQuantity()) {
                skippedItems++;
                continue;
            }

            BigDecimal price = product.get("pricePerUnit") instanceof BigDecimal
                    ? (BigDecimal) product.get("pricePerUnit")
                    : BigDecimal.valueOf(((Number) product.get("pricePerUnit")).doubleValue());

            BigDecimal amount = price.multiply(BigDecimal.valueOf(item.getQuantity())).setScale(2, RoundingMode.HALF_UP);
            BigDecimal distance = new BigDecimal("6.00");
            BigDecimal fee = amount.multiply(new BigDecimal("0.08")).setScale(2, RoundingMode.HALF_UP);

            String orderCode = "#ORD" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            OffsetDateTime now = OffsetDateTime.now();

            jdbcTemplate.update(
                    """
                    insert into orders (
                        order_code, farmer_id, product_id, customer_user_id, customer_name, customer_phone,
                        customer_address_id, quantity, quantity_unit, order_amount, distance_km, delivery_fee,
                        status, delivery_status, payment_status, payment_method_type, pickup_location, delivery_address, created_at
                    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    orderCode,
                    ((Number) product.get("farmerId")).longValue(),
                    item.getProductId(),
                    customer.getUser().getId(),
                    customer.getUser().getFullName(),
                    customer.getUser().getPhone(),
                    address.getId(),
                    item.getQuantity(),
                    product.get("unit"),
                    amount,
                    distance,
                    fee,
                    "Pending",
                    "",
                    "Pending",
                    paymentMethod.getMethodType(),
                    "Farm Pickup",
                    address.getAddressLine() + ", " + address.getCity(),
                    Timestamp.from(now.toInstant())
            );

            jdbcTemplate.update(
                    "update products set stock_quantity = stock_quantity - ? where id = ?",
                    item.getQuantity(),
                    item.getProductId()
            );

            Long orderId = jdbcTemplate.queryForObject(
                    "select id from orders where order_code = ?",
                    Long.class,
                    orderCode
            );
            if (orderId != null) {
                orderIds.add(orderId);
                placedCartItemIds.add(item.getId());
            }
        }

        if (orderIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Unable to place order. Some products may be out of stock."
            ));
        }

        cartItemRepository.deleteAllById(placedCartItemIds);

        return ResponseEntity.ok(Map.of(
                "orderIds", orderIds,
                "message", skippedItems > 0
                        ? "Order placed for available items. Some items were skipped."
                        : "Order placed successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> orderHistory(Authentication authentication) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select o.id, o.order_code as orderCode, o.customer_name as customerName, o.quantity, o.quantity_unit as quantityUnit,
                       o.order_amount as orderAmount, o.delivery_fee as deliveryFee, o.status, o.delivery_status as deliveryStatus,
                       o.payment_status as paymentStatus, o.created_at as createdAt, p.name as productName, p.image_url as imageUrl,
                       fp.farm_name as farmName
                from orders o
                left join products p on o.product_id = p.id
                left join farmer_profiles fp on o.farmer_id = fp.id
                where o.customer_user_id = ?
                order by o.created_at desc
                """,
                customer.getUser().getId()
        );
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> orderDetails(Authentication authentication, @PathVariable Long id) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select o.id, o.order_code as orderCode, o.customer_name as customerName, o.customer_phone as customerPhone,
                       o.quantity, o.quantity_unit as quantityUnit, o.order_amount as orderAmount, o.delivery_fee as deliveryFee,
                       o.status, o.delivery_status as deliveryStatus, o.payment_status as paymentStatus, o.payment_method_type as paymentMethodType,
                       o.pickup_location as pickupLocation, o.delivery_address as deliveryAddress,
                       o.created_at as createdAt, o.assigned_at as assignedAt, o.picked_up_at as pickedUpAt,
                       o.in_transit_at as inTransitAt, o.delivered_at as deliveredAt,
                       p.name as productName, p.image_url as imageUrl,
                       fp.farm_name as farmName, fp.farm_location as farmLocation
                from orders o
                left join products p on o.product_id = p.id
                left join farmer_profiles fp on o.farmer_id = fp.id
                where o.id = ? and o.customer_user_id = ?
                """,
                id,
                customer.getUser().getId()
        );

        if (rows.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(rows.get(0));
    }

    @GetMapping("/{id}/tracking")
    public ResponseEntity<Map<String, Object>> tracking(Authentication authentication, @PathVariable Long id) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select o.order_code as orderCode, o.status, o.delivery_status as deliveryStatus,
                       o.assigned_at as assignedAt, o.picked_up_at as pickedUpAt,
                       o.in_transit_at as inTransitAt, o.delivered_at as deliveredAt
                from orders o
                where o.id = ? and o.customer_user_id = ?
                """,
                id,
                customer.getUser().getId()
        );
        if (rows.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @Data
    public static class PlaceOrderRequest {
        @NotNull
        private Long addressId;

        @NotNull
        private Long paymentMethodId;

        @NotNull
        @Min(1)
        private Integer expectedItems;
    }
}

