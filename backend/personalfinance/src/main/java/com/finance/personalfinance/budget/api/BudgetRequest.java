package com.finance.personalfinance.budget.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class BudgetRequest {

    @NotBlank(message = "Vui lòng chọn tháng áp dụng.")
    @Size(min = 7, max = 7, message = "Tháng phải có định dạng YYYY-MM.")
    private String month;

    @NotNull(message = "Vui lòng chọn danh mục chi tiêu.")
    @Positive(message = "Danh mục không hợp lệ.")
    private Long categoryId;

    @NotNull(message = "Vui lòng nhập hạn mức ngân sách.")
    @DecimalMin(value = "0.00", inclusive = false, message = "Hạn mức phải lớn hơn 0.")
    @Digits(integer = 16, fraction = 2, message = "Hạn mức không hợp lệ.")
    private BigDecimal limitAmount;
}
