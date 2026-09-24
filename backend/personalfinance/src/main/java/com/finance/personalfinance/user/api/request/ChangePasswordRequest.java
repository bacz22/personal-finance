package com.finance.personalfinance.user.api.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ChangePasswordRequest {

    @Size(max = 100, message = "Mật khẩu hiện tại không được vượt quá 100 ký tự.")
    private String currentPassword;

    @NotBlank(message = "Vui lòng nhập mật khẩu mới.")
    @Size(min = 8, max = 100, message = "Mật khẩu mới phải có từ 8 đến 100 ký tự.")
    @Pattern(regexp = ".*[0-9].*", message = "Mật khẩu mới phải chứa ít nhất một chữ số.")
    private String newPassword;

    @NotBlank(message = "Vui lòng xác nhận mật khẩu mới.")
    @Size(max = 100, message = "Mật khẩu xác nhận không được vượt quá 100 ký tự.")
    private String confirmPassword;

    @AssertTrue(message = "Mật khẩu xác nhận không khớp.")
    public boolean isPasswordMatching() {
        return newPassword != null && newPassword.equals(confirmPassword);
    }
}
