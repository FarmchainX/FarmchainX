package com.farmchainx.farmer;

import com.farmchainx.auth.User;
import com.farmchainx.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FarmerHelperService {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;

    @Transactional(readOnly = true)
    public FarmerProfile getFarmerByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        return farmerProfileRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("Farmer profile not found"));
    }
}

