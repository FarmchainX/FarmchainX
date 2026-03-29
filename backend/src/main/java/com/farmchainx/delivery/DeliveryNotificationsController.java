package com.farmchainx.delivery;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/delivery/notifications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DELIVERY_PARTNER')")
public class DeliveryNotificationsController {

    private final DeliveryHelperService helperService;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(Authentication authentication) {
        var partner = helperService.getOrCreatePartner(authentication.getName());
        List<Map<String, Object>> notifications = jdbcTemplate.queryForList(
                """
                select cast(dn.id as char) as id,
                       dn.type,
                       dn.title,
                       dn.message,
                       dn.is_read as isRead,
                       dn.created_at as createdAt
                from delivery_notifications dn
                where dn.delivery_partner_id = ?

                union all

                select concat('admin-', abn.id) as id,
                       'ADMIN_BROADCAST' as type,
                       abn.title,
                       abn.message,
                       true as isRead,
                       abn.created_at as createdAt
                from admin_broadcast_notifications abn
                where abn.target_role = 'DELIVERY_PARTNER'

                order by createdAt desc
                """,
                partner.profileId()
        );

        long unreadCount = jdbcTemplate.queryForObject(
                "select count(*) from delivery_notifications where delivery_partner_id = ? and is_read = false",
                Long.class,
                partner.profileId()
        );

        Map<String, Object> payload = new HashMap<>();
        payload.put("items", notifications);
        payload.put("unread", unreadCount);
        return ResponseEntity.ok(payload);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(Authentication authentication, @PathVariable Long id) {
        var partner = helperService.getOrCreatePartner(authentication.getName());
        jdbcTemplate.update(
                "update delivery_notifications set is_read = true where id = ? and delivery_partner_id = ?",
                id,
                partner.profileId()
        );
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        var partner = helperService.getOrCreatePartner(authentication.getName());
        jdbcTemplate.update(
                "update delivery_notifications set is_read = true where delivery_partner_id = ?",
                partner.profileId()
        );
        return ResponseEntity.noContent().build();
    }
}

