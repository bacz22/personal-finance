package com.finance.personalfinance.auth.api.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Vui lòng nhập họ và tên.")
    @Size(min = 2, max = 120, message = "Họ và tên phải có từ 2 đến 120 ký tự.")
    private String fullName;

    @NotBlank(message = "Vui lòng nhập email.")
    @Email(message = "Email không đúng định dạng.")
    @Size(max = 320, message = "Email không được vượt quá 320 ký tự.")
    private String email;

    @NotBlank(message = "Vui lòng nhập mật khẩu.")
    @Size(min = 8, max = 100, message = "Mật khẩu phải có từ 8 đến 100 ký tự.")
    @Pattern(regexp = ".*[0-9].*", message = "Mật khẩu phải chứa ít nhất một chữ số.")
    private String password;

    @NotBlank(message = "Vui lòng xác nhận mật khẩu.")
    private String confirmPassword;

    @AssertTrue(message = "Mật khẩu xác nhận không khớp.")
    public boolean isPasswordMatching() {
        return password != null && password.equals(confirmPassword);
    }
}
