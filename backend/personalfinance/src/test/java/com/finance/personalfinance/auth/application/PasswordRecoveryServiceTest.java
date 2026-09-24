package com.finance.personalfinance.auth.application;

import com.finance.personalfinance.auth.domain.repository.PasswordRecoveryCredentialRepository;
import com.finance.personalfinance.auth.infrastructure.token.SecureTokenGenerator;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.user.domain.model.User;
import com.finance.personalfinance.user.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class PasswordRecoveryServiceTest {

    @Test
    void smtpFailureReturnsServiceUnavailableAndRefundsRateLimit() {
        UserRepository users = mock(UserRepository.class);
        PasswordRecoveryCredentialRepository credentials = mock(PasswordRecoveryCredentialRepository.class);
        PasswordRecoveryRateLimiter limiter = mock(PasswordRecoveryRateLimiter.class);
        SecureTokenGenerator tokens = mock(SecureTokenGenerator.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        JavaMailSender mailSender = mock(JavaMailSender.class);
        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);
        when(user.isEnabled()).thenReturn(true);
        when(user.getEmail()).thenReturn("person@example.com");
        when(user.getFullName()).thenReturn("Person");
        when(users.findByEmailIgnoreCase("person@example.com")).thenReturn(Optional.of(user));
        when(limiter.allow("person@example.com", "192.0.2.10")).thenReturn(true);
        when(tokens.generateTemporaryPassword()).thenReturn("temporary-password");
        when(encoder.encode("temporary-password")).thenReturn("hash");
        doThrow(new MailSendException("SMTP unavailable")).when(mailSender).send(any(org.springframework.mail.SimpleMailMessage.class));

        PasswordRecoveryService service = new PasswordRecoveryService(
                users, credentials, limiter, tokens, encoder, mailSender);
        ReflectionTestUtils.setField(service, "fromAddress", "sender@example.com");

        AppException error = assertThrows(AppException.class,
                () -> service.requestTemporaryPassword("person@example.com", "192.0.2.10"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatus());
        assertEquals("PASSWORD_RECOVERY_MAIL_UNAVAILABLE", error.getErrorCode());
        verify(limiter).refund("person@example.com", "192.0.2.10");
    }

    @Test
    void disabledPasswordRecoveryDoesNotLookUpUserOrSendEmail() {
        UserRepository users = mock(UserRepository.class);
        PasswordRecoveryCredentialRepository credentials = mock(PasswordRecoveryCredentialRepository.class);
        PasswordRecoveryRateLimiter limiter = mock(PasswordRecoveryRateLimiter.class);
        SecureTokenGenerator tokens = mock(SecureTokenGenerator.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        JavaMailSender mailSender = mock(JavaMailSender.class);
        PasswordRecoveryService service = new PasswordRecoveryService(
                users, credentials, limiter, tokens, encoder, mailSender);
        ReflectionTestUtils.setField(service, "passwordRecoveryEnabled", false);

        AppException error = assertThrows(AppException.class,
                () -> service.requestTemporaryPassword("person@example.com", "192.0.2.10"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatus());
        assertEquals("PASSWORD_RECOVERY_DISABLED", error.getErrorCode());
        verifyNoInteractions(users, credentials, limiter, tokens, encoder, mailSender);
    }
}
