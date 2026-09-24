package com.finance.personalfinance.auth.infrastructure.jwt;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app.auth")
public class JwtProperties {

    private String issuer = "personalfinance-api";
    private String audience = "personalfinance-api";
    private Duration accessTokenTtl = Duration.ofMinutes(15);
    private Duration refreshTokenTtl = Duration.ofDays(7);
    private Duration rememberMeRefreshTokenTtl = Duration.ofDays(30);
    private String refreshCookieName = "pf_refresh";
    private boolean refreshCookieSecure;
    private Duration refreshGraceTtl = Duration.ofSeconds(10);
    private String keyId = "personalfinance-auth-local";
    private String privateKey;
    private String publicKey;
}
