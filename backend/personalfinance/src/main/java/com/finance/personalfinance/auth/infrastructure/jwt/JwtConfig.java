package com.finance.personalfinance.auth.infrastructure.jwt;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.List;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class JwtConfig {

    private final JwtProperties properties;
    private final Environment environment;

    @Bean
    public RSAKey rsaKey() {
        boolean configured = properties.getPrivateKey() != null && !properties.getPrivateKey().isBlank()
                && properties.getPublicKey() != null && !properties.getPublicKey().isBlank();
        if (configured) {
            try {
                return new RSAKey.Builder(parsePublicKey(properties.getPublicKey()))
                        .privateKey(parsePrivateKey(properties.getPrivateKey()))
                        .keyID(properties.getKeyId())
                        .algorithm(JWSAlgorithm.RS256)
                        .build();
            } catch (Exception exception) {
                throw new IllegalStateException("Không thể đọc JWT RSA key từ cấu hình.", exception);
            }
        }

        if (environment.acceptsProfiles(Profiles.of("prod", "production"))) {
            throw new IllegalStateException("Production bắt buộc phải cấu hình JWT_PRIVATE_KEY và JWT_PUBLIC_KEY.");
        }

        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair pair = generator.generateKeyPair();
            log.warn("Đang tự sinh RSA key cho môi trường local; không dùng cách này ở production.");
            return new RSAKey.Builder((RSAPublicKey) pair.getPublic())
                    .privateKey((RSAPrivateKey) pair.getPrivate())
                    .keyID(properties.getKeyId())
                    .algorithm(JWSAlgorithm.RS256)
                    .build();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("RSA algorithm không khả dụng.", exception);
        }
    }

    @Bean
    public JWKSource<SecurityContext> jwkSource(RSAKey rsaKey) {
        return new ImmutableJWKSet<>(new JWKSet(rsaKey));
    }

    @Bean
    public JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }

    @Bean
    public JwtDecoder jwtDecoder(RSAKey rsaKey) throws JOSEException {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey()).build();
        OAuth2TokenValidator<Jwt> timestamp = new JwtTimestampValidator(Duration.ofSeconds(30));
        OAuth2TokenValidator<Jwt> issuer = new JwtClaimValidator<>("iss",
                value -> properties.getIssuer().equals(value));
        OAuth2TokenValidator<Jwt> audience = new JwtClaimValidator<List<String>>("aud",
                value -> value != null && value.contains(properties.getAudience()));
        OAuth2TokenValidator<Jwt> type = token -> {
            Object headerType = token.getHeaders().get("typ");
            return headerType == null || "at+JWT".equals(headerType.toString())
                    ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(new OAuth2Error(
                    "invalid_token", "JWT typ không hợp lệ.", null));
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(timestamp, issuer, audience, type));
        return decoder;
    }

    private RSAPublicKey parsePublicKey(String value) throws Exception {
        byte[] bytes = Base64.getDecoder().decode(stripPem(value,
                "-----BEGIN PUBLIC KEY-----", "-----END PUBLIC KEY-----"));
        return (RSAPublicKey) KeyFactory.getInstance("RSA")
                .generatePublic(new X509EncodedKeySpec(bytes));
    }

    private RSAPrivateKey parsePrivateKey(String value) throws Exception {
        byte[] bytes = Base64.getDecoder().decode(stripPem(value,
                "-----BEGIN PRIVATE KEY-----", "-----END PRIVATE KEY-----"));
        return (RSAPrivateKey) KeyFactory.getInstance("RSA")
                .generatePrivate(new PKCS8EncodedKeySpec(bytes));
    }

    private String stripPem(String value, String begin, String end) {
        return value.replace(begin, "").replace(end, "").replaceAll("\\s+", "");
    }
}
