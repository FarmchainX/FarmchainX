package com.farmchainx.farmer;

import com.farmchainx.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

interface FarmerProfileRepository extends JpaRepository<FarmerProfile, Long> {
    Optional<FarmerProfile> findByUser(User user);
}

interface BatchRepository extends JpaRepository<Batch, Long> {
    List<Batch> findByFarmerId(Long farmerId);
}

interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByBatchFarmerId(Long farmerId);
}

interface WalletRepository extends JpaRepository<Wallet, Long> {
    Optional<Wallet> findByFarmerId(Long farmerId);
}

interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(Long walletId);
}

interface BlockchainRecordRepository extends JpaRepository<BlockchainRecord, Long> {
    List<BlockchainRecord> findByBatchFarmerId(Long farmerId);
}

interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
}

interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
}


