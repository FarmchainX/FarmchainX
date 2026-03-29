package com.farmchainx.farmer;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/farmer/blockchain")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FarmerBlockchainController {

    private final FarmerHelperService farmerHelperService;
    private final BlockchainRecordRepository blockchainRecordRepository;

    @GetMapping
    public ResponseEntity<List<BlockchainRecord>> listRecords(Authentication authentication) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        List<BlockchainRecord> records = blockchainRecordRepository.findByBatchFarmerId(farmer.getId());
        return ResponseEntity.ok(records);
    }
}

