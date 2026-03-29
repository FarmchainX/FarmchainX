package com.farmchainx.auth;

import com.farmchainx.auth.dto.AuthResponse;
import com.farmchainx.auth.dto.GoogleAuthRequest;
import com.farmchainx.auth.dto.LoginRequest;
import com.farmchainx.auth.dto.RegisterRequest;
import com.farmchainx.customer.CustomerOnboardingService;
import com.farmchainx.delivery.DeliveryOnboardingService;
import com.farmchainx.farmer.FarmerOnboardingService;
import com.farmchainx.security.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final FarmerOnboardingService farmerOnboardingService;
    private final DeliveryOnboardingService deliveryOnboardingService;
    private final CustomerOnboardingService customerOnboardingService;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final EmailVerificationService emailVerificationService;
    private final EmailDeliveryService emailDeliveryService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.admin.auth.show-otp-response:true}")
    private boolean showAdminOtpInResponse;

    @Value("${app.auth.show-email-code-response:true}")
    private boolean showEmailCodeInResponse;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            FarmerOnboardingService farmerOnboardingService,
            DeliveryOnboardingService deliveryOnboardingService,
            CustomerOnboardingService customerOnboardingService,
            GoogleTokenVerifierService googleTokenVerifierService,
            EmailVerificationService emailVerificationService,
            EmailDeliveryService emailDeliveryService,
            JdbcTemplate jdbcTemplate
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.farmerOnboardingService = farmerOnboardingService;
        this.deliveryOnboardingService = deliveryOnboardingService;
        this.customerOnboardingService = customerOnboardingService;
        this.googleTokenVerifierService = googleTokenVerifierService;
        this.emailVerificationService = emailVerificationService;
        this.emailDeliveryService = emailDeliveryService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null || !user.isEnabled() || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (user.getRole() == RoleType.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String jwt = jwtService.generateToken(user);

        AuthResponse response = new AuthResponse();
        response.setToken(jwt);
        response.setRole(user.getRole());
        response.setFullName(user.getFullName());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/request-otp")
    @Transactional
    public ResponseEntity<?> requestAdminOtp(@Valid @RequestBody AdminOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.getRole() != RoleType.ADMIN || !user.isEnabled()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Admin account not found or disabled."));
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid admin credentials."));
        }

        String sessionId = UUID.randomUUID().toString();
        String otp = String.format("%06d", Math.abs(UUID.randomUUID().hashCode()) % 1_000_000);

        jdbcTemplate.update("delete from admin_login_otps where email = ?", email);
        jdbcTemplate.update(
                """
                insert into admin_login_otps (email, session_token, otp_code, expires_at, used, attempt_count, created_at)
                values (?, ?, ?, date_add(now(), interval 5 minute), b'0', 0, now())
                """,
                email,
                sessionId,
                otp
        );

        return ResponseEntity.ok(showAdminOtpInResponse
                ? Map.of(
                        "sessionId", sessionId,
                        "expiresInSeconds", 300,
                        "otpPreview", otp,
                        "message", "OTP generated for admin verification."
                )
                : Map.of(
                        "sessionId", sessionId,
                        "expiresInSeconds", 300,
                        "message", "OTP generated for admin verification."
                ));
    }

    @PostMapping("/admin/verify-otp")
    @Transactional
    public ResponseEntity<?> verifyAdminOtp(@Valid @RequestBody AdminVerifyOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.getRole() != RoleType.ADMIN || !user.isEnabled()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Admin account not found or disabled."));
        }

        var rows = jdbcTemplate.queryForList(
                """
                select otp_code as otpCode, expires_at as expiresAt,
                       cast(used as unsigned) as usedValue,
                       attempt_count as attemptCount
                from admin_login_otps
                where email = ? and session_token = ?
                order by created_at desc
                limit 1
                """,
                email,
                request.getSessionId()
        );

        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "OTP session not found. Please request a new OTP."));
        }

        Map<String, Object> row = rows.get(0);
        boolean used = asBoolean(row.get("usedValue"));
        int attemptCount = row.get("attemptCount") == null ? 0 : ((Number) row.get("attemptCount")).intValue();
        Instant expiresAt = asInstant(row.get("expiresAt"));
        String otpCode = String.valueOf(row.get("otpCode")).trim();
        String providedOtp = request.getOtp().trim();

        if (used || attemptCount >= 5 || expiresAt == null || expiresAt.isBefore(Instant.now())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "OTP expired. Please request a new OTP."));
        }

        if (!otpCode.equals(providedOtp)) {
            jdbcTemplate.update(
                    "update admin_login_otps set attempt_count = attempt_count + 1 where email = ? and session_token = ?",
                    email,
                    request.getSessionId()
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Incorrect OTP entered."));
        }

        jdbcTemplate.update(
                "update admin_login_otps set used = b'1' where email = ? and session_token = ?",
                email,
                request.getSessionId()
        );
        return ResponseEntity.ok(buildAuthResponse(user));
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        if (request.getVerificationCode() == null || request.getVerificationCode().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        var verification = emailVerificationService.consumeForRegistration(email, request.getVerificationCode());
        if (!verification.success()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Role must be explicitly provided during registration - don't default to FARMER
        if (request.getRole() == null) {
            return ResponseEntity.badRequest().build();
        }
        RoleType role = request.getRole();

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(role)
                .enabled(true)
                .build();
        user = userRepository.save(user);

        if (role == RoleType.FARMER) {
            farmerOnboardingService.createFarmerProfileAndWallet(user);
        } else if (role == RoleType.DELIVERY_PARTNER) {
            deliveryOnboardingService.createDeliveryProfile(user);
        } else if (role == RoleType.CUSTOMER) {
            customerOnboardingService.createCustomerProfile(user);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(buildAuthResponse(user));
    }

    @PostMapping("/send-verification-code")
    @Transactional
    public ResponseEntity<?> sendVerificationCode(@Valid @RequestBody EmailVerificationRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "An account with this email already exists."));
        }

        String code = emailVerificationService.createAndStoreCode(email);
        if (!emailDeliveryService.isEmailEnabled()) {
            return ResponseEntity.ok(showEmailCodeInResponse
                    ? Map.of(
                            "message", "Email is disabled for local mode. Use the preview code below.",
                            "codePreview", code,
                            "expiresInSeconds", 600
                    )
                    : Map.of(
                            "message", "Email service disabled in this environment.",
                            "expiresInSeconds", 600
                    ));
        }

        boolean sent = emailDeliveryService.sendVerificationCode(email, code);

        if (sent) {
            return ResponseEntity.ok(Map.of(
                    "message", "Verification code sent to your email.",
                    "expiresInSeconds", 600
            ));
        }

        if (showEmailCodeInResponse) {
            return ResponseEntity.ok(Map.of(
                    "message", "Email delivery is disabled/unavailable. Use code preview for local testing.",
                    "codePreview", code,
                    "expiresInSeconds", 600
            ));
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("message", "Unable to send verification email right now. Please try again."));
    }

    @PostMapping("/verify-email-code")
    @Transactional
    public ResponseEntity<?> verifyEmailCode(@Valid @RequestBody EmailCodeVerifyRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        var result = emailVerificationService.verifyCode(email, request.getCode());
        if (!result.success()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", result.message()));
        }
        return ResponseEntity.ok(Map.of("message", result.message()));
    }

    @PostMapping("/google")
    @Transactional
    public ResponseEntity<AuthResponse> googleAuth(@Valid @RequestBody GoogleAuthRequest request) {
        var payload = googleTokenVerifierService.verify(request.getCredential());
        if (payload == null || payload.email() == null || payload.email().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = payload.email().toLowerCase(Locale.ROOT);
        User existing = userRepository.findByEmail(email).orElse(null);
        if (existing != null) {
            return ResponseEntity.ok(buildAuthResponse(existing));
        }

        RoleType role = request.getRole() != null ? request.getRole() : RoleType.CUSTOMER;
        if (role == RoleType.ADMIN) {
            return ResponseEntity.badRequest().build();
        }

        String fullName = (request.getFullName() != null && !request.getFullName().isBlank())
                ? request.getFullName()
                : payload.name();
        if (fullName == null || fullName.isBlank() || "null".equalsIgnoreCase(fullName)) {
            fullName = email.substring(0, email.indexOf('@'));
        }

        String phone = request.getPhone() != null && !request.getPhone().isBlank()
                ? request.getPhone()
                : "0000000000";

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .fullName(fullName)
                .phone(phone)
                .role(role)
                .enabled(true)
                .build();
        user = userRepository.save(user);
        onboardByRole(user, role);

        return ResponseEntity.status(HttpStatus.CREATED).body(buildAuthResponse(user));
    }

    private void onboardByRole(User user, RoleType role) {
        if (role == RoleType.FARMER) {
            farmerOnboardingService.createFarmerProfileAndWallet(user);
        } else if (role == RoleType.DELIVERY_PARTNER) {
            deliveryOnboardingService.createDeliveryProfile(user);
        } else if (role == RoleType.CUSTOMER) {
            customerOnboardingService.createCustomerProfile(user);
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        String jwt = jwtService.generateToken(user);
        AuthResponse response = new AuthResponse();
        response.setToken(jwt);
        response.setRole(user.getRole());
        response.setFullName(user.getFullName());
        return response;
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

    @Data
    public static class AdminOtpRequest {
        @NotBlank
        @Email
        private String email;

        @NotBlank
        private String password;
    }

    @Data
    public static class AdminVerifyOtpRequest {
        @NotBlank
        @Email
        private String email;

        @NotBlank
        private String sessionId;

        @NotBlank
        private String otp;
    }

    @Data
    public static class EmailVerificationRequest {
        @NotBlank
        @Email
        private String email;
    }

    @Data
    public static class EmailCodeVerifyRequest {
        @NotBlank
        @Email
        private String email;

        @NotBlank
        @Size(min = 4, max = 10)
        private String code;
    }
}

