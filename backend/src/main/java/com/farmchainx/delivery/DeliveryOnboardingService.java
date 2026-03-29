package com.farmchainx.delivery;

import com.farmchainx.auth.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeliveryOnboardingService {

    private final JdbcTemplate jdbcTemplate;

    public DeliveryOnboardingService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void createDeliveryProfile(User user) {
        Integer exists = jdbcTemplate.queryForObject(
                "select count(*) from delivery_partner_profiles where user_id = ?",
                Integer.class,
                user.getId()
        );
        if (exists != null && exists > 0) {
            return;
        }

        jdbcTemplate.update(
                "insert into delivery_partner_profiles (user_id, online, vehicle_type) values (?, ?, ?)",
                user.getId(),
                true,
                "Bike"
        );
    }
}

