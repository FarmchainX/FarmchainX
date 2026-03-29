package com.farmchainx.auth.dto;

import com.farmchainx.auth.RoleType;
import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private RoleType role;
    private String fullName;
}

