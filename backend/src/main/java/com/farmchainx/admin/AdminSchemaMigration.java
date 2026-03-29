package com.farmchainx.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
@RequiredArgsConstructor
public class AdminSchemaMigration {

    private final JdbcTemplate jdbcTemplate;

    @Bean
    ApplicationRunner migrateAdminModuleSchema() {
        return args -> {
            ensureUserModerationColumns();
            ensureAdminOtpTable();
            ensureDisputesTable();
            ensureBroadcastNotificationsTable();
            ensureRefundsTable();
        };
    }

    private void ensureUserModerationColumns() {
        ensureColumn("users", "approval_status", "alter table users add column approval_status varchar(40) not null default 'APPROVED'");
        ensureColumn("users", "flagged", "alter table users add column flagged bit not null default b'0'");
        ensureColumn("users", "suspension_reason", "alter table users add column suspension_reason varchar(500) null");
    }

    private void ensureAdminOtpTable() {
        jdbcTemplate.execute(
                """
                create table if not exists admin_login_otps (
                    id bigint not null auto_increment,
                    email varchar(255) not null,
                    session_token varchar(120) not null,
                    otp_code varchar(20) not null,
                    expires_at datetime(6) not null,
                    used bit not null default b'0',
                    attempt_count int not null default 0,
                    created_at datetime(6) not null,
                    primary key (id),
                    unique key uk_admin_login_otps_session_token (session_token)
                ) engine=InnoDB
                """
        );
    }

    private void ensureDisputesTable() {
        jdbcTemplate.execute(
                """
                create table if not exists admin_disputes (
                    id bigint not null auto_increment,
                    subject varchar(255) not null,
                    description varchar(2000) not null,
                    priority varchar(40) not null,
                    status varchar(40) not null,
                    related_order_id bigint null,
                    raised_against_role varchar(60) null,
                    raised_against_user_id bigint null,
                    created_by_admin_id bigint null,
                    resolution_notes varchar(2000) null,
                    created_at datetime(6) not null,
                    resolved_at datetime(6) null,
                    primary key (id)
                ) engine=InnoDB
                """
        );
    }

    private void ensureBroadcastNotificationsTable() {
        jdbcTemplate.execute(
                """
                create table if not exists admin_broadcast_notifications (
                    id bigint not null auto_increment,
                    target_role varchar(60) not null,
                    title varchar(255) not null,
                    message varchar(1500) not null,
                    status varchar(40) not null,
                    created_by_admin_id bigint null,
                    created_at datetime(6) not null,
                    primary key (id)
                ) engine=InnoDB
                """
        );
    }

    private void ensureRefundsTable() {
        jdbcTemplate.execute(
                """
                create table if not exists admin_refunds (
                    id bigint not null auto_increment,
                    order_id bigint not null,
                    amount decimal(12,2) not null,
                    reason varchar(500) null,
                    status varchar(40) not null,
                    created_by_admin_id bigint null,
                    created_at datetime(6) not null,
                    primary key (id),
                    unique key uk_admin_refunds_order_id (order_id)
                ) engine=InnoDB
                """
        );
    }

    private void ensureColumn(String tableName, String columnName, String ddl) {
        Integer exists = jdbcTemplate.queryForObject(
                """
                select count(*)
                from information_schema.columns
                where table_schema = database() and table_name = ? and column_name = ?
                """,
                Integer.class,
                tableName,
                columnName
        );
        if (exists == 0) {
            jdbcTemplate.execute(ddl);
        }
    }
}

