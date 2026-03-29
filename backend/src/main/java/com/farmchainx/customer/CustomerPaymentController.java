package com.farmchainx.customer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/customer/payments")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerPaymentController {

    private final CustomerHelperService helperService;
    private final CustomerPaymentMethodRepository paymentMethodRepository;

    public CustomerPaymentController(
            CustomerHelperService helperService,
            CustomerPaymentMethodRepository paymentMethodRepository
    ) {
        this.helperService = helperService;
        this.paymentMethodRepository = paymentMethodRepository;
    }

    @GetMapping
    public ResponseEntity<List<CustomerPaymentMethod>> list(Authentication authentication) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        return ResponseEntity.ok(paymentMethodRepository.findByCustomerIdOrderByIsDefaultDescIdDesc(customer.getId()));
    }

    @PostMapping
    public ResponseEntity<CustomerPaymentMethod> add(
            Authentication authentication,
            @Valid @RequestBody PaymentRequest request
    ) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        if (request.isDefault) {
            clearDefaults(customer.getId());
        }

        CustomerPaymentMethod paymentMethod = CustomerPaymentMethod.builder()
                .customer(customer)
                .methodType(request.getMethodType())
                .provider(request.getProvider())
                .accountRef(request.getAccountRef())
                .isDefault(request.isDefault)
                .build();

        return ResponseEntity.ok(paymentMethodRepository.save(paymentMethod));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerPaymentMethod> update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody PaymentRequest request
    ) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        CustomerPaymentMethod paymentMethod = paymentMethodRepository.findById(id).orElse(null);
        if (paymentMethod == null || !paymentMethod.getCustomer().getId().equals(customer.getId())) {
            return ResponseEntity.notFound().build();
        }

        if (request.isDefault) {
            clearDefaults(customer.getId());
        }

        paymentMethod.setMethodType(request.getMethodType());
        paymentMethod.setProvider(request.getProvider());
        paymentMethod.setAccountRef(request.getAccountRef());
        paymentMethod.setDefault(request.isDefault);

        return ResponseEntity.ok(paymentMethodRepository.save(paymentMethod));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(Authentication authentication, @PathVariable Long id) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        CustomerPaymentMethod paymentMethod = paymentMethodRepository.findById(id).orElse(null);
        if (paymentMethod == null || !paymentMethod.getCustomer().getId().equals(customer.getId())) {
            return ResponseEntity.notFound().build();
        }
        paymentMethodRepository.delete(paymentMethod);
        return ResponseEntity.noContent().build();
    }

    private void clearDefaults(Long customerId) {
        List<CustomerPaymentMethod> methods = paymentMethodRepository.findByCustomerIdOrderByIsDefaultDescIdDesc(customerId);
        for (CustomerPaymentMethod method : methods) {
            if (method.isDefault()) {
                method.setDefault(false);
                paymentMethodRepository.save(method);
            }
        }
    }

    @Data
    public static class PaymentRequest {
        @NotBlank
        private String methodType;

        private String provider;
        private String accountRef;
        private boolean isDefault;
    }
}

