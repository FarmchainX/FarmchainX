package com.farmchainx.customer;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class CustomerLocationSchemaMigration {

    private final CustomerHelperService customerHelperService;

    @Bean
    ApplicationRunner migrateCustomerLocationSchema() {
        return args -> {
            customerHelperService.ensureCustomerAddressLocationColumns();
            customerHelperService.ensureOrderLocationColumns();
        };
    }
}

