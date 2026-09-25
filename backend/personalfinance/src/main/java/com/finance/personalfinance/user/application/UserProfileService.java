package com.finance.personalfinance.user.application;

import com.finance.personalfinance.auth.api.response.UserSummaryResponse;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.user.api.request.ChangePasswordRequest;
import com.finance.personalfinance.user.api.request.UpdateProfileRequest;
import com.finance.personalfinance.user.domain.model.User;
import com.finance.personalfinance.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserSummaryResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.UNAUTHORIZED,
                        "USER_NOT_FOUND",
                        "Tài khoản không còn tồn tại."
                ));

        user.updateFullName(request.getFullName());
        return UserSummaryResponse.from(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.UNAUTHORIZED,
                        "USER_NOT_FOUND",
                        "Tài khoản không còn tồn tại."
                ));

        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()
                || !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_CURRENT_PASSWORD",
                    "Mật khẩu hiện tại không chính xác."
            );
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "PASSWORD_UNCHANGED",
                    "Mật khẩu mới phải khác mật khẩu hiện tại."
            );
        }

        user.updatePasswordHash(passwordEncoder.encode(request.getNewPassword()));
    }
}
