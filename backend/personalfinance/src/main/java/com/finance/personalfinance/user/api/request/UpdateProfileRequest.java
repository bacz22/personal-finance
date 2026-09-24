package com.finance.personalfinance.user.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "Vui lòng nhập họ và tên.")
    @Size(min = 2, max = 120, message = "Họ và tên phải có từ 2 đến 120 ký tự.")
    private String fullName;
}
