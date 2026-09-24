package com.finance.personalfinance.category.application;

import com.finance.personalfinance.category.domain.model.Category;
import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.category.domain.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DefaultCategorySeeder {

    private final CategoryRepository categoryRepository;

    @Transactional
    public void seedForUser(Long userId) {
        if (categoryRepository.existsByUserId(userId)) return;

        categoryRepository.saveAll(List.of(
                category(userId, "Ăn uống", CategoryType.EXPENSE, "utensils", "#F97316"),
                category(userId, "Đi lại", CategoryType.EXPENSE, "car", "#06B6D4"),
                category(userId, "Nhà ở", CategoryType.EXPENSE, "home", "#3B82F6"),
                category(userId, "Hóa đơn", CategoryType.EXPENSE, "receipt", "#EAB308"),
                category(userId, "Mua sắm", CategoryType.EXPENSE, "shopping-bag", "#EC4899"),
                category(userId, "Giải trí", CategoryType.EXPENSE, "film", "#8B5CF6"),
                category(userId, "Sức khỏe", CategoryType.EXPENSE, "heart-pulse", "#EF4444"),
                category(userId, "Giáo dục", CategoryType.EXPENSE, "graduation-cap", "#6366F1"),
                category(userId, "Quà tặng", CategoryType.EXPENSE, "gift", "#F43F5E"),
                category(userId, "Du lịch", CategoryType.EXPENSE, "plane", "#14B8A6"),
                category(userId, "Khác", CategoryType.EXPENSE, "more-horizontal", "#64748B"),
                category(userId, "Lương", CategoryType.INCOME, "briefcase", "#10B981"),
                category(userId, "Thưởng", CategoryType.INCOME, "award", "#EAB308"),
                category(userId, "Freelance", CategoryType.INCOME, "laptop", "#6366F1"),
                category(userId, "Kinh doanh", CategoryType.INCOME, "wallet", "#3B82F6"),
                category(userId, "Lãi/đầu tư", CategoryType.INCOME, "coins", "#8B5CF6"),
                category(userId, "Hoàn tiền", CategoryType.INCOME, "sparkles", "#06B6D4"),
                category(userId, "Khác", CategoryType.INCOME, "more-horizontal", "#64748B")
        ));
    }

    private static Category category(
            Long userId,
            String name,
            CategoryType type,
            String iconKey,
            String color
    ) {
        return new Category(userId, name, type, iconKey, color, null, true);
    }
}
