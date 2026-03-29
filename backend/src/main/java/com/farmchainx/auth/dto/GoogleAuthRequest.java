package com.farmchainx.auth.dto;

import com.farmchainx.auth.RoleType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleAuthRequest {

    @NotBlank
    private String credential;

    private RoleType role;

    private String fullName;

    private String phone;
}

