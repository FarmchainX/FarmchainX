package com.farmchainx.delivery;

import com.farmchainx.auth.RoleType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class DeliveryHelperService {

    private final JdbcTemplate jdbcTemplate;

    public DeliveryHelperService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public DeliveryPartnerContext getOrCreatePartner(String email) {
        Map<String, Object> user = jdbcTemplate.queryForMap(
                "select id, email, full_name, phone, role from users where email = ?",
                email
        );

        String role = String.valueOf(user.get("role"));
        if (!RoleType.DELIVERY_PARTNER.name().equals(role)) {
            throw new IllegalStateException("User is not a delivery partner");
        }

        Long userId = ((Number) user.get("id")).longValue();

        Long profileId = jdbcTemplate.query(
                "select id from delivery_partner_profiles where user_id = ?",
                rs -> rs.next() ? rs.getLong("id") : null,
                userId
        );

        if (profileId == null) {
            jdbcTemplate.update(
                    "insert into delivery_partner_profiles (user_id, online, vehicle_type) values (?, ?, ?)",
                    userId,
                    true,
                    "Bike"
            );
            profileId = jdbcTemplate.queryForObject(
                    "select id from delivery_partner_profiles where user_id = ?",
                    Long.class,
                    userId
            );
        }

        Boolean online = jdbcTemplate.queryForObject(
                "select online from delivery_partner_profiles where id = ?",
                Boolean.class,
                profileId
        );

        return new DeliveryPartnerContext(
                profileId,
                userId,
                String.valueOf(user.get("email")),
                String.valueOf(user.get("full_name")),
                String.valueOf(user.get("phone")),
                online != null && online
        );
    }

    public record DeliveryPartnerContext(
            Long profileId,
            Long userId,
            String email,
            String fullName,
            String phone,
            boolean online
    ) {}
}

