package com.finance.personalfinance.auth.application;

import com.finance.personalfinance.auth.domain.model.PasswordRecoveryCredential;
import com.finance.personalfinance.auth.domain.repository.PasswordRecoveryCredentialRepository;
import com.finance.personalfinance.auth.infrastructure.token.SecureTokenGenerator;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.user.domain.model.User;
import com.finance.personalfinance.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordRecoveryService {

    private static final Duration TEMPORARY_PASSWORD_TTL = Duration.ofMinutes(15);
    private static final Duration MAIL_FAILURE_COOLDOWN = Duration.ofMinutes(1);
    private static final String GENERIC_RESPONSE =
            "Nếu email đã đăng ký, hướng dẫn khôi phục sẽ được gửi đến hộp thư của bạn.";

    private final UserRepository userRepository;
    private final PasswordRecoveryCredentialRepository credentialRepository;
    private final PasswordRecoveryRateLimiter rateLimiter;
    private final SecureTokenGenerator tokenGenerator;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final AtomicReference<Instant> mailUnavailableUntil = new AtomicReference<>(Instant.EPOCH);

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.auth.password-recovery-enabled:true}")
    private boolean passwordRecoveryEnabled = true;

    @Transactional
    public String requestTemporaryPassword(String email, String clientIp) {
        if (!passwordRecoveryEnabled) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "PASSWORD_RECOVERY_DISABLED",
                    "Tính năng khôi phục mật khẩu hiện đang tạm tắt.");
        }
        if (Instant.now().isBefore(mailUnavailableUntil.get())) {
            throw mailUnavailable();
        }
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (!rateLimiter.allow(normalizedEmail, clientIp)) {
            return GENERIC_RESPONSE;
        }

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .filter(User::isEnabled)
                .orElse(null);
        if (user == null) {
            return GENERIC_RESPONSE;
        }

        String temporaryPassword = tokenGenerator.generateTemporaryPassword();
        credentialRepository.deleteByUserId(user.getId());
        credentialRepository.save(new PasswordRecoveryCredential(
                user.getId(),
                passwordEncoder.encode(temporaryPassword),
                Instant.now().plus(TEMPORARY_PASSWORD_TTL)
        ));

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(user.getEmail());
            message.setSubject("Mật khẩu tạm thời cho tài khoản Ghi chú chi tiêu");
            message.setText("Xin chào " + user.getFullName() + ",\n\n"
                    + "Mật khẩu tạm thời của bạn là: " + temporaryPassword + "\n\n"
                    + "Mật khẩu có hiệu lực trong 15 phút và chỉ dùng một lần. "
                    + "Sau khi đăng nhập, bạn cần đổi mật khẩu trước khi tiếp tục sử dụng ứng dụng.\n\n"
                    + "Nếu bạn không yêu cầu khôi phục mật khẩu, hãy bỏ qua email này.");
            mailSender.send(message);
        } catch (MailException exception) {
            rateLimiter.refund(normalizedEmail, clientIp);
            mailUnavailableUntil.set(Instant.now().plus(MAIL_FAILURE_COOLDOWN));
            Throwable rootCause = exception.getMostSpecificCause();
            String detail = sanitizeMailError(rootCause.getMessage());
            log.error("Could not send password recovery email for userId={} ({}; rootCause={}; detail={})",
                    user.getId(),
                    exception.getClass().getSimpleName(),
                    rootCause.getClass().getSimpleName(),
                    detail);
            throw mailUnavailable();
        }

        return GENERIC_RESPONSE;
    }

    private static AppException mailUnavailable() {
        return new AppException(HttpStatus.SERVICE_UNAVAILABLE, "PASSWORD_RECOVERY_MAIL_UNAVAILABLE",
                "Dịch vụ gửi email đang tạm gián đoạn. Vui lòng thử lại sau vài phút.");
    }

    private static String sanitizeMailError(String message) {
        if (message == null || message.isBlank()) {
            return "no additional details";
        }

        String sanitized = message
                .replaceAll("(?i)[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}", "[email]")
                .replaceAll("(?i)(password|passwd|secret|token)\\s*[:=]\\s*[^\\s,;]+", "$1=[redacted]")
                .replaceAll("[\\r\\n\\t]+", " ");
        return sanitized.length() > 300 ? sanitized.substring(0, 300) : sanitized;
    }
}
