package com.farmchainx.customer;

import com.farmchainx.auth.User;
import com.farmchainx.auth.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class CustomerHelperService {

    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final JdbcTemplate jdbcTemplate;

    public CustomerHelperService(
            UserRepository userRepository,
            CustomerProfileRepository customerProfileRepository,
            JdbcTemplate jdbcTemplate
    ) {
        this.userRepository = userRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public CustomerProfile getOrCreateCustomer(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        return customerProfileRepository.findByUser(user)
                .orElseGet(() -> customerProfileRepository.save(CustomerProfile.builder()
                        .user(user)
                        .preferredName(user.getFullName())
                        .build()));
    }

    public void ensureOrderOwnershipColumn() {
        try {
            jdbcTemplate.execute("alter table orders add column if not exists customer_user_id bigint");
        } catch (Exception ignored) {
            // Keep startup resilient when table does not exist yet.
        }
    }

    public void ensureOrderAddressColumn() {
        try {
            jdbcTemplate.execute("alter table orders add column if not exists customer_address_id bigint");
        } catch (Exception ignored) {
            // Keep startup resilient when table does not exist yet.
        }
    }

    public void ensureOrderPaymentColumn() {
        try {
            jdbcTemplate.execute("alter table orders add column if not exists payment_method_type varchar(40)");
        } catch (Exception ignored) {
            // Keep startup resilient when table does not exist yet.
        }
    }
}

