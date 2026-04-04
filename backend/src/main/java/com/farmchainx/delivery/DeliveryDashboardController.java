package com.farmchainx.delivery;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/delivery/dashboard")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DELIVERY_PARTNER')")
public class DeliveryDashboardController {

    private static final Logger logger = LoggerFactory.getLogger(DeliveryDashboardController.class);
    private static final BigDecimal DELIVERY_RATE_PER_KM = new BigDecimal("12.00");

    private final DeliveryHelperService helperService;
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void initializeColumns() {
        helperService.ensureOrderLocationColumns();
        helperService.ensureDeliveryPartnerColumns();
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard(Authentication authentication) {
        var partner = helperService.getOrCreatePartner(authentication.getName());
        logger.info("Loading dashboard for delivery partner: {}", partner.email());

        OffsetDateTime startOfToday = LocalDate.now().atStartOfDay().atOffset(OffsetDateTime.now().getOffset());

        Long inPickup = jdbcTemplate.queryForObject(
                "select count(*) from orders where delivery_partner_id = ? and delivery_status in ('ASSIGNED', 'PICKED_UP')",
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

        BigDecimal earningsToday = null;
        try {
            earningsToday = jdbcTemplate.queryForObject(
                    """
                    select coalesce(sum(coalesce(delivery_fee, round(greatest(coalesce(distance_km, 0), 1) * ?, 2))), 0)
                    from orders
                    where delivery_partner_id = ? and delivery_status = 'DELIVERED' and delivered_at >= ?
                    """,
                    BigDecimal.class,
                    DELIVERY_RATE_PER_KM,
                    partner.profileId(),
                    Timestamp.from(startOfToday.toInstant())
            );
            logger.info("Earnings today calculated: {} for partner: {}", earningsToday, partner.profileId());
        } catch (Exception e) {
            logger.error("Error calculating earnings today: {}", e.getMessage());
            earningsToday = BigDecimal.ZERO;
        }

        BigDecimal totalEarnings = null;
        try {
            totalEarnings = jdbcTemplate.queryForObject(
                    """
                    select coalesce(sum(coalesce(delivery_fee, round(greatest(coalesce(distance_km, 0), 1) * ?, 2))), 0)
                    from orders
                    where delivery_partner_id = ? and delivery_status = 'DELIVERED'
                    """,
                    BigDecimal.class,
                    DELIVERY_RATE_PER_KM,
                    partner.profileId()
            );
            logger.info("Total earnings calculated: {} for partner: {}", totalEarnings, partner.profileId());
        } catch (Exception e) {
            logger.error("Error calculating total earnings: {}", e.getMessage());
            totalEarnings = BigDecimal.ZERO;
        }

        List<Map<String, Object>> tasks = new ArrayList<>();
        try {
            tasks = jdbcTemplate.query(
                    """
                    select id, order_code, customer_name, pickup_location, delivery_address, delivery_status, distance_km,
                           pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude
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
                        row.put("pickupLatitude", rs.getBigDecimal("pickup_latitude"));
                        row.put("pickupLongitude", rs.getBigDecimal("pickup_longitude"));
                        row.put("deliveryLatitude", rs.getBigDecimal("delivery_latitude"));
                        row.put("deliveryLongitude", rs.getBigDecimal("delivery_longitude"));
                        return row;
                    },
                    partner.profileId()
            );
        } catch (Exception e) {
            logger.warn("Error querying tasks with location columns, trying without: {}", e.getMessage());
            // Fallback query without location columns if they don't exist
            try {
                tasks = jdbcTemplate.query(
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
                            row.put("pickupLatitude", null);
                            row.put("pickupLongitude", null);
                            row.put("deliveryLatitude", null);
                            row.put("deliveryLongitude", null);
                            return row;
                        },
                        partner.profileId()
                );
            } catch (Exception e2) {
                logger.error("Error querying tasks even without location columns: {}", e2.getMessage());
                tasks = new ArrayList<>();
            }
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("partnerName", partner.fullName());
        payload.put("online", partner.online());
        payload.put("todayDeliveries", deliveredToday == null ? 0 : deliveredToday);
        payload.put("inPickup", inPickup == null ? 0 : inPickup);
        payload.put("pendingPickups", inPickup == null ? 0 : inPickup);
        payload.put("inTransit", inTransit == null ? 0 : inTransit);
        double earningsTodayValue = earningsToday == null ? 0.0 : earningsToday.doubleValue();
        double totalEarningsValue = totalEarnings == null ? 0.0 : totalEarnings.doubleValue();
        payload.put("earningsToday", earningsTodayValue);
        payload.put("totalEarnings", totalEarningsValue);
        payload.put("tasks", tasks);
        payload.put("mapPreview", "Live map tracking will be integrated in next update");
        logger.info("Dashboard response - earningsToday: {}, totalEarnings: {}", earningsTodayValue, totalEarningsValue);
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

