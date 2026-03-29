package com.farmchainx.auth.dto;

import com.farmchainx.auth.RoleType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 6)
    private String password;

    @NotBlank
    private String fullName;

    @NotBlank
    private String phone;

    private RoleType role;

    @Size(min = 4, max = 10)
    private String verificationCode;
}

