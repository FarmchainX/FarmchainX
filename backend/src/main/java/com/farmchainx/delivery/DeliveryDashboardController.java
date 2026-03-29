package com.farmchainx.delivery;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/delivery/dashboard")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DELIVERY_PARTNER')")
public class DeliveryDashboardController {

    private final DeliveryHelperService helperService;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard(Authentication authentication) {
        var partner = helperService.getOrCreatePartner(authentication.getName());

        OffsetDateTime startOfToday = LocalDate.now().atStartOfDay().atOffset(OffsetDateTime.now().getOffset());

        Long pendingPickups = jdbcTemplate.queryForObject(
                "select count(*) from orders where delivery_partner_id = ? and delivery_status = 'ASSIGNED'",
                Long.class,
                partner.profileId()
        );

        Long inTransit = jdbcTemplate.queryForObject(
                "select count(*) from orders where delivery_partner_id = ? and delivery_status = 'IN_TRANSIT'",
                Long.class,
                partner.profileId()
        );

        Long deliveredToday = jdbcTemplate.queryForObject(
                "select count(*) from orders where delivery_partner_id = ? and delivery_status = 'DELIVERED' and delivered_at >= ?",
                Long.class,
                partner.profileId(),
                Timestamp.from(startOfToday.toInstant())
        );

        BigDecimal earningsToday = jdbcTemplate.queryForObject(
                """
                select coalesce(sum(coalesce(delivery_fee, round(coalesce(order_amount, 0) * 0.08, 2), 50)), 0)
                from orders
                where delivery_partner_id = ? and delivery_status = 'DELIVERED' and delivered_at >= ?
                """,
                BigDecimal.class,
                partner.profileId(),
                Timestamp.from(startOfToday.toInstant())
        );

        List<Map<String, Object>> tasks = jdbcTemplate.query(
                """
                select id, order_code, customer_name, pickup_location, delivery_address, delivery_status, distance_km
                from orders
                where delivery_partner_id = ? and delivery_status in ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')
                order by created_at desc
                limit 6
                """,
                (rs, rowNum) -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("orderCode", rs.getString("order_code"));
                    row.put("customerName", rs.getString("customer_name"));
                    row.put("pickupLocation", rs.getString("pickup_location"));
                    row.put("deliveryAddress", rs.getString("delivery_address"));
                    row.put("deliveryStatus", rs.getString("delivery_status"));
                    row.put("distanceKm", rs.getBigDecimal("distance_km"));
                    return row;
                },
                partner.profileId()
        );

        Map<String, Object> payload = new HashMap<>();
        payload.put("partnerName", partner.fullName());
        payload.put("online", partner.online());
        payload.put("todayDeliveries", deliveredToday == null ? 0 : deliveredToday);
        payload.put("pendingPickups", pendingPickups == null ? 0 : pendingPickups);
        payload.put("inTransit", inTransit == null ? 0 : inTransit);
        payload.put("earningsToday", earningsToday == null ? BigDecimal.ZERO : earningsToday);
        payload.put("tasks", tasks);
        payload.put("mapPreview", "Live map tracking will be integrated in next update");
        return ResponseEntity.ok(payload);
    }

    @PatchMapping("/availability")
    public ResponseEntity<Void> updateAvailability(
            Authentication authentication,
            @RequestBody UpdateAvailabilityRequest request
    ) {
        var partner = helperService.getOrCreatePartner(authentication.getName());
        jdbcTemplate.update(
                "update delivery_partner_profiles set online = ? where id = ?",
                request.isOnline(),
                partner.profileId()
        );
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class UpdateAvailabilityRequest {
        private boolean online;
    }
}

