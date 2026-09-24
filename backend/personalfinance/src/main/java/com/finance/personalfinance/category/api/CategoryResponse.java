package com.finance.personalfinance.category.api;

import com.finance.personalfinance.category.domain.model.Category;
import com.finance.personalfinance.category.domain.model.CategoryType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CategoryResponse {

    private Long id;
    private String name;
    private CategoryType type;
    private String iconKey;
    private String color;
    private String description;
    private boolean active;
    private long transactionCount;

    public static CategoryResponse from(Category category) {
        return from(category, 0);
    }

    public static CategoryResponse from(Category category, long transactionCount) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .iconKey(category.getIconKey())
                .color(category.getColor())
                .description(category.getDescription())
                .active(category.isActive())
                .transactionCount(transactionCount)
                .build();
    }
}
