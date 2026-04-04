package com.farmchainx.chatbot;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/message")
    public ResponseEntity<ChatbotResponse> sendMessage(
            @RequestBody ChatbotRequest request,
            Authentication authentication) {
        
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Determine role from authentication or request
        String role = request.getRole();
        if (role == null || role.isEmpty()) {
            String userRole = authentication != null ? 
                authentication.getAuthorities().stream()
                    .map(auth -> auth.getAuthority())
                    .filter(auth -> auth.contains("FARMER") || auth.contains("CUSTOMER") || auth.contains("DELIVERY"))
                    .findFirst()
                    .orElse("CUSTOMER")
                : "CUSTOMER";
            role = userRole.replace("ROLE_", "");
        }

        ChatbotResponse response = chatbotService.getResponse(request.getMessage(), role);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Chatbot service is running");
    }
}

