package com.finance.personalfinance.transaction.api;

import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.transaction.application.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public TransactionPageResponse findAll(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) CategoryType type,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return transactionService.findAll(
                userIdFrom(jwt), type, categoryId, startDate, endDate, minAmount, maxAmount, search, page, size
        );
    }

    @GetMapping("/{transactionId}")
    public TransactionResponse findOne(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long transactionId
    ) {
        return transactionService.findOne(userIdFrom(jwt), transactionId);
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody TransactionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transactionService.create(userIdFrom(jwt), request));
    }

    @PutMapping("/{transactionId}")
    public TransactionResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long transactionId,
            @Valid @RequestBody TransactionRequest request
    ) {
        return transactionService.update(userIdFrom(jwt), transactionId, request);
    }

    @DeleteMapping("/{transactionId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long transactionId
    ) {
        transactionService.delete(userIdFrom(jwt), transactionId);
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
