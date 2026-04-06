package com.farmchainx.customer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerQrControllerTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    private CustomerQrController controller;

    @BeforeEach
    void setUp() {
        controller = new CustomerQrController(jdbcTemplate);
    }

    @Test
    void verifyUsesPlainBatchIdAsIs() {
        when(jdbcTemplate.queryForList(anyString(), eq("FCX-123")))
                .thenReturn(List.of(Map.of("verified", true, "batchCode", "FCX-123")));

        ResponseEntity<Map<String, Object>> response = controller.verify(" FCX-123 ");
        Map<String, Object> body = Objects.requireNonNull(response.getBody());

        assertEquals(200, response.getStatusCode().value());
        assertTrue(Boolean.TRUE.equals(body.get("verified")));
        assertEquals("Authentic batch verified on blockchain", body.get("message"));
    }

    @Test
    void verifyStripsQrPayloadPrefixBeforeLookup() {
        when(jdbcTemplate.queryForList(anyString(), eq("FCX-456")))
                .thenReturn(List.of(Map.of("verified", false, "batchCode", "FCX-456")));

        ResponseEntity<Map<String, Object>> response = controller.verify("farmchainx:batch:FCX-456");
        Map<String, Object> body = Objects.requireNonNull(response.getBody());

        assertEquals(200, response.getStatusCode().value());
        assertFalse(Boolean.TRUE.equals(body.get("verified")));
        assertEquals("Batch found but blockchain verification is pending", body.get("message"));
    }

    @Test
    void verifyHandlesCaseInsensitivePrefix() {
        when(jdbcTemplate.queryForList(anyString(), eq("FCX-789")))
                .thenReturn(List.of(Map.of("verified", true, "batchCode", "FCX-789")));

        controller.verify("FarmChainX:Batch:FCX-789");

        ArgumentCaptor<String> batchIdCaptor = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).queryForList(anyString(), batchIdCaptor.capture());
        assertEquals("FCX-789", batchIdCaptor.getValue());
    }

    @Test
    void verifyReturnsNotFoundForPrefixOnlyPayload() {
        ResponseEntity<Map<String, Object>> response = controller.verify("farmchainx:batch:   ");
        Map<String, Object> body = Objects.requireNonNull(response.getBody());

        assertEquals(200, response.getStatusCode().value());
        assertFalse(Boolean.TRUE.equals(body.get("verified")));
        assertEquals("Batch not found", body.get("message"));
        verify(jdbcTemplate, never()).queryForList(anyString(), anyString());
    }
}


