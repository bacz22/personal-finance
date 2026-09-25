package com.finance.personalfinance.auth.infrastructure.security;

import com.finance.personalfinance.auth.domain.model.AuthSession;
import com.finance.personalfinance.auth.domain.repository.AuthSessionRepository;
import com.finance.personalfinance.user.domain.model.User;
import com.finance.personalfinance.user.domain.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class SessionActiveFilter extends OncePerRequestFilter {

    private final AuthSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SecurityErrorWriter errorWriter;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)
                || !jwtAuthentication.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        String sessionId = jwtAuthentication.getToken().getClaimAsString("sid");
        Long parsedSessionId;
        try {
            parsedSessionId = Long.valueOf(sessionId);
        } catch (RuntimeException exception) {
            reject(request, response, "SESSION_REVOKED", "Access token không gắn với session hợp lệ.");
            return;
        }

        AuthSession session = sessionRepository.findById(parsedSessionId).orElse(null);
        if (session == null || !session.isActive()) {
            reject(request, response, "SESSION_REVOKED", "Phiên đăng nhập đã bị thu hồi hoặc hết hạn.");
            return;
        }

        Long userId;
        try {
            userId = Long.valueOf(jwtAuthentication.getToken().getSubject());
        } catch (RuntimeException exception) {
            reject(request, response, "USER_NOT_FOUND", "Tài khoản không còn tồn tại.");
            return;
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            reject(request, response, "USER_NOT_FOUND", "Tài khoản không còn tồn tại.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void reject(HttpServletRequest request, HttpServletResponse response, String code, String message)
            throws IOException {
        reject(request, response, code, message, 401);
    }

    private void reject(HttpServletRequest request, HttpServletResponse response, String code, String message,
                        int status) throws IOException {
        SecurityContextHolder.clearContext();
        errorWriter.write(request, response, status, code, message);
    }
}
