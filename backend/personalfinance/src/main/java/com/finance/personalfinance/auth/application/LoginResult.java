package com.finance.personalfinance.auth.application;

import com.finance.personalfinance.auth.api.response.LoginResponse;
import org.springframework.http.ResponseCookie;

public record LoginResult(LoginResponse response, ResponseCookie cookie) {
}
