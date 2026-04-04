package com.farmchainx.farmer;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
@RequiredArgsConstructor
public class FarmerLocationSchemaMigration {

    private final JdbcTemplate jdbcTemplate;

    @Bean
    ApplicationRunner migrateFarmerLocationSchema() {
        return args -> {
            try {
                jdbcTemplate.execute("alter table farmer_profiles add column if not exists farm_latitude decimal(10,7)");
                jdbcTemplate.execute("alter table farmer_profiles add column if not exists farm_longitude decimal(10,7)");
            } catch (Exception ignored) {
                // Keep startup resilient when the database is not ready yet.
            }
        };
    }
}

