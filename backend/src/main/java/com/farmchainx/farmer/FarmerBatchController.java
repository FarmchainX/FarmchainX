package com.farmchainx.farmer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/farmer/batches")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FarmerBatchController {

    private final FarmerHelperService farmerHelperService;
    private final BatchRepository batchRepository;
    private final BlockchainRecordRepository blockchainRecordRepository;

    @GetMapping
    public ResponseEntity<List<Batch>> listBatches(Authentication authentication) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        List<Batch> batches = batchRepository.findByFarmerId(farmer.getId());
        return ResponseEntity.ok(batches);
    }

    @PostMapping
    public ResponseEntity<Batch> createBatch(
            Authentication authentication,
            @Valid @RequestBody CreateBatchRequest request
    ) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());

        Batch batch = Batch.builder()
                .batchCode(request.getBatchCode())
                .farmer(farmer)
                .cropName(request.getCropName())
                .seedType(request.getSeedType())
                .category(request.getCategory())
                .plantingDate(request.getPlantingDate())
                .expectedHarvestDate(request.getExpectedHarvestDate())
                .location(request.getLocation())
                .status("ACTIVE")
                .build();

        Batch saved = batchRepository.save(batch);

        // Auto-generate blockchain traceability record
        String traceHash = "0x" + UUID.randomUUID().toString().replace("-", "");
        BlockchainRecord record = BlockchainRecord.builder()
                .batch(saved)
                .traceHash(traceHash)
                .timestamp(OffsetDateTime.now())
                .status("VERIFIED")
                .verified(true)
                .build();
        blockchainRecordRepository.save(record);

        return ResponseEntity.ok(saved);
    }

    @Data
    public static class CreateBatchRequest {
        @NotBlank
        private String batchCode;

        @NotBlank
        private String cropName;

        private String seedType;
        private String category;
        private LocalDate plantingDate;
        private LocalDate expectedHarvestDate;
        private String location;
    }
}

