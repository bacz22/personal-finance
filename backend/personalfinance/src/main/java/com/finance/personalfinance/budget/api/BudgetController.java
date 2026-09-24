package com.finance.personalfinance.budget.api;

import com.finance.personalfinance.budget.application.BudgetService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public List<BudgetResponse> findAll(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam String month
    ) {
        return budgetService.findAll(userIdFrom(jwt), month);
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody BudgetRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(budgetService.create(userIdFrom(jwt), request));
    }

    @PutMapping("/{budgetId}")
    public BudgetResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long budgetId,
            @Valid @RequestBody BudgetRequest request
    ) {
        return budgetService.update(userIdFrom(jwt), budgetId, request);
    }

    @DeleteMapping("/{budgetId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long budgetId
    ) {
        budgetService.delete(userIdFrom(jwt), budgetId);
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
