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
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/customer/addresses")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerAddressController {

    private final CustomerHelperService helperService;
    private final CustomerAddressRepository addressRepository;

    public CustomerAddressController(CustomerHelperService helperService, CustomerAddressRepository addressRepository) {
        this.helperService = helperService;
        this.addressRepository = addressRepository;
    }

    @GetMapping
    public ResponseEntity<List<CustomerAddress>> getAddresses(Authentication authentication) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        return ResponseEntity.ok(addressRepository.findByCustomerIdOrderByIsDefaultDescIdDesc(customer.getId()));
    }

    @PostMapping
    public ResponseEntity<CustomerAddress> createAddress(
            Authentication authentication,
            @Valid @RequestBody AddressRequest request
    ) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        if (request.isDefault) {
            resetDefaultAddress(customer.getId());
        }

        CustomerAddress address = CustomerAddress.builder()
                .customer(customer)
                .label(request.getLabel())
                .recipientName(request.getRecipientName())
                .phone(request.getPhone())
                .addressLine(request.getAddressLine())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .isDefault(request.isDefault)
                .build();

        return ResponseEntity.ok(addressRepository.save(address));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerAddress> updateAddress(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody AddressRequest request
    ) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        CustomerAddress address = addressRepository.findById(id).orElse(null);
        if (address == null || !address.getCustomer().getId().equals(customer.getId())) {
            return ResponseEntity.notFound().build();
        }

        if (request.isDefault) {
            resetDefaultAddress(customer.getId());
        }

        address.setLabel(request.getLabel());
        address.setRecipientName(request.getRecipientName());
        address.setPhone(request.getPhone());
        address.setAddressLine(request.getAddressLine());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());
        address.setDefault(request.isDefault);

        return ResponseEntity.ok(addressRepository.save(address));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(Authentication authentication, @PathVariable Long id) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());
        CustomerAddress address = addressRepository.findById(id).orElse(null);
        if (address == null || !address.getCustomer().getId().equals(customer.getId())) {
            return ResponseEntity.notFound().build();
        }
        addressRepository.delete(address);
        return ResponseEntity.noContent().build();
    }

    private void resetDefaultAddress(Long customerId) {
        List<CustomerAddress> addresses = addressRepository.findByCustomerIdOrderByIsDefaultDescIdDesc(customerId);
        for (CustomerAddress address : addresses) {
            if (address.isDefault()) {
                address.setDefault(false);
                addressRepository.save(address);
            }
        }
    }

    @Data
    public static class AddressRequest {
        @NotBlank
        private String label;

        @NotBlank
        private String recipientName;

        @NotBlank
        private String phone;

        @NotBlank
        private String addressLine;

        @NotBlank
        private String city;

        @NotBlank
        private String state;

        @NotBlank
        private String postalCode;

        private BigDecimal latitude;
        private BigDecimal longitude;

        private boolean isDefault;
    }
}

