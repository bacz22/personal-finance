package com.finance.personalfinance.auth.api.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RefreshResponse {

    String accessToken;
    @Builder.Default
    String tokenType = "Bearer";
    long expiresIn;
}
