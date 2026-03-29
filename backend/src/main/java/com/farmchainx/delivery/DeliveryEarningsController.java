package com.farmchainx.delivery;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
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
@RequestMapping("/api/delivery/earnings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DELIVERY_PARTNER')")
public class DeliveryEarningsController {

    private final DeliveryHelperService helperService;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(Authentication authentication) {
        var partner = helperService.getOrCreatePartner(authentication.getName());

        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime startToday = LocalDate.now().atStartOfDay().atOffset(now.getOffset());
        OffsetDateTime startWeek = startToday.minusDays(6);
        OffsetDateTime startMonth = startToday.withDayOfMonth(1);

        Map<String, Object> payload = new HashMap<>();
        payload.put("today", sumBetween(partner.profileId(), startToday, now));
        payload.put("weekly", sumBetween(partner.profileId(), startWeek, now));
        payload.put("monthly", sumBetween(partner.profileId(), startMonth, now));
        payload.put("total", sumTotal(partner.profileId()));
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<Map<String, Object>>> getTransactions(Authentication authentication) {
        var partner = helperService.getOrCreatePartner(authentication.getName());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select o.id, o.order_code as orderCode, o.customer_name as customerName,
                       o.delivered_at as deliveredAt,
                       coalesce(o.delivery_fee, round(coalesce(o.order_amount, 0) * 0.08, 2), 50) as amount
                from orders o
                where o.delivery_partner_id = ? and o.delivery_status = 'DELIVERED'
                order by o.delivered_at desc
                """,
                partner.profileId()
        );
        return ResponseEntity.ok(rows);
    }

    private BigDecimal sumBetween(Long profileId, OffsetDateTime from, OffsetDateTime to) {
        BigDecimal value = jdbcTemplate.queryForObject(
                """
                select coalesce(sum(coalesce(delivery_fee, round(coalesce(order_amount, 0) * 0.08, 2), 50)), 0)
                from orders
                where delivery_partner_id = ? and delivery_status = 'DELIVERED' and delivered_at between ? and ?
                """,
                BigDecimal.class,
                profileId,
                Timestamp.from(from.toInstant()),
                Timestamp.from(to.toInstant())
        );
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal sumTotal(Long profileId) {
        BigDecimal value = jdbcTemplate.queryForObject(
                """
                select coalesce(sum(coalesce(delivery_fee, round(coalesce(order_amount, 0) * 0.08, 2), 50)), 0)
                from orders
                where delivery_partner_id = ? and delivery_status = 'DELIVERED'
                """,
                BigDecimal.class,
                profileId
        );
        return value == null ? BigDecimal.ZERO : value;
    }
}

