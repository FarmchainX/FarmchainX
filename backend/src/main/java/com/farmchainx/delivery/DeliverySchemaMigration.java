package com.farmchainx.delivery;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
@RequiredArgsConstructor
public class DeliverySchemaMigration {

    private final JdbcTemplate jdbcTemplate;

    @Bean
    ApplicationRunner migrateDeliveryNotificationsReadColumn() {
        return args -> {
            Integer tableExists = jdbcTemplate.queryForObject(
                    """
                    select count(*)
                    from information_schema.tables
                    where table_schema = database() and table_name = 'delivery_notifications'
                    """,
                    Integer.class
            );

            if (tableExists == null || tableExists == 0) {
                return;
            }

            Integer legacyReadExists = jdbcTemplate.queryForObject(
                    """
                    select count(*)
                    from information_schema.columns
                    where table_schema = database() and table_name = 'delivery_notifications' and column_name = 'read'
                    """,
                    Integer.class
            );

            Integer isReadExists = jdbcTemplate.queryForObject(
                    """
                    select count(*)
                    from information_schema.columns
                    where table_schema = database() and table_name = 'delivery_notifications' and column_name = 'is_read'
                    """,
                    Integer.class
            );

            if (legacyReadExists != null && legacyReadExists > 0 && (isReadExists == null || isReadExists == 0)) {
                jdbcTemplate.execute("alter table delivery_notifications add column is_read bit not null default b'0'");
                jdbcTemplate.execute("update delivery_notifications set is_read = `read`");
                jdbcTemplate.execute("alter table delivery_notifications drop column `read`");
                return;
            }

            if (legacyReadExists != null && legacyReadExists > 0) {
                jdbcTemplate.execute("update delivery_notifications set is_read = `read`");
                jdbcTemplate.execute("alter table delivery_notifications drop column `read`");
            }
        };
    }
}

