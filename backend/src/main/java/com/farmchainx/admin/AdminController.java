package com.farmchainx.admin;

import com.farmchainx.auth.RoleType;
import com.farmchainx.auth.User;
import com.farmchainx.auth.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        long totalFarmers = countUsersByRole(RoleType.FARMER);
        long totalCustomers = countUsersByRole(RoleType.CUSTOMER);
        long totalDeliveryPartners = countUsersByRole(RoleType.DELIVERY_PARTNER);
        long totalOrders = queryForLong("select count(*) from orders");
        long activeBatches = queryForLong("select count(*) from batches where coalesce(status, 'ACTIVE') not in ('Closed', 'Harvested', 'Archived')");
        long flaggedUsers = queryForLong("select count(*) from users where coalesce(flagged, 0) = 1");
        long pendingApprovals = queryForLong("select count(*) from users where coalesce(approval_status, 'APPROVED') <> 'APPROVED'");
        long pendingDisputes = queryForLong("select count(*) from admin_disputes where status <> 'Resolved'");

        BigDecimal grossRevenue = queryForDecimal("select coalesce(sum(order_amount), 0) from orders");
        BigDecimal deliveryRevenue = queryForDecimal("select coalesce(sum(delivery_fee), 0) from orders");
        BigDecimal refundedAmount = queryForDecimal("select coalesce(sum(amount), 0) from admin_refunds where status = 'Processed'");
        BigDecimal netRevenue = grossRevenue.subtract(refundedAmount).setScale(2, RoundingMode.HALF_UP);

        List<Map<String, Object>> monthlyRevenue = jdbcTemplate.queryForList(
                """
                select date_format(created_at, '%b') as month,
                       coalesce(sum(order_amount), 0) as revenue,
                       count(*) as ordersCount
                from orders
                where created_at >= date_sub(now(), interval 6 month)
                group by year(created_at), month(created_at), date_format(created_at, '%b')
                order by min(created_at)
                """
        );

        List<Map<String, Object>> recentOrders = jdbcTemplate.queryForList(
                """
                select o.id, o.order_code as orderCode, o.customer_name as customerName,
                       p.name as productName, o.order_amount as orderAmount,
                       o.payment_status as paymentStatus, o.status, o.created_at as createdAt
                from orders o
                left join products p on p.id = o.product_id
                order by o.created_at desc
                limit 6
                """
        );

        List<Map<String, Object>> userMix = jdbcTemplate.queryForList(
                """
                select role, count(*) as total
                from users
                group by role
                order by total desc
                """
        );

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalFarmers", totalFarmers);
        stats.put("totalCustomers", totalCustomers);
        stats.put("totalDeliveryPartners", totalDeliveryPartners);
        stats.put("totalOrders", totalOrders);
        stats.put("activeBatches", activeBatches);
        stats.put("flaggedUsers", flaggedUsers);
        stats.put("pendingApprovals", pendingApprovals);
        stats.put("pendingDisputes", pendingDisputes);
        stats.put("grossRevenue", grossRevenue);
        stats.put("deliveryRevenue", deliveryRevenue);
        stats.put("refundedAmount", refundedAmount);
        stats.put("netRevenue", netRevenue);

        return ResponseEntity.ok(Map.of(
                "stats", stats,
                "monthlyRevenue", monthlyRevenue,
                "recentOrders", recentOrders,
                "userMix", userMix
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> users(@RequestParam(required = false) String role) {
        String sql = """
                select id, full_name as fullName, email, phone, role, enabled,
                       coalesce(approval_status, 'APPROVED') as approvalStatus,
                       coalesce(flagged, 0) as flagged,
                       suspension_reason as suspensionReason
                from users
                where (? is null or role = ?)
                order by role, full_name
                """;
        return ResponseEntity.ok(jdbcTemplate.queryForList(sql, role, role));
    }

    @PatchMapping("/users/{userId}/moderation")
    public ResponseEntity<Void> moderateUser(@PathVariable Long userId, @RequestBody ModerationRequest request) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        jdbcTemplate.update(
                """
                update users
                set enabled = ?,
                    flagged = ?,
                    approval_status = ?,
                    suspension_reason = ?
                where id = ?
                """,
                request.getEnabled() != null ? request.getEnabled() : user.isEnabled(),
                request.getFlagged() != null ? request.getFlagged() : false,
                request.getApprovalStatus() != null && !request.getApprovalStatus().isBlank() ? request.getApprovalStatus() : "APPROVED",
                request.getSuspensionReason(),
                userId
        );
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/farmers")
    public ResponseEntity<List<Map<String, Object>>> farmers() {
        return ResponseEntity.ok(jdbcTemplate.queryForList(
                """
                select u.id as userId, u.full_name as fullName, u.email, u.phone, u.enabled,
                       coalesce(u.approval_status, 'APPROVED') as approvalStatus,
                       coalesce(u.flagged, 0) as flagged,
                       fp.id as farmerProfileId, fp.farm_name as farmName,
                       fp.farm_location as farmLocation, fp.display_name as displayName,
                       fp.language, fp.notify_order_updates as notifyOrderUpdates,
                       fp.notify_risk_alerts as notifyRiskAlerts,
                       coalesce((select count(*) from batches b where b.farmer_id = fp.id), 0) as batchCount,
                       coalesce((select count(*) from products p join batches b2 on b2.id = p.batch_id where b2.farmer_id = fp.id), 0) as productCount,
                       coalesce((select count(*) from orders o where o.farmer_id = fp.id), 0) as orderCount
                from farmer_profiles fp
                join users u on u.id = fp.user_id
                order by fp.farm_name, u.full_name
                """
        ));
    }

    @GetMapping("/customers")
    public ResponseEntity<List<Map<String, Object>>> customers() {
        return ResponseEntity.ok(jdbcTemplate.queryForList(
                """
                select u.id as userId, u.full_name as fullName, u.email, u.phone, u.enabled,
                       coalesce(u.approval_status, 'APPROVED') as approvalStatus,
                       coalesce(u.flagged, 0) as flagged,
                       cp.id as customerProfileId, cp.preferred_name as preferredName, cp.city,
                       coalesce((select count(*) from orders o where o.customer_user_id = u.id), 0) as orderCount,
                       coalesce((select sum(o.order_amount) from orders o where o.customer_user_id = u.id), 0) as totalSpent,
                       coalesce((select count(*) from customer_addresses ca where ca.customer_id = cp.id), 0) as addressCount
                from customer_profiles cp
                join users u on u.id = cp.user_id
                order by u.full_name
                """
        ));
    }

    @GetMapping("/customers/{userId}/orders")
    public ResponseEntity<List<Map<String, Object>>> customerOrders(@PathVariable Long userId) {
        return ResponseEntity.ok(jdbcTemplate.queryForList(
                """
                select o.id, o.order_code as orderCode, o.customer_name as customerName,
                       p.name as productName, o.quantity, o.quantity_unit as quantityUnit,
                       o.order_amount as orderAmount, o.delivery_fee as deliveryFee,
                       o.payment_status as paymentStatus, o.delivery_status as deliveryStatus,
                       o.status, o.created_at as createdAt
                from orders o
                left join products p on p.id = o.product_id
                where o.customer_user_id = ?
                order by o.created_at desc
                """,
                userId
        ));
    }

    @GetMapping("/delivery-partners")
    public ResponseEntity<List<Map<String, Object>>> deliveryPartners() {
        return ResponseEntity.ok(jdbcTemplate.queryForList(
                """
                select u.id as userId, u.full_name as fullName, u.email, u.phone, u.enabled,
                       coalesce(u.approval_status, 'APPROVED') as approvalStatus,
                       coalesce(u.flagged, 0) as flagged,
                       dpp.id as profileId, dpp.online, dpp.vehicle_type as vehicleType,
                       dpp.vehicle_number as vehicleNumber, dpp.license_number as licenseNumber,
                       coalesce((select count(*) from orders o where o.delivery_partner_id = dpp.id), 0) as totalAssigned,
                       coalesce((select count(*) from orders o where o.delivery_partner_id = dpp.id and o.status = 'Delivered'), 0) as deliveredCount,
                       coalesce((select count(*) from orders o where o.delivery_partner_id = dpp.id and o.status <> 'Delivered'), 0) as activeCount
                from delivery_partner_profiles dpp
                join users u on u.id = dpp.user_id
                order by u.full_name
                """
        ));
    }

    @PatchMapping("/delivery-partners/{userId}/status")
    public ResponseEntity<Void> updateDeliveryPartnerStatus(@PathVariable Long userId, @RequestBody DeliveryPartnerStatusRequest request) {
        jdbcTemplate.update(
                "update users set enabled = ?, approval_status = ? where id = ?",
                request.isEnabled(),
                request.isEnabled() ? "APPROVED" : "SUSPENDED",
                userId
        );
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/blockchain-logs")
    public ResponseEntity<List<Map<String, Object>>> blockchainLogs() {
        return ResponseEntity.ok(jdbcTemplate.queryForList(
                """
                select br.id, b.batch_code as batchCode, br.trace_hash as traceHash,
                       br.timestamp, br.status, br.verified,
                       b.crop_name as cropName, fp.farm_name as farmName,
                       u.full_name as farmerName
                from blockchain_records br
                join batches b on b.id = br.batch_id
                join farmer_profiles fp on fp.id = b.farmer_id
                join users u on u.id = fp.user_id
                order by br.timestamp desc, br.id desc
                """
        ));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<Map<String, Object>>> transactions() {
        return ResponseEntity.ok(jdbcTemplate.queryForList(
                """
                select o.id as orderId, o.order_code as orderCode,
                       o.customer_name as customerName, cu.email as customerEmail,
                       fu.full_name as farmerName, p.name as productName,
                       o.order_amount as orderAmount, o.delivery_fee as deliveryFee,
                       o.payment_method_type as paymentMethodType,
                       o.payment_status as paymentStatus, o.status as orderStatus,
                       o.created_at as createdAt,
                       ar.amount as refundAmount, ar.status as refundStatus, ar.reason as refundReason
                from orders o
                left join users cu on cu.id = o.customer_user_id
                left join farmer_profiles fp on fp.id = o.farmer_id
                left join users fu on fu.id = fp.user_id
                left join products p on p.id = o.product_id
                left join admin_refunds ar on ar.order_id = o.id
                order by o.created_at desc
                """
        ));
    }

    @PostMapping("/transactions/{orderId}/refund")
    @Transactional
    public ResponseEntity<?> refundTransaction(
            Authentication authentication,
            @PathVariable Long orderId,
            @Valid @RequestBody RefundRequest request
    ) {
        List<Map<String, Object>> orderRows = jdbcTemplate.queryForList(
                "select id, order_amount as orderAmount from orders where id = ?",
                orderId
        );
        if (orderRows.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Integer existingRefund = jdbcTemplate.queryForObject(
                "select count(*) from admin_refunds where order_id = ?",
                Integer.class,
                orderId
        );
        if (existingRefund > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Refund already exists for this order."));
        }

        User admin = currentAdmin(authentication);
        BigDecimal orderAmount = toDecimal(orderRows.get(0).get("orderAmount"));
        BigDecimal refundAmount = request.getAmount() != null ? request.getAmount() : orderAmount;

        jdbcTemplate.update(
                """
                insert into admin_refunds (order_id, amount, reason, status, created_by_admin_id, created_at)
                values (?, ?, ?, ?, ?, ?)
                """,
                orderId,
                refundAmount,
                request.getReason(),
                "Processed",
                admin.getId(),
                Timestamp.from(OffsetDateTime.now().toInstant())
        );
        jdbcTemplate.update("update orders set payment_status = 'Refunded' where id = ?", orderId);
        return ResponseEntity.ok(Map.of("message", "Refund processed successfully."));
    }

    @GetMapping("/disputes")
    public ResponseEntity<List<Map<String, Object>>> disputes() {
        return ResponseEntity.ok(jdbcTemplate.queryForList(
                """
                select d.id, d.subject, d.description, d.priority, d.status,
                       d.related_order_id as relatedOrderId, d.raised_against_role as raisedAgainstRole,
                       d.raised_against_user_id as raisedAgainstUserId, d.resolution_notes as resolutionNotes,
                       d.created_at as createdAt, d.resolved_at as resolvedAt,
                       u.full_name as createdByAdminName
                from admin_disputes d
                left join users u on u.id = d.created_by_admin_id
                order by d.created_at desc
                """
        ));
    }

    @PatchMapping("/disputes/{disputeId}/resolve")
    public ResponseEntity<Void> resolveDispute(@PathVariable Long disputeId, @Valid @RequestBody ResolveDisputeRequest request) {
        jdbcTemplate.update(
                """
                update admin_disputes
                set status = 'Resolved', resolution_notes = ?, resolved_at = ?
                where id = ?
                """,
                request.getResolutionNotes(),
                Timestamp.from(OffsetDateTime.now().toInstant()),
                disputeId
        );
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/reports/revenue")
    public ResponseEntity<Map<String, Object>> revenueReport() {
        List<Map<String, Object>> monthly = jdbcTemplate.queryForList(
                """
                select date_format(created_at, '%b %Y') as label,
                       coalesce(sum(order_amount), 0) as revenue,
                       coalesce(sum(delivery_fee), 0) as deliveryRevenue
                from orders
                where created_at >= date_sub(now(), interval 6 month)
                group by year(created_at), month(created_at), date_format(created_at, '%b %Y')
                order by min(created_at)
                """
        );

        List<Map<String, Object>> topFarmers = jdbcTemplate.queryForList(
                """
                select fp.farm_name as farmName, u.full_name as farmerName,
                       coalesce(sum(o.order_amount), 0) as revenue,
                       count(o.id) as ordersCount
                from farmer_profiles fp
                join users u on u.id = fp.user_id
                left join orders o on o.farmer_id = fp.id
                group by fp.id, fp.farm_name, u.full_name
                order by revenue desc, ordersCount desc
                limit 5
                """
        );

        return ResponseEntity.ok(Map.of(
                "summary", Map.of(
                        "grossRevenue", queryForDecimal("select coalesce(sum(order_amount), 0) from orders"),
                        "deliveryRevenue", queryForDecimal("select coalesce(sum(delivery_fee), 0) from orders"),
                        "refunds", queryForDecimal("select coalesce(sum(amount), 0) from admin_refunds where status = 'Processed'")
                ),
                "monthly", monthly,
                "topFarmers", topFarmers
        ));
    }

    @GetMapping("/reports/orders")
    public ResponseEntity<Map<String, Object>> orderReport() {
        List<Map<String, Object>> statusBreakdown = jdbcTemplate.queryForList(
                """
                select coalesce(nullif(status, ''), 'Pending') as statusLabel, count(*) as total
                from orders
                group by coalesce(nullif(status, ''), 'Pending')
                order by total desc
                """
        );

        List<Map<String, Object>> deliveryBreakdown = jdbcTemplate.queryForList(
                """
                select coalesce(nullif(delivery_status, ''), 'Unassigned') as statusLabel, count(*) as total
                from orders
                group by coalesce(nullif(delivery_status, ''), 'Unassigned')
                order by total desc
                """
        );

        List<Map<String, Object>> topProducts = jdbcTemplate.queryForList(
                """
                select p.name as productName, count(o.id) as orderCount,
                       coalesce(sum(o.order_amount), 0) as revenue
                from orders o
                left join products p on p.id = o.product_id
                group by p.id, p.name
                order by orderCount desc, revenue desc
                limit 6
                """
        );

        return ResponseEntity.ok(Map.of(
                "summary", Map.of(
                        "totalOrders", queryForLong("select count(*) from orders"),
                        "deliveredOrders", queryForLong("select count(*) from orders where status = 'Delivered'"),
                        "pendingOrders", queryForLong("select count(*) from orders where status <> 'Delivered' or status is null"),
                        "averageOrderValue", queryForDecimal("select coalesce(avg(order_amount), 0) from orders")
                ),
                "statusBreakdown", statusBreakdown,
                "deliveryBreakdown", deliveryBreakdown,
                "topProducts", topProducts
        ));
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<Map<String, Object>>> notifications() {
        return ResponseEntity.ok(jdbcTemplate.queryForList(
                """
                select abn.id, abn.target_role as targetRole, abn.title, abn.message,
                       abn.status, abn.created_at as createdAt, u.full_name as createdByAdminName
                from admin_broadcast_notifications abn
                left join users u on u.id = abn.created_by_admin_id
                order by abn.created_at desc
                """
        ));
    }

    @PostMapping("/notifications")
    @Transactional
    public ResponseEntity<Map<String, Object>> sendNotification(Authentication authentication, @Valid @RequestBody SendNotificationRequest request) {
        User admin = currentAdmin(authentication);
        jdbcTemplate.update(
                """
                insert into admin_broadcast_notifications (target_role, title, message, status, created_by_admin_id, created_at)
                values (?, ?, ?, ?, ?, ?)
                """,
                request.getTargetRole(),
                request.getTitle(),
                request.getMessage(),
                "Sent",
                admin.getId(),
                Timestamp.from(OffsetDateTime.now().toInstant())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Broadcast notification sent."));
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> settings(Authentication authentication) {
        User admin = currentAdmin(authentication);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select id, full_name as fullName, email, phone, enabled,
                       coalesce(approval_status, 'APPROVED') as approvalStatus,
                       coalesce(flagged, 0) as flagged
                from users
                where id = ?
                """,
                admin.getId()
        );
        if (rows.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @PutMapping("/settings")
    public ResponseEntity<Void> updateSettings(Authentication authentication, @Valid @RequestBody UpdateAdminSettingsRequest request) {
        User admin = currentAdmin(authentication);
        jdbcTemplate.update(
                "update users set full_name = ?, phone = ? where id = ?",
                request.getFullName(),
                request.getPhone(),
                admin.getId()
        );
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/settings/password")
    public ResponseEntity<?> updatePassword(Authentication authentication, @Valid @RequestBody UpdateAdminPasswordRequest request) {
        User admin = currentAdmin(authentication);
        if (!passwordEncoder.matches(request.getCurrentPassword(), admin.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect."));
        }

        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(admin);
        return ResponseEntity.noContent().build();
    }

    private User currentAdmin(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Admin user not found"));
    }

    private long countUsersByRole(RoleType roleType) {
        Long count = jdbcTemplate.queryForObject(
                "select count(*) from users where role = ?",
                Long.class,
                roleType.name()
        );
        return count;
    }

    private long queryForLong(String sql) {
        Long value = jdbcTemplate.queryForObject(sql, Long.class);
        return value == null ? 0L : value;
    }

    private BigDecimal queryForDecimal(String sql) {
        Object value = jdbcTemplate.queryForObject(sql, Object.class);
        return toDecimal(value);
    }

    private BigDecimal toDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (value instanceof BigDecimal decimal) {
            return decimal.setScale(2, RoundingMode.HALF_UP);
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue()).setScale(2, RoundingMode.HALF_UP);
        }
        return new BigDecimal(value.toString()).setScale(2, RoundingMode.HALF_UP);
    }

    @Data
    public static class ModerationRequest {
        private Boolean enabled;
        private Boolean flagged;
        private String approvalStatus;
        private String suspensionReason;
    }

    @Data
    public static class DeliveryPartnerStatusRequest {
        private boolean enabled;
    }

    @Data
    public static class RefundRequest {
        private BigDecimal amount;
        private String reason;
    }


    @Data
    public static class ResolveDisputeRequest {
        @NotBlank
        private String resolutionNotes;
    }

    @Data
    public static class SendNotificationRequest {
        @NotBlank
        private String targetRole;

        @NotBlank
        private String title;

        @NotBlank
        private String message;
    }

    @Data
    public static class UpdateAdminSettingsRequest {
        @NotBlank
        private String fullName;

        @NotBlank
        private String phone;
    }

    @Data
    public static class UpdateAdminPasswordRequest {
        @NotBlank
        private String currentPassword;

        @NotBlank
        private String newPassword;
    }
}

