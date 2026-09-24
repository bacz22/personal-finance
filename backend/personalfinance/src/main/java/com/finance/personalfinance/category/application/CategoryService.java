package com.finance.personalfinance.category.application;

import com.finance.personalfinance.budget.domain.repository.BudgetRepository;
import com.finance.personalfinance.category.api.CategoryRequest;
import com.finance.personalfinance.category.api.CategoryResponse;
import com.finance.personalfinance.category.domain.model.Category;
import com.finance.personalfinance.category.domain.repository.CategoryRepository;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.transaction.domain.repository.CategoryTransactionCount;
import com.finance.personalfinance.transaction.domain.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll(Long userId) {
        var counts = transactionRepository.countByCategoryForUser(userId).stream()
                .collect(java.util.stream.Collectors.toMap(
                        CategoryTransactionCount::getCategoryId,
                        CategoryTransactionCount::getTransactionCount
                ));
        return categoryRepository.findAllByUserIdOrderByTypeAscNameAsc(userId)
                .stream()
                .map(category -> CategoryResponse.from(category, counts.getOrDefault(category.getId(), 0L)))
                .toList();
    }

    @Transactional
    public CategoryResponse create(Long userId, CategoryRequest request) {
        String name = request.getName().trim();
        ensureNameAvailable(userId, request, name, null);

        Category category = new Category(
                userId,
                name,
                request.getType(),
                request.getIconKey(),
                request.getColor(),
                request.getDescription(),
                request.getActive()
        );
        return CategoryResponse.from(categoryRepository.saveAndFlush(category));
    }

    @Transactional
    public CategoryResponse update(Long userId, Long categoryId, CategoryRequest request) {
        Category category = findOwnedCategory(userId, categoryId);
        String name = request.getName().trim();
        ensureNameAvailable(userId, request, name, categoryId);

        if (category.getType() != request.getType()
                && transactionRepository.existsByCategory_IdAndUserId(categoryId, userId)) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "CATEGORY_IN_USE",
                    "Không thể đổi loại danh mục đang được giao dịch sử dụng."
            );
        }

        if (category.getType() != request.getType()
                && budgetRepository.existsByCategory_IdAndUserId(categoryId, userId)) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "CATEGORY_HAS_BUDGET",
                    "Không thể đổi loại danh mục đang được ngân sách sử dụng."
            );
        }

        category.update(
                name,
                request.getType(),
                request.getIconKey(),
                request.getColor(),
                request.getDescription(),
                request.getActive()
        );
        categoryRepository.saveAndFlush(category);
        return CategoryResponse.from(
                category,
                transactionRepository.countByCategory_IdAndUserId(categoryId, userId)
        );
    }

    @Transactional
    public void deactivate(Long userId, Long categoryId) {
        Category category = findOwnedCategory(userId, categoryId);
        category.deactivate();
    }

    private void ensureNameAvailable(Long userId, CategoryRequest request, String name, Long excludedId) {
        boolean exists = excludedId == null
                ? categoryRepository.existsByUserIdAndTypeAndNameIgnoreCase(userId, request.getType(), name)
                : categoryRepository.existsByUserIdAndTypeAndNameIgnoreCaseAndIdNot(
                        userId,
                        request.getType(),
                        name,
                        excludedId
                );
        if (exists) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "CATEGORY_NAME_EXISTS",
                    "Tên danh mục đã tồn tại trong loại này."
            );
        }
    }

    private Category findOwnedCategory(Long userId, Long categoryId) {
        return categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "CATEGORY_NOT_FOUND",
                        "Không tìm thấy danh mục."
                ));
    }
}
