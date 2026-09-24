package com.finance.personalfinance.transaction.api;

import com.finance.personalfinance.category.domain.model.CategoryType;
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
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class TransactionRequest {

    @NotNull(message = "Vui lòng chọn loại giao dịch.")
    private CategoryType type;

    @NotNull(message = "Vui lòng nhập số tiền.")
    @DecimalMin(value = "0.00", inclusive = false, message = "Số tiền phải lớn hơn 0.")
    @Digits(integer = 16, fraction = 2, message = "Số tiền không hợp lệ.")
    private BigDecimal amount;

    @NotNull(message = "Vui lòng chọn danh mục.")
    @Positive(message = "Danh mục không hợp lệ.")
    private Long categoryId;

    @NotNull(message = "Vui lòng chọn ngày giao dịch.")
    private LocalDate transactionDate;

    @NotBlank(message = "Vui lòng nhập nội dung giao dịch.")
    @Size(max = 100, message = "Nội dung giao dịch tối đa 100 ký tự.")
    private String title;

    @Size(max = 255, message = "Ghi chú không được vượt quá 255 ký tự.")
    private String note;
}
