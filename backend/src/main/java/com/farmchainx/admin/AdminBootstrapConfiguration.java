package com.farmchainx.admin;

import com.farmchainx.auth.RoleType;
import com.farmchainx.auth.User;
import com.farmchainx.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class AdminBootstrapConfiguration {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.default-email:admin@farmchainx.com}")
    private String defaultAdminEmail;

    @Value("${app.admin.default-password:Admin@123}")
    private String defaultAdminPassword;

    @Value("${app.admin.default-name:FarmchainX Admin}")
    private String defaultAdminName;

    @Value("${app.admin.default-phone:9999999999}")
    private String defaultAdminPhone;

    @Bean
    ApplicationRunner ensureDefaultAdminAccount() {
        return args -> {
            if (userRepository.findByEmail(defaultAdminEmail).isPresent()) {
                return;
            }

            userRepository.save(User.builder()
                    .email(defaultAdminEmail)
                    .password(passwordEncoder.encode(defaultAdminPassword))
                    .fullName(defaultAdminName)
                    .phone(defaultAdminPhone)
                    .role(RoleType.ADMIN)
                    .enabled(true)
                    .build());
        };
    }
}

