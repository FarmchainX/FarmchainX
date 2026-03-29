package com.farmchainx.auth;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final int MAX_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void initTable() {
        jdbcTemplate.execute("""
                create table if not exists email_verification_codes (
                    id bigint not null auto_increment,
                    email varchar(255) not null,
                    code varchar(10) not null,
                    expires_at datetime(6) not null,
                    verified bit not null default b'0',
                    used bit not null default b'0',
                    attempt_count int not null default 0,
                    created_at datetime(6) not null default current_timestamp(6),
                    primary key (id),
                    index idx_email_created (email, created_at)
                ) engine=InnoDB
                """);
    }

    @Transactional
    public String createAndStoreCode(String email) {
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        jdbcTemplate.update("delete from email_verification_codes where email = ?", email);
        jdbcTemplate.update(
                """
                insert into email_verification_codes (email, code, expires_at, verified, used, attempt_count, created_at)
                values (?, ?, date_add(now(), interval 10 minute), b'0', b'0', 0, now())
                """,
                email,
                code
        );
        return code;
    }

    @Transactional
    public VerificationResult verifyCode(String email, String providedCode) {
        var row = loadLatest(email);
        if (row == null) {
            return VerificationResult.fail("Verification session not found. Please request a new code.");
        }

        if (isExpired(row) || isUsed(row) || attempts(row) >= MAX_ATTEMPTS) {
            return VerificationResult.fail("Verification code expired. Please request a new code.");
        }

        String actualCode = String.valueOf(row.get("code")).trim();
        if (!actualCode.equals(providedCode.trim())) {
            jdbcTemplate.update(
                    "update email_verification_codes set attempt_count = attempt_count + 1 where id = ?",
                    id(row)
            );
            return VerificationResult.fail("Incorrect verification code.");
        }

        jdbcTemplate.update("update email_verification_codes set verified = b'1' where id = ?", id(row));
        return VerificationResult.ok("Email verified successfully.");
    }

    @Transactional
    public VerificationResult consumeForRegistration(String email, String providedCode) {
        var row = loadLatest(email);
        if (row == null) {
            return VerificationResult.fail("Verification session not found. Please verify email again.");
        }

        if (isExpired(row) || isUsed(row) || attempts(row) >= MAX_ATTEMPTS) {
            return VerificationResult.fail("Verification code expired. Please verify email again.");
        }

        String actualCode = String.valueOf(row.get("code")).trim();
        if (!actualCode.equals(providedCode.trim())) {
            return VerificationResult.fail("Verification code does not match this email.");
        }

        if (!isVerified(row)) {
            return VerificationResult.fail("Email is not verified yet. Please verify the code first.");
        }

        jdbcTemplate.update("update email_verification_codes set used = b'1' where id = ?", id(row));
        return VerificationResult.ok("Email verification confirmed.");
    }

    private Map<String, Object> loadLatest(String email) {
        var rows = jdbcTemplate.queryForList(
                """
                select id, code, expires_at as expiresAt,
                       cast(verified as unsigned) as verifiedValue,
                       cast(used as unsigned) as usedValue,
                       attempt_count as attemptCount
                from email_verification_codes
                where email = ?
                order by created_at desc
                limit 1
                """,
                email
        );
        return rows.isEmpty() ? null : rows.get(0);
    }

    private long id(Map<String, Object> row) {
        return ((Number) row.get("id")).longValue();
    }

    private int attempts(Map<String, Object> row) {
        return row.get("attemptCount") == null ? 0 : ((Number) row.get("attemptCount")).intValue();
    }

    private boolean isUsed(Map<String, Object> row) {
        return asBoolean(row.get("usedValue"));
    }

    private boolean isVerified(Map<String, Object> row) {
        return asBoolean(row.get("verifiedValue"));
    }

    private boolean isExpired(Map<String, Object> row) {
        Instant expiresAt = asInstant(row.get("expiresAt"));
        return expiresAt == null || expiresAt.isBefore(Instant.now());
    }

    private boolean asBoolean(Object value) {
        if (value == null) {
            return false;
        }
        if (value instanceof Boolean boolValue) {
            return boolValue;
        }
        if (value instanceof Number number) {
            return number.intValue() == 1;
        }
        if (value instanceof byte[] bytes) {
            return bytes.length > 0 && bytes[0] == 1;
        }
        return "1".equals(value.toString()) || "true".equalsIgnoreCase(value.toString());
    }

    private Instant asInstant(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toInstant();
        }
        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime.atZone(ZoneId.systemDefault()).toInstant();
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant();
        }
        return Instant.parse(value.toString());
    }

    public record VerificationResult(boolean success, String message) {
        public static VerificationResult ok(String message) {
            return new VerificationResult(true, message);
        }

        public static VerificationResult fail(String message) {
            return new VerificationResult(false, message);
        }
    }
}

