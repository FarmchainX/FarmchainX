package com.farmchainx.customer;

import com.farmchainx.auth.User;
import com.farmchainx.auth.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/customer/profile")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerProfileController {

    private final CustomerHelperService helperService;
    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerProfileController(
            CustomerHelperService helperService,
            UserRepository userRepository,
            CustomerProfileRepository customerProfileRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.helperService = helperService;
        this.userRepository = userRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProfile(Authentication authentication) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        User user = customer.getUser();
        return ResponseEntity.ok(Map.of(
                "fullName", user.getFullName(),
                "email", user.getEmail(),
                "phone", user.getPhone(),
                "preferredName", customer.getPreferredName() == null ? "" : customer.getPreferredName(),
                "city", customer.getCity() == null ? "" : customer.getCity(),
                "bio", customer.getBio() == null ? "" : customer.getBio(),
                "profileImageUrl", customer.getProfileImageUrl() == null ? "" : customer.getProfileImageUrl()
        ));
    }

    @PutMapping
    public ResponseEntity<Void> updateProfile(Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        User user = customer.getUser();

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        userRepository.save(user);

        customer.setPreferredName(request.getPreferredName());
        customer.setCity(request.getCity());
        customer.setBio(request.getBio());
        customer.setProfileImageUrl(request.getProfileImageUrl());
        customerProfileRepository.save(customer);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/password")
    public ResponseEntity<Void> updatePassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().build();
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class UpdateProfileRequest {
        @NotBlank
        private String fullName;

        @NotBlank
        private String phone;

        private String preferredName;
        private String city;
        private String bio;
        private String profileImageUrl;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank
        private String currentPassword;

        @NotBlank
        @Size(min = 6)
        private String newPassword;
    }
}

