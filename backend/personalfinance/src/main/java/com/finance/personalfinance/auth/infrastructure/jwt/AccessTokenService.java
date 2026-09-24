package com.finance.personalfinance.auth.infrastructure.jwt;

import com.finance.personalfinance.user.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccessTokenService {

    private final JwtEncoder jwtEncoder;
    private final JwtProperties properties;

    public String issue(User user, Long sessionId) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(properties.getIssuer())
                .subject(user.getId().toString())
                .audience(List.of(properties.getAudience()))
                .issuedAt(now)
                .notBefore(now)
                .expiresAt(now.plus(properties.getAccessTokenTtl()))
                .id(java.util.UUID.randomUUID().toString())
                .claim("sid", sessionId.toString())
                .claim("token_version", 1)
                .build();
        JwsHeader header = JwsHeader.with(() -> "RS256")
                .keyId(properties.getKeyId())
                .type("at+JWT")
                .build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
