package com.finance.personalfinance.user.application;

import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.user.api.request.ChangePasswordRequest;
import com.finance.personalfinance.user.domain.model.User;
import com.finance.personalfinance.user.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserProfileService userProfileService;

    @Test
    void changePasswordAlwaysRequiresTheCurrentPassword() {
        User user = new User("Test User", "test@example.com", "old-hash");
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setNewPassword("NewPassword123");
        request.setConfirmPassword("NewPassword123");

        AppException exception = assertThrows(AppException.class,
                () -> userProfileService.changePassword(7L, request));

        assertEquals("INVALID_CURRENT_PASSWORD", exception.getErrorCode());
        assertEquals("old-hash", user.getPasswordHash());
        verify(passwordEncoder, never()).encode(request.getNewPassword());
    }

    @Test
    void changePasswordUpdatesHashWhenCurrentPasswordMatches() {
        User user = new User("Test User", "test@example.com", "old-hash");
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPassword123", "old-hash")).thenReturn(true);
        when(passwordEncoder.matches("NewPassword123", "old-hash")).thenReturn(false);
        when(passwordEncoder.encode("NewPassword123")).thenReturn("new-hash");

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("OldPassword123");
        request.setNewPassword("NewPassword123");
        request.setConfirmPassword("NewPassword123");

        userProfileService.changePassword(7L, request);

        assertEquals("new-hash", user.getPasswordHash());
        verify(passwordEncoder).encode("NewPassword123");
    }
}
