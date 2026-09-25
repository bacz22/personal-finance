package com.finance.personalfinance.auth.api.response;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class RegisterResponse {

    Long id;
    String fullName;
    String email;
    String currency;
    Instant createdAt;
}
