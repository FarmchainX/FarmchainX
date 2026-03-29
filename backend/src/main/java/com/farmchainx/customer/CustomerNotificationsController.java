package com.farmchainx.customer;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/notifications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerNotificationsController {

    private final CustomerHelperService helperService;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getNotifications(Authentication authentication) {
        helperService.getOrCreateCustomer(authentication.getName());

        return ResponseEntity.ok(jdbcTemplate.queryForList(
                """
                select concat('admin-', abn.id) as id,
                       'ADMIN_BROADCAST' as type,
                       abn.title,
                       abn.message,
                       abn.created_at as createdAt
                from admin_broadcast_notifications abn
                where abn.target_role = 'CUSTOMER'
                order by abn.created_at desc
                """
        ));
    }
}
