package com.finance.personalfinance.auth.application;

import com.finance.personalfinance.auth.api.request.RegisterRequest;
import com.finance.personalfinance.auth.api.response.RegisterResponse;
import com.finance.personalfinance.category.application.DefaultCategorySeeder;
import com.finance.personalfinance.common.exception.EmailAlreadyExistsException;
import com.finance.personalfinance.user.domain.model.User;
import com.finance.personalfinance.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DefaultCategorySeeder defaultCategorySeeder;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException();
        }

        User user = new User(
                request.getFullName(),
                email,
                passwordEncoder.encode(request.getPassword())
        );
        User saved;
        try {
            saved = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw new EmailAlreadyExistsException();
        }

        defaultCategorySeeder.seedForUser(saved.getId());
        return RegisterResponse.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .currency(saved.getCurrency())
                .mustChangePassword(saved.isMustChangePassword())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
