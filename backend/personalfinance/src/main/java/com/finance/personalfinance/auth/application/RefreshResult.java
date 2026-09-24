package com.finance.personalfinance.auth.application;

import com.finance.personalfinance.auth.api.response.RefreshResponse;
import org.springframework.http.ResponseCookie;

public record RefreshResult(RefreshResponse response, ResponseCookie cookie) {
}
