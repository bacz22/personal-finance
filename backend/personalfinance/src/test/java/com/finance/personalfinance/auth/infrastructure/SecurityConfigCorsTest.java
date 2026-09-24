package com.finance.personalfinance.auth.infrastructure;

import com.finance.personalfinance.auth.infrastructure.security.RestAccessDeniedHandler;
import com.finance.personalfinance.auth.infrastructure.security.RestAuthenticationEntryPoint;
import com.finance.personalfinance.auth.infrastructure.security.SessionActiveFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class SecurityConfigCorsTest {

    @Test
    void productionPreflightAllowsOnlyConfiguredOriginAndApiHeaders() {
        SecurityConfig securityConfig = new SecurityConfig(
                mock(SessionActiveFilter.class),
                mock(RestAuthenticationEntryPoint.class),
                mock(RestAccessDeniedHandler.class));
        MockEnvironment environment = new MockEnvironment()
                .withProperty("app.cors.allowed-origins", "https://chitieu.bmailflow.online");
        CorsConfigurationSource source = securityConfig.corsConfigurationSource(environment);
        MockHttpServletRequest preflight = new MockHttpServletRequest("OPTIONS", "/api/v1/auth/login");
        CorsConfiguration cors = source.getCorsConfiguration(preflight);

        assertEquals("https://chitieu.bmailflow.online", cors.checkOrigin("https://chitieu.bmailflow.online"));
        assertEquals(null, cors.checkOrigin("https://attacker.example"));
        assertTrue(cors.checkHeaders(java.util.List.of("Authorization", "Content-Type")) != null);
        assertTrue(cors.checkHttpMethod(org.springframework.http.HttpMethod.POST) != null);
        assertTrue(cors.getAllowCredentials());
    }
}
