package com.finance.personalfinance.user.api;

import com.finance.personalfinance.auth.api.response.UserSummaryResponse;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.user.api.request.ChangePasswordRequest;
import com.finance.personalfinance.user.api.request.UpdateProfileRequest;
import com.finance.personalfinance.user.application.UserProfileService;
import com.finance.personalfinance.user.domain.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserProfileService userProfileService;

    @GetMapping("/me")
    public UserSummaryResponse currentUser(@AuthenticationPrincipal Jwt jwt) {
        Long userId = userIdFrom(jwt);
        return userRepository.findById(userId)
                .map(UserSummaryResponse::from)
                .orElseThrow(() -> new AppException(
                        HttpStatus.UNAUTHORIZED,
                        "USER_NOT_FOUND",
                        "Tài khoản không còn tồn tại."
                ));
    }

    @PatchMapping("/me")
    public UserSummaryResponse updateCurrentUser(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return userProfileService.updateProfile(userIdFrom(jwt), request);
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userProfileService.changePassword(userIdFrom(jwt), request);
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
