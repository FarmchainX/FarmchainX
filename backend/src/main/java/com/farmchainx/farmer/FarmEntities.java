package com.farmchainx.farmer;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.farmchainx.auth.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "farmer_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
class FarmerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String farmName;
    private String farmLocation;
    private String bankAccountNumber;
    private String bankIfsc;
    private String bankName;
    private String accountHolderName;
    private String displayName;
    @Column(length = 1000)
    private String farmDescription;
    private String language;
    private String timeZone;
    private boolean notifyOrderUpdates;
    private boolean notifyRiskAlerts;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String profileImageUrl;
}

@Entity
@Table(name = "batches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
class Batch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String batchCode;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "farmer_id", nullable = false)
    private FarmerProfile farmer;

    private String cropName;
    private String seedType;
    private String category;
    private LocalDate plantingDate;
    private LocalDate expectedHarvestDate;
    private String location;
    private String status;
}

@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    private String name;
    private String description;
    private BigDecimal pricePerUnit;
    private String unit;
    private Integer stockQuantity;
    private String status;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;
}

@Entity
@Table(name = "wallets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "farmer_id", nullable = false, unique = true)
    private FarmerProfile farmer;

    private BigDecimal totalEarnings;
    private BigDecimal withdrawableBalance;
}

@Entity
@Table(name = "wallet_transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    private OffsetDateTime createdAt;
    private BigDecimal amount;
    private String type;
    private String description;
}

@Entity
@Table(name = "blockchain_records")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
class BlockchainRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @Column(nullable = false, unique = true)
    private String traceHash;

    private OffsetDateTime timestamp;
    private String status;
    private boolean verified;
}

@Entity
@Table(name = "support_tickets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
class SupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "farmer_id", nullable = false)
    private FarmerProfile farmer;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false)
    private String status;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderCode;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "farmer_id", nullable = false)
    private FarmerProfile farmer;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private String customerName;

    private String customerPhone;
    private String pickupLocation;
    private String deliveryAddress;

    private Long customerUserId;
    private Long customerAddressId;
    private String paymentMethodType;

    private Integer quantity;
    private String quantityUnit;
    private BigDecimal orderAmount;
    private BigDecimal distanceKm;
    private BigDecimal deliveryFee;
    private String status;
    private String deliveryStatus;
    private String paymentStatus;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "delivery_partner_id")
    private DeliveryPartnerProfile deliveryPartner;

    private OffsetDateTime createdAt;
    private OffsetDateTime assignedAt;
    private OffsetDateTime pickedUpAt;
    private OffsetDateTime inTransitAt;
    private OffsetDateTime deliveredAt;
}

@Entity
@Table(name = "delivery_partner_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
class DeliveryPartnerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private boolean online;
    private String vehicleType;
    private String vehicleNumber;
    private String licenseNumber;
    private String bankAccountNumber;
    private String bankIfsc;
    private String bankName;
    private String emergencyContact;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String profileImageUrl;
}

@Entity
@Table(name = "delivery_notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
class DeliveryNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "delivery_partner_id", nullable = false)
    private DeliveryPartnerProfile deliveryPartner;

    private String type;
    private String title;

    @Column(length = 1000)
    private String message;

    @Column(name = "is_read")
    private boolean read;
    private OffsetDateTime createdAt;
}
