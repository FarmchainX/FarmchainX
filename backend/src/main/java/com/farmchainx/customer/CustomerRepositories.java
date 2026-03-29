package com.farmchainx.customer;

import com.farmchainx.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

interface CustomerProfileRepository extends JpaRepository<CustomerProfile, Long> {
    Optional<CustomerProfile> findByUser(User user);
}

interface CustomerAddressRepository extends JpaRepository<CustomerAddress, Long> {
    List<CustomerAddress> findByCustomerIdOrderByIsDefaultDescIdDesc(Long customerId);
}

interface CustomerCartItemRepository extends JpaRepository<CustomerCartItem, Long> {
    List<CustomerCartItem> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    Optional<CustomerCartItem> findByCustomerIdAndProductId(Long customerId, Long productId);

    void deleteByCustomerId(Long customerId);
}

interface CustomerPaymentMethodRepository extends JpaRepository<CustomerPaymentMethod, Long> {
    List<CustomerPaymentMethod> findByCustomerIdOrderByIsDefaultDescIdDesc(Long customerId);
}

interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    List<ProductReview> findByProductIdOrderByCreatedAtDesc(Long productId);

    boolean existsByProductIdAndCustomerId(Long productId, Long customerId);
}

