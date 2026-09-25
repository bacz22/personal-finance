package com.finance.personalfinance.auth.api.response;

import com.finance.personalfinance.user.domain.model.User;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserSummaryResponse {

    Long id;
    String fullName;
    String email;
    String currency;

    public static UserSummaryResponse from(User user) {
        return UserSummaryResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .currency(user.getCurrency())
                .build();
    }
}
