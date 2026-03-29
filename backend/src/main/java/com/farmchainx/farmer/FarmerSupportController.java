package com.farmchainx.farmer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/farmer/support")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FarmerSupportController {

    private final FarmerHelperService farmerHelperService;
    private final SupportTicketRepository supportTicketRepository;

    @GetMapping("/tickets")
    public ResponseEntity<List<SupportTicket>> listTickets(Authentication authentication) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        List<SupportTicket> tickets =
                supportTicketRepository.findByFarmerIdOrderByCreatedAtDesc(farmer.getId());
        return ResponseEntity.ok(tickets);
    }

    @PostMapping("/tickets")
    public ResponseEntity<SupportTicket> createTicket(
            Authentication authentication,
            @Valid @RequestBody CreateTicketRequest request
    ) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());

        OffsetDateTime now = OffsetDateTime.now();
        SupportTicket ticket = SupportTicket.builder()
                .farmer(farmer)
                .subject(request.getSubject())
                .description(request.getDescription())
                .status("Pending")
                .createdAt(now)
                .updatedAt(now)
                .build();

        SupportTicket saved = supportTicketRepository.save(ticket);
        return ResponseEntity.ok(saved);
    }

    @Data
    public static class CreateTicketRequest {
        @NotBlank
        private String subject;

        @NotBlank
        private String description;
    }
}

