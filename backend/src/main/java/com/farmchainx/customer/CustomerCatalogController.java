package com.farmchainx.customer;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/products")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerCatalogController {

    private final JdbcTemplate jdbcTemplate;

    public CustomerCatalogController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String search
    ) {
        StringBuilder sql = new StringBuilder(
                """
                select p.id, p.name, p.description, p.price_per_unit as pricePerUnit, p.unit, p.stock_quantity as stockQuantity,
                       p.status, p.image_url as imageUrl, b.batch_code as batchCode, b.category, b.location,
                       b.crop_name as cropName, fp.farm_name as farmName, fp.farm_location as farmLocation,
                       coalesce(avg(r.rating), 0) as avgRating, count(r.id) as reviewCount
                from products p
                join batches b on p.batch_id = b.id
                join farmer_profiles fp on b.farmer_id = fp.id
                left join product_reviews r on r.product_id = p.id
                where coalesce(p.stock_quantity, 0) > 0 and (p.status is null or p.status <> 'Archived')
                """
        );

        List<Object> params = new ArrayList<>();
        if (category != null && !category.isBlank()) {
            sql.append(" and lower(coalesce(b.category, '')) = lower(?)");
            params.add(category.trim());
        }
        if (location != null && !location.isBlank()) {
            sql.append(" and lower(coalesce(b.location, '')) like lower(?)");
            params.add("%" + location.trim() + "%");
        }
        if (search != null && !search.isBlank()) {
            sql.append(" and (lower(coalesce(p.name, '')) like lower(?) or lower(coalesce(b.crop_name, '')) like lower(?))");
            String term = "%" + search.trim() + "%";
            params.add(term);
            params.add(term);
        }

        sql.append(" group by p.id order by p.id desc");

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(), params.toArray());
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProductDetails(@PathVariable Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select p.id, p.name, p.description, p.price_per_unit as pricePerUnit, p.unit, p.stock_quantity as stockQuantity,
                       p.status, p.image_url as imageUrl, b.batch_code as batchCode, b.seed_type as seedType,
                       b.crop_name as cropName, b.category, b.location, b.status as batchStatus,
                       fp.farm_name as farmName, fp.farm_location as farmLocation, fp.farm_description as farmDescription,
                       coalesce(avg(r.rating), 0) as avgRating, count(r.id) as reviewCount
                from products p
                join batches b on p.batch_id = b.id
                join farmer_profiles fp on b.farmer_id = fp.id
                left join product_reviews r on r.product_id = p.id
                where p.id = ?
                group by p.id
                """,
                id
        );

        if (rows.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rows.get(0));
    }
}

