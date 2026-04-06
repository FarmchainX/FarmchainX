package com.farmchainx.delivery;

import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/delivery/orders")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DELIVERY_PARTNER')")
public class DeliveryOrdersController {

    private static final BigDecimal DELIVERY_RATE_PER_KM = new BigDecimal("12.00");

    private final DeliveryHelperService helperService;
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void initializeColumns() {
        helperService.ensureOrderLocationColumns();
        helperService.ensureDeliveryPartnerColumns();
    }

    @GetMapping("/available")
    public ResponseEntity<List<Map<String, Object>>> getAvailableDeliveries(Authentication authentication) {
        helperService.getOrCreatePartner(authentication.getName());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select o.id, o.order_code as orderCode, o.customer_name as customerName, o.customer_phone as customerPhone,
                       o.quantity, o.quantity_unit as quantityUnit, o.pickup_location as pickupLocation,
                       o.delivery_address as deliveryAddress, o.distance_km as distanceKm,
                       coalesce(o.delivery_fee, round(greatest(coalesce(o.distance_km, 0), 1) * ?, 2)) as earning,
                       fp.farm_name as farmName, u.phone as farmerPhone
                from orders o
                join farmer_profiles fp on o.farmer_id = fp.id
                join users u on fp.user_id = u.id
                where o.delivery_partner_id is null
                  and (o.delivery_status is null or o.delivery_status = '')
                  and o.status in ('Pending', 'Shipped', 'Confirmed')
                order by o.created_at desc
                """,
                DELIVERY_RATE_PER_KM
        );
        return ResponseEntity.ok(rows);
    }

    @PostMapping("/demo")
    public ResponseEntity<Void> seedDemoDeliveries(Authentication authentication) {
        helperService.getOrCreatePartner(authentication.getName());

        Long existing = jdbcTemplate.queryForObject(
                "select count(*) from orders where delivery_partner_id is null and (delivery_status is null or delivery_status = '')",
                Long.class
        );
        if (existing != null && existing > 0) {
            return ResponseEntity.noContent().build();
        }

        Long farmerId = jdbcTemplate.query(
                "select id from farmer_profiles order by id asc limit 1",
                rs -> rs.next() ? rs.getLong("id") : null
        );
        if (farmerId == null) {
            return ResponseEntity.noContent().build();
        }

        OffsetDateTime now = OffsetDateTime.now();
        insertDemoOrder(farmerId, "#DLV2001", "Rahul Verma", "+91 90000 11111", "Village Yard, Plot 5", "City Market, Block B", new BigDecimal("12.5"), now.minusHours(3));
        insertDemoOrder(farmerId, "#DLV2002", "Anita Das", "+91 90000 22222", "Farm Shed, Sector 12", "Sunrise Apartments", new BigDecimal("8.4"), now.minusHours(2));
        insertDemoOrder(farmerId, "#DLV2003", "Joseph Mathew", "+91 90000 33333", "Green Farm Gate", "Central Bazaar Street", new BigDecimal("18.1"), now.minusHours(1));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<Void> acceptDelivery(Authentication authentication, @PathVariable Long id) {
        var partner = helperService.getOrCreatePartner(authentication.getName());
        int updated = jdbcTemplate.update(
                """
                update orders
                set delivery_partner_id = ?, delivery_status = 'ASSIGNED', assigned_at = ?
                where id = ? and delivery_partner_id is null and (delivery_status is null or delivery_status = '')
                """,
                partner.profileId(),
                Timestamp.from(OffsetDateTime.now().toInstant()),
                id
        );

        if (updated == 0) {
            return ResponseEntity.notFound().build();
        }

        jdbcTemplate.update(
                """
                insert into delivery_notifications (delivery_partner_id, type, title, message, is_read, created_at)
                values (?, 'ASSIGNMENT', 'New delivery assigned', 'You accepted a new delivery request.', ?, ?)
                """,
                partner.profileId(),
                false,
                Timestamp.from(OffsetDateTime.now().toInstant())
        );

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<Map<String, Object>>> getAssignedDeliveries(Authentication authentication) {
        var partner = helperService.getOrCreatePartner(authentication.getName());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select o.id, o.order_code as orderCode, o.customer_name as customerName, o.customer_phone as customerPhone,
                       o.pickup_location as pickupLocation, o.delivery_address as deliveryAddress,
                       o.distance_km as distanceKm, o.delivery_status as deliveryStatus,
                       fp.farm_name as farmName, u.phone as farmerPhone
                from orders o
                join farmer_profiles fp on o.farmer_id = fp.id
                join users u on fp.user_id = u.id
                where o.delivery_partner_id = ? and o.delivery_status in ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')
                order by o.assigned_at desc
                """,
                partner.profileId()
        );
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDeliveryDetails(Authentication authentication, @PathVariable Long id) {
        var partner = helperService.getOrCreatePartner(authentication.getName());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select o.id, o.order_code as orderCode, o.customer_name as customerName, o.customer_phone as customerPhone,
                       o.pickup_location as pickupLocation, o.delivery_address as deliveryAddress,
                       o.quantity, o.quantity_unit as quantityUnit, o.distance_km as distanceKm,
                       o.delivery_status as deliveryStatus, o.status as orderStatus,
                       fp.farm_name as farmName, u.phone as farmerPhone, u.full_name as farmerName,
                       coalesce(o.delivery_fee, round(greatest(coalesce(o.distance_km, 0), 1) * ?, 2)) as earning
                from orders o
                join farmer_profiles fp on o.farmer_id = fp.id
                join users u on fp.user_id = u.id
                where o.id = ? and o.delivery_partner_id = ?
                """,
                DELIVERY_RATE_PER_KM,
                id,
                partner.profileId()
        );
        if (rows.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateDeliveryStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request
    ) {
        var partner = helperService.getOrCreatePartner(authentication.getName());
        List<Map<String, Object>> current = jdbcTemplate.queryForList(
                "select delivery_status as deliveryStatus from orders where id = ? and delivery_partner_id = ?",
                id,
                partner.profileId()
        );

        if (current.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String oldStatus = String.valueOf(current.get(0).get("deliveryStatus"));
        String newStatus = request.getStatus().trim().toUpperCase();

        boolean validTransition =
                ("ASSIGNED".equals(oldStatus) && "PICKED_UP".equals(newStatus))
                        || ("PICKED_UP".equals(oldStatus) && "IN_TRANSIT".equals(newStatus))
                        || ("IN_TRANSIT".equals(oldStatus) && "DELIVERED".equals(newStatus));

        if (!validTransition) {
            return ResponseEntity.badRequest().build();
        }

        OffsetDateTime now = OffsetDateTime.now();
        if ("PICKED_UP".equals(newStatus)) {
            jdbcTemplate.update(
                    "update orders set delivery_status = ?, picked_up_at = ? where id = ? and delivery_partner_id = ?",
                    newStatus,
                    Timestamp.from(now.toInstant()),
                    id,
                    partner.profileId()
            );
        } else if ("IN_TRANSIT".equals(newStatus)) {
            jdbcTemplate.update(
                    "update orders set delivery_status = ?, in_transit_at = ? where id = ? and delivery_partner_id = ?",
                    newStatus,
                    Timestamp.from(now.toInstant()),
                    id,
                    partner.profileId()
            );
        } else {
            jdbcTemplate.update(
                    """
                    update orders
                    set delivery_status = 'DELIVERED', delivered_at = ?, status = 'Completed', payment_status = 'Paid',
                        delivery_fee = coalesce(delivery_fee, round(greatest(coalesce(distance_km, 0), 1) * ?, 2))
                    where id = ? and delivery_partner_id = ?
                    """,
                    Timestamp.from(now.toInstant()),
                    DELIVERY_RATE_PER_KM,
                    id,
                    partner.profileId()
            );

            BigDecimal earning = jdbcTemplate.queryForObject(
                    "select coalesce(delivery_fee, 0) from orders where id = ?",
                    BigDecimal.class,
                    id
            );

            jdbcTemplate.update(
                    """
                    insert into delivery_notifications (delivery_partner_id, type, title, message, is_read, created_at)
                    values (?, 'PAYMENT', 'Payment received', ?, ?, ?)
                    """,
                    partner.profileId(),
                    "Delivery completed. Credited earning: Rs " + (earning == null ? "0" : earning),
                    false,
                    Timestamp.from(now.toInstant())
            );
        }

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getCompletedDeliveries(Authentication authentication) {
        var partner = helperService.getOrCreatePartner(authentication.getName());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select o.id, o.order_code as orderCode, o.customer_name as customerName,
                       o.delivery_address as deliveryAddress, o.delivered_at as deliveredAt,
                       coalesce(o.delivery_fee, round(greatest(coalesce(o.distance_km, 0), 1) * ?, 2)) as earning
                from orders o
                where o.delivery_partner_id = ? and o.delivery_status = 'DELIVERED'
                order by o.delivered_at desc
                """,
                DELIVERY_RATE_PER_KM,
                partner.profileId()
        );
        return ResponseEntity.ok(rows);
    }

    @Data
    public static class UpdateStatusRequest {
        @NotBlank
        private String status;
    }

    private void insertDemoOrder(
            Long farmerId,
            String orderCode,
            String customerName,
            String customerPhone,
            String pickup,
            String address,
            BigDecimal distance,
            OffsetDateTime createdAt
    ) {
        jdbcTemplate.update(
                """
                insert into orders (
                    order_code, farmer_id, customer_name, customer_phone, quantity, quantity_unit,
                    status, payment_status, pickup_location, delivery_address, distance_km,
                    order_amount, created_at
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                orderCode,
                farmerId,
                customerName,
                customerPhone,
                10,
                "kg",
                "Pending",
                "Pending",
                pickup,
                address,
                distance,
                new BigDecimal("2000"),
                Timestamp.from(createdAt.toInstant())
        );
    }
}

