package com.finance.personalfinance.reports.api;

import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.reports.application.MonthlyComparisonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports/monthly-comparison")
@RequiredArgsConstructor
public class MonthlyComparisonController {

    private final MonthlyComparisonService comparisonService;

    @GetMapping
    public MonthlyComparisonResponse compare(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String monthA,
            @RequestParam(required = false) String monthB
    ) {
        return comparisonService.compare(userIdFrom(jwt), monthA, monthB);
    }

    private Long userIdFrom(Jwt jwt) {
        try {
            return Long.valueOf(jwt.getSubject());
        } catch (RuntimeException exception) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Access token không hợp lệ.");
        }
    }
}
