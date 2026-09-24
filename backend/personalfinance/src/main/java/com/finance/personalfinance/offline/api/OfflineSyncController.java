package com.finance.personalfinance.offline.api;

import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.offline.application.OfflineSnapshotService;
import com.finance.personalfinance.offline.application.OfflineSyncService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/offline")
@RequiredArgsConstructor
public class OfflineSyncController {

    private final OfflineSnapshotService snapshotService;
    private final OfflineSyncService syncService;

    @GetMapping("/snapshot")
    public OfflineSnapshotResponse snapshot(@AuthenticationPrincipal Jwt jwt) {
        return snapshotService.getSnapshot(userIdFrom(jwt));
    }

    @PostMapping("/operations")
    public OfflineOperationResponse apply(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody OfflineOperationRequest operation
    ) {
        return syncService.apply(userIdFrom(jwt), operation);
    }

    private Long userIdFrom(Jwt jwt) {
        try {
            return Long.valueOf(jwt.getSubject());
        } catch (RuntimeException exception) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Access token không hợp lệ.");
        }
    }
}
