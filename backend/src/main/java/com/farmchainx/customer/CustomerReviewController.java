package com.farmchainx.customer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/reviews")
@CrossOrigin(origins = "*")
public class CustomerReviewController {

    private final CustomerHelperService helperService;
    private final ProductReviewRepository productReviewRepository;
    private final JdbcTemplate jdbcTemplate;

    public CustomerReviewController(
            CustomerHelperService helperService,
            ProductReviewRepository productReviewRepository,
            JdbcTemplate jdbcTemplate
    ) {
        this.helperService = helperService;
        this.productReviewRepository = productReviewRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Map<String, Object>>> getProductReviews(@PathVariable Long productId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select r.id, r.rating, r.comment, r.created_at as createdAt,
                       u.full_name as customerName, cp.profile_image_url as customerImage
                from product_reviews r
                join customer_profiles cp on r.customer_id = cp.id
                join users u on cp.user_id = u.id
                where r.product_id = ?
                order by r.created_at desc
                """,
                productId
        );
        return ResponseEntity.ok(rows);
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> addReview(Authentication authentication, @Valid @RequestBody AddReviewRequest request) {
        CustomerProfile customer = helperService.getOrCreateCustomer(authentication.getName());

        boolean purchased = Boolean.TRUE.equals(jdbcTemplate.query(
                "select count(*) > 0 from orders where customer_user_id = ? and product_id = ? and status = 'Completed'",
                rs -> rs.next() && rs.getBoolean(1),
                customer.getUser().getId(),
                request.getProductId()
        ));

        if (!purchased) {
            return ResponseEntity.badRequest().build();
        }

        if (productReviewRepository.existsByProductIdAndCustomerId(request.getProductId(), customer.getId())) {
            return ResponseEntity.status(409).build();
        }

        ProductReview review = ProductReview.builder()
                .productId(request.getProductId())
                .customer(customer)
                .rating(request.getRating())
                .comment(request.getComment())
                .createdAt(OffsetDateTime.now())
                .build();
        productReviewRepository.save(review);


        return ResponseEntity.noContent().build();
    }

    @Data
    public static class AddReviewRequest {
        @NotNull
        private Long productId;

        @NotNull
        @Min(1)
        @Max(5)
        private Integer rating;

        private String comment;
    }
}

