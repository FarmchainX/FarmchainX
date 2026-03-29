package com.farmchainx.customer;

import com.farmchainx.auth.User;
import org.springframework.stereotype.Service;

@Service
public class CustomerOnboardingService {

    private final CustomerProfileRepository customerProfileRepository;

    public CustomerOnboardingService(CustomerProfileRepository customerProfileRepository) {
        this.customerProfileRepository = customerProfileRepository;
    }

    public void createCustomerProfile(User user) {
        customerProfileRepository.findByUser(user).orElseGet(() -> customerProfileRepository.save(
                CustomerProfile.builder()
                        .user(user)
                        .preferredName(user.getFullName())
                        .build()
        ));
    }
}

