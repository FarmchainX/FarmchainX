package com.farmchainx.delivery;

import com.farmchainx.auth.RoleType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class DeliveryHelperService {

    private static final Logger logger = LoggerFactory.getLogger(DeliveryHelperService.class);
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

    public void ensureOrderLocationColumns() {
        logger.info("Ensuring order location columns exist...");
        String[] columns = {"pickup_latitude", "pickup_longitude", "delivery_latitude", "delivery_longitude"};
        for (String col : columns) {
            try {
                jdbcTemplate.execute("alter table orders add column " + col + " decimal(10,7)");
                logger.info("Added column: {}", col);
            } catch (Exception e) {
                logger.debug("Column {} already exists or error: {}", col, e.getMessage());
            }
        }
        logger.info("Order location columns ensured");
    }

    public void ensureDeliveryPartnerColumns() {
        logger.info("Ensuring delivery partner columns exist...");
        try {
            jdbcTemplate.execute("alter table orders add column delivery_partner_id bigint");
            logger.info("Added column: delivery_partner_id");
        } catch (Exception e) {
            logger.debug("Column delivery_partner_id already exists or error: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("alter table orders add column assigned_at datetime");
            logger.info("Added column: assigned_at");
        } catch (Exception e) {
            logger.debug("Column assigned_at already exists or error: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("alter table orders add column delivered_at datetime");
            logger.info("Added column: delivered_at");
        } catch (Exception e) {
            logger.debug("Column delivered_at already exists or error: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("alter table orders add column delivery_status varchar(50)");
            logger.info("Added column: delivery_status");
        } catch (Exception e) {
            logger.debug("Column delivery_status already exists or error: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("alter table orders add column delivery_fee decimal(10,2)");
            logger.info("Added column: delivery_fee");
        } catch (Exception e) {
            logger.debug("Column delivery_fee already exists or error: {}", e.getMessage());
        }
        logger.info("Delivery partner columns ensured");
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

