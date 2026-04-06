package com.farmchainx.customer;

import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

@RestController
@RequestMapping("/api/customer/orders")
@CrossOrigin(origins = "*")
public class CustomerOrderController {

    private static final BigDecimal DELIVERY_RATE_PER_KM = new BigDecimal("12.00");

    private final CustomerHelperService helperService;
    private final CustomerCartItemRepository cartItemRepository;
    private final CustomerAddressRepository addressRepository;
    private final CustomerPaymentMethodRepository paymentMethodRepository;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.razorpay.enabled:false}")
    private boolean razorpayEnabled;

    @Value("${app.razorpay.key-id:}")
    private String razorpayKeyId;

    @Value("${app.razorpay.key-secret:}")
    private String razorpayKeySecret;

    @Value("${app.razorpay.api-base:https://api.razorpay.com/v1}")
    private String razorpayApiBase;

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
        helperService.ensureOrderLocationColumns();
        helperService.ensureOrderPaymentColumn();
        helperService.ensureOrderRazorpayOrderIdColumn();
        helperService.ensureOrderRazorpayPaymentIdColumn();
        helperService.ensureOrderRazorpaySignatureColumn();
        helperService.ensureOrderPaymentVerifiedAtColumn();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> placeOrder(
            Authentication authentication,
            @Valid @RequestBody PlaceOrderRequest request
    ) {
        try {
            CheckoutBundle checkoutBundle = buildCheckoutBundle(authentication, request);
            return ResponseEntity.ok(Map.of(
                    "orderIds", checkoutBundle.orderIds(),
                    "message", checkoutBundle.message()
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/checkout")
    @Transactional
    public ResponseEntity<Map<String, Object>> createCheckout(
            Authentication authentication,
            @Valid @RequestBody PlaceOrderRequest request
    ) {
        CheckoutBundle checkoutBundle;
        try {
            checkoutBundle = buildCheckoutBundle(authentication, request);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }

        return ResponseEntity.ok(Map.of(
                "orderIds", checkoutBundle.orderIds(),
                "itemCount", checkoutBundle.itemCount(),
                "totalAmount", checkoutBundle.totalAmount(),
                "message", checkoutBundle.message(),
                "paymentStatus", "Pending",
                "paymentMode", "DIRECT"
        ));
    }


    @GetMapping("/checkout-config-status")
    public ResponseEntity<Map<String, Object>> checkoutConfigStatus() {
        boolean keyIdConfigured = !isBlank(razorpayKeyId);
        boolean keySecretConfigured = !isBlank(razorpayKeySecret);
        boolean apiBaseConfigured = !isBlank(razorpayApiBase);
        boolean ready = razorpayEnabled && keyIdConfigured && keySecretConfigured && apiBaseConfigured;

        return ResponseEntity.ok(Map.of(
                "razorpayEnabled", razorpayEnabled,
                "keyIdConfigured", keyIdConfigured,
                "keySecretConfigured", keySecretConfigured,
                "apiBaseConfigured", apiBaseConfigured,
                "ready", ready,
                "message", ready ? "Razorpay checkout is configured." : "Razorpay checkout is not fully configured."
        ));
    }

    @PostMapping("/verify-payment")
    @Transactional
    public ResponseEntity<Map<String, Object>> verifyPayment(
            Authentication authentication,
            @Valid @RequestBody VerifyPaymentRequest request
    ) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());

        if (request.getOrderIds() == null || request.getOrderIds().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No order IDs provided for payment verification."));
        }

        if (!isValidRazorpaySignature(request.getRazorpayOrderId(), request.getRazorpayPaymentId(), request.getRazorpaySignature())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Payment verification failed. Invalid signature."));
        }

        List<Map<String, Object>> orderRows = loadCustomerOrdersForVerification(customer.getUser().getId(), request.getOrderIds());
        if (orderRows.size() != request.getOrderIds().size()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Some orders could not be verified for this account."));
        }

        int paidNow = 0;
        for (Map<String, Object> row : orderRows) {
            Long orderId = ((Number) row.get("id")).longValue();
            String currentPaymentStatus = Objects.toString(row.get("paymentStatus"), "");
            if ("Paid".equalsIgnoreCase(currentPaymentStatus)) {
                continue;
            }

            jdbcTemplate.update(
                    """
                    update orders
                    set payment_status = 'Paid',
                        razorpay_order_id = ?,
                        razorpay_payment_id = ?,
                        razorpay_signature = ?,
                        payment_verified_at = ?
                    where id = ?
                    """,
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature(),
                    Timestamp.from(OffsetDateTime.now().toInstant()),
                    orderId
            );

            creditFarmerWalletFromOrderRow(row);
            paidNow++;
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "paidNow", paidNow,
                "message", paidNow > 0 ? "Payment verified and orders marked as paid." : "Orders were already marked paid."
        ));
    }

    private CheckoutBundle buildCheckoutBundle(Authentication authentication, PlaceOrderRequest request) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());

        CustomerAddress address = addressRepository.findById(request.getAddressId()).orElse(null);
        if (address == null || !address.getCustomer().getId().equals(customer.getId())) {
            throw new IllegalArgumentException("Invalid delivery address selected.");
        }

        CustomerPaymentMethod paymentMethod = paymentMethodRepository.findById(request.getPaymentMethodId()).orElse(null);
        if (paymentMethod == null || !paymentMethod.getCustomer().getId().equals(customer.getId())) {
            throw new IllegalArgumentException("Invalid payment method selected.");
        }

        List<CustomerCartItem> cartItems = cartItemRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty.");
        }

        List<Long> orderIds = new ArrayList<>();
        List<Long> placedCartItemIds = new ArrayList<>();
        int skippedItems = 0;
        BigDecimal checkoutTotal = BigDecimal.ZERO;
        for (CustomerCartItem item : cartItems) {
            List<Map<String, Object>> productRows = jdbcTemplate.queryForList(
                    """
                    select p.id, p.price_per_unit as pricePerUnit, p.unit, p.stock_quantity as stockQuantity,
                           b.farmer_id as farmerId, fp.farm_latitude as farmerLatitude, fp.farm_longitude as farmerLongitude
                    from products p
                    join batches b on p.batch_id = b.id
                    join farmer_profiles fp on b.farmer_id = fp.id
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
            checkoutTotal = checkoutTotal.add(amount);
            BigDecimal distance = new BigDecimal("6.00");
            BigDecimal fee = distance
                    .max(BigDecimal.ONE)
                    .multiply(DELIVERY_RATE_PER_KM)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal pickupLatitude = toNullableDecimal(product.get("farmerLatitude"));
            BigDecimal pickupLongitude = toNullableDecimal(product.get("farmerLongitude"));
            BigDecimal deliveryLatitude = address.getLatitude();
            BigDecimal deliveryLongitude = address.getLongitude();

            String orderCode = "#ORD" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            OffsetDateTime now = OffsetDateTime.now();

            jdbcTemplate.update(
                    """
                    insert into orders (
                        order_code, farmer_id, product_id, customer_user_id, customer_name, customer_phone,
                        customer_address_id, quantity, quantity_unit, order_amount, distance_km, delivery_fee,
                        pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude,
                        status, delivery_status, payment_status, payment_method_type, pickup_location, delivery_address, created_at
                    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    pickupLatitude,
                    pickupLongitude,
                    deliveryLatitude,
                    deliveryLongitude,
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
            orderIds.add(orderId);
            placedCartItemIds.add(item.getId());
        }

        if (orderIds.isEmpty()) {
            throw new IllegalStateException("Unable to place order. Some products may be out of stock.");
        }

        cartItemRepository.deleteAllById(placedCartItemIds);

        return new CheckoutBundle(
                orderIds,
                checkoutTotal.setScale(2, RoundingMode.HALF_UP),
                cartItems.size(),
                skippedItems > 0
                        ? "Order placed for available items. Some items were skipped."
                        : "Order placed successfully"
        );
    }

    private Map<String, Object> createRazorpayOrder(long amountPaise, String receipt, List<Long> orderIds) {
        RestTemplate restTemplate = new RestTemplate();
        Map<String, Object> payload = Map.of(
                "amount", amountPaise,
                "currency", "INR",
                "receipt", receipt,
                "notes", Map.of("orderIds", orderIds.toString())
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(razorpayKeyId, razorpayKeySecret, StandardCharsets.UTF_8);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(razorpayApiBase + "/orders", request, Map.class);
            Map<?, ?> body = response.getBody();
            if (body == null) {
                return Map.of();
            }
            return body.entrySet().stream()
                    .collect(java.util.stream.Collectors.toMap(
                            e -> String.valueOf(e.getKey()),
                            Map.Entry::getValue
                    ));
        } catch (HttpStatusCodeException ex) {
            String upstream = ex.getResponseBodyAsString();
            throw new IllegalStateException("Razorpay order creation failed: " + (isBlank(upstream) ? ex.getStatusText() : upstream), ex);
        }
    }

    private List<Map<String, Object>> loadCustomerOrdersForVerification(Long customerUserId, List<Long> orderIds) {
        String placeholders = String.join(",", java.util.Collections.nCopies(orderIds.size(), "?"));
        Object[] args = new Object[orderIds.size() + 1];
        args[0] = customerUserId;
        for (int i = 0; i < orderIds.size(); i++) {
            args[i + 1] = orderIds.get(i);
        }

        return jdbcTemplate.queryForList(
                """
                select id, farmer_id as farmerId, order_amount as orderAmount, order_code as orderCode, payment_status as paymentStatus
                from orders
                where customer_user_id = ? and id in (%s)
                """.formatted(placeholders),
                args
        );
    }

    private void creditFarmerWalletFromOrderRow(Map<String, Object> row) {
        BigDecimal orderAmount = row.get("orderAmount") instanceof BigDecimal
                ? (BigDecimal) row.get("orderAmount")
                : BigDecimal.valueOf(((Number) row.get("orderAmount")).doubleValue());
        Long farmerId = ((Number) row.get("farmerId")).longValue();
        String orderCode = Objects.toString(row.get("orderCode"), "");

        List<Map<String, Object>> walletRows = jdbcTemplate.queryForList(
                "select id, total_earnings as totalEarnings, withdrawable_balance as withdrawableBalance from wallets where farmer_id = ?",
                farmerId
        );

        Long walletId;
        BigDecimal totalEarnings;
        BigDecimal withdrawableBalance;

        if (walletRows.isEmpty()) {
            jdbcTemplate.update(
                    "insert into wallets (farmer_id, total_earnings, withdrawable_balance) values (?, ?, ?)",
                    farmerId,
                    orderAmount,
                    orderAmount
            );
            walletId = jdbcTemplate.queryForObject("select id from wallets where farmer_id = ?", Long.class, farmerId);
        } else {
            Map<String, Object> wallet = walletRows.get(0);
            walletId = ((Number) wallet.get("id")).longValue();
            totalEarnings = toDecimal(wallet.get("totalEarnings")).add(orderAmount);
            withdrawableBalance = toDecimal(wallet.get("withdrawableBalance")).add(orderAmount);

            jdbcTemplate.update(
                    "update wallets set total_earnings = ?, withdrawable_balance = ? where id = ?",
                    totalEarnings,
                    withdrawableBalance,
                    walletId
            );
        }

        jdbcTemplate.update(
                """
                insert into wallet_transactions (wallet_id, created_at, amount, type, description)
                values (?, ?, ?, ?, ?)
                """,
                walletId,
                Timestamp.from(OffsetDateTime.now().toInstant()),
                orderAmount,
                "CREDIT",
                "Order " + orderCode + " payment received"
        );
    }

    private boolean isValidRazorpaySignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        if (isBlank(razorpayOrderId) || isBlank(razorpayPaymentId) || isBlank(razorpaySignature) || isBlank(razorpayKeySecret)) {
            return false;
        }
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            Mac hmacSha256 = Mac.getInstance("HmacSHA256");
            hmacSha256.init(new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = hmacSha256.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expected = bytesToHex(hash);
            return expected.equals(razorpaySignature);
        } catch (Exception ex) {
            return false;
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String sanitizeGatewayErrorMessage(String message) {
        if (isBlank(message)) {
            return "Unable to initialize payment gateway order.";
        }
        String normalized = message.trim();
        if (normalized.startsWith("Razorpay order creation failed:")) {
            return normalized;
        }
        return "Unable to initialize payment gateway order.";
    }

    private BigDecimal toDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal decimal) return decimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue()).setScale(2, RoundingMode.HALF_UP);
        return BigDecimal.ZERO;
    }

    private BigDecimal toNullableDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal decimal) return decimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue()).setScale(7, RoundingMode.HALF_UP);
        return null;
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

    @Data
    public static class VerifyPaymentRequest {
        @NotNull
        private List<Long> orderIds;

        @NotNull
        private String razorpayOrderId;

        @NotNull
        private String razorpayPaymentId;

        @NotNull
        private String razorpaySignature;
    }

    private record CheckoutBundle(
            List<Long> orderIds,
            BigDecimal totalAmount,
            int itemCount,
            String message
    ) {
    }
}

