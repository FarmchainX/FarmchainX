package com.farmchainx.farmer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/farmer/products")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FarmerProductController {

    private final FarmerHelperService farmerHelperService;
    private final BatchRepository batchRepository;
    private final ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<List<Product>> listProducts(Authentication authentication) {
        var farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        List<Product> products = productRepository.findByBatchFarmerId(farmer.getId());
        return ResponseEntity.ok(products);
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(
            Authentication authentication,
            @Valid @RequestBody CreateProductRequest request
    ) {
        var farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        Batch batch = batchRepository.findById(request.getBatchId())
                .filter(b -> b.getFarmer().getId().equals(farmer.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Batch not found for this farmer"));

        Product product = Product.builder()
                .batch(batch)
                .name(request.getName())
                .description(request.getDescription())
                .pricePerUnit(request.getPricePerUnit())
                .unit(request.getUnit())
                .stockQuantity(request.getStockQuantity())
                .status("LISTED")
                .imageUrl(request.getImageUrl())
                .build();

        Product saved = productRepository.save(product);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            Authentication authentication,
            @PathVariable Long id
    ) {
        var farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        Product product = productRepository.findById(id)
                .filter(p -> p.getBatch().getFarmer().getId().equals(farmer.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Product not found for this farmer"));
        productRepository.delete(product);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class CreateProductRequest {
        @NotNull
        private Long batchId;

        @NotBlank
        private String name;

        private String description;

        @NotNull
        private BigDecimal pricePerUnit;

        @NotBlank
        private String unit;

        @NotNull
        private Integer stockQuantity;

        private String imageUrl;
    }
}

