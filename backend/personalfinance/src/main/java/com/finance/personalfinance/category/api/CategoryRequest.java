package com.finance.personalfinance.category.api;

import com.finance.personalfinance.category.domain.model.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CategoryRequest {

    @NotBlank(message = "Vui lòng nhập tên danh mục.")
    @Size(max = 50, message = "Tên danh mục không được vượt quá 50 ký tự.")
    private String name;

    @NotNull(message = "Vui lòng chọn loại danh mục.")
    private CategoryType type;

    @NotBlank(message = "Vui lòng chọn biểu tượng danh mục.")
    @Size(max = 50, message = "Biểu tượng không hợp lệ.")
    @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*", message = "Biểu tượng không hợp lệ.")
    private String iconKey;

    @NotBlank(message = "Vui lòng chọn màu danh mục.")
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Màu phải có định dạng #RRGGBB.")
    private String color;

    @Size(max = 100, message = "Mô tả không được vượt quá 100 ký tự.")
    private String description;

    @NotNull(message = "Vui lòng chọn trạng thái danh mục.")
    private Boolean active;
}
