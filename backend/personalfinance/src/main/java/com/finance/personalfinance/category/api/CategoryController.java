package com.finance.personalfinance.category.api;

import com.finance.personalfinance.category.application.CategoryService;
import com.finance.personalfinance.common.exception.AppException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public List<CategoryResponse> findAll(@AuthenticationPrincipal Jwt jwt) {
        return categoryService.findAll(userIdFrom(jwt));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CategoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoryService.create(userIdFrom(jwt), request));
    }

    @PutMapping("/{categoryId}")
    public CategoryResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long categoryId,
            @Valid @RequestBody CategoryRequest request
    ) {
        return categoryService.update(userIdFrom(jwt), categoryId, request);
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deactivate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long categoryId
    ) {
        categoryService.deactivate(userIdFrom(jwt), categoryId);
        return ResponseEntity.noContent().build();
    }

    private Long userIdFrom(Jwt jwt) {
        try {
            return Long.valueOf(jwt.getSubject());
        } catch (RuntimeException exception) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Access token không hợp lệ.");
        }
    }
}
