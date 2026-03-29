package com.farmchainx.farmer;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class WithdrawRequest {
    private BigDecimal amount;
    private String description; // optional, e.g. "Withdraw to bank"
}
