package com.finance.personalfinance.offline.application;

import com.finance.personalfinance.budget.domain.model.Budget;
import com.finance.personalfinance.budget.domain.repository.BudgetRepository;
import com.finance.personalfinance.category.domain.model.Category;
import com.finance.personalfinance.category.domain.repository.CategoryRepository;
import com.finance.personalfinance.offline.api.OfflineSnapshotResponse;
import com.finance.personalfinance.transaction.domain.model.Transaction;
import com.finance.personalfinance.transaction.domain.repository.TransactionRepository;
import com.finance.personalfinance.user.domain.model.User;
import com.finance.personalfinance.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import com.finance.personalfinance.common.exception.AppException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OfflineSnapshotService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public OfflineSnapshotResponse getSnapshot(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> notFound("USER_NOT_FOUND"));
        List<Category> categories = categoryRepository.findAllByUserIdOrderByTypeAscNameAscIdAsc(userId);
        List<Transaction> transactions = transactionRepository.findAllByUserIdOrderByTransactionDateDescIdDesc(userId);
        List<Budget> budgets = budgetRepository.findAllByUserIdOrderByMonthDescCategory_NameAsc(userId);

        Map<Long, Long> transactionCounts = transactions.stream()
                .collect(Collectors.groupingBy(row -> row.getCategory().getId(), Collectors.counting()));
        Map<String, BigDecimal> monthlyExpense = new HashMap<>();
        transactions.stream()
                .filter(row -> row.getType().name().equals("EXPENSE"))
                .forEach(row -> monthlyExpense.merge(
                        row.getCategory().getId() + ":" + YearMonth.from(row.getTransactionDate()),
                        row.getAmount(),
                        BigDecimal::add
                ));

        return new OfflineSnapshotResponse(
                Instant.now(),
                new OfflineSnapshotResponse.OfflineUser(
                        user.getId().toString(), user.getFullName(), user.getEmail(),
                        user.getCurrency()
                ),
                categories.stream().map(category -> toCategory(
                        category, transactionCounts.getOrDefault(category.getId(), 0L)
                )).toList(),
                transactions.stream().map(this::toTransaction).toList(),
                budgets.stream().map(budget -> toBudget(
                        budget,
                        monthlyExpense.getOrDefault(
                                budget.getCategory().getId() + ":" + YearMonth.from(budget.getMonth()), ZERO
                        )
                )).toList()
        );
    }

    @Transactional(readOnly = true)
    public OfflineSnapshotResponse.OfflineCategory getCategory(Long userId, Long id) {
        Category category = categoryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> notFound("CATEGORY_NOT_FOUND"));
        return toCategory(category, transactionRepository.countByCategory_IdAndUserId(id, userId));
    }

    @Transactional(readOnly = true)
    public OfflineSnapshotResponse.OfflineTransaction getTransaction(Long userId, Long id) {
        Transaction transaction = transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> notFound("TRANSACTION_NOT_FOUND"));
        return toTransaction(transaction);
    }

    @Transactional(readOnly = true)
    public OfflineSnapshotResponse.OfflineBudget getBudget(Long userId, Long id) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> notFound("BUDGET_NOT_FOUND"));
        BigDecimal spent = transactionRepository.findAllByUserIdOrderByTransactionDateDescIdDesc(userId).stream()
                .filter(row -> row.getCategory().getId().equals(budget.getCategory().getId()))
                .filter(row -> row.getType().name().equals("EXPENSE"))
                .filter(row -> YearMonth.from(row.getTransactionDate()).equals(YearMonth.from(budget.getMonth())))
                .map(Transaction::getAmount)
                .reduce(ZERO, BigDecimal::add);
        return toBudget(budget, spent);
    }

    private OfflineSnapshotResponse.OfflineCategory toCategory(Category category, long count) {
        return new OfflineSnapshotResponse.OfflineCategory(
                category.getId().toString(), category.getName(), category.getType().name(),
                category.getIconKey(), category.getColor(), category.getDescription(),
                category.isActive(), count, category.getVersion()
        );
    }

    private OfflineSnapshotResponse.OfflineTransaction toTransaction(Transaction transaction) {
        return new OfflineSnapshotResponse.OfflineTransaction(
                transaction.getId().toString(), transaction.getType().name(), transaction.getAmount().toPlainString(),
                transaction.getCategory().getId().toString(), transaction.getCategory().getName(),
                transaction.getCategory().getIconKey(), transaction.getCategory().getColor(),
                transaction.getTransactionDate().toString(), transaction.getTitle(), transaction.getNote(),
                transaction.getCreatedAt(), transaction.getUpdatedAt(), transaction.getVersion()
        );
    }

    private OfflineSnapshotResponse.OfflineBudget toBudget(Budget budget, BigDecimal spent) {
        return new OfflineSnapshotResponse.OfflineBudget(
                budget.getId().toString(), YearMonth.from(budget.getMonth()).toString(),
                budget.getCategory().getId().toString(), budget.getCategory().getName(),
                budget.getCategory().getIconKey(), budget.getCategory().getColor(),
                budget.getLimitAmount().toPlainString(), spent.toPlainString(), budget.getVersion()
        );
    }

    private AppException notFound(String code) {
        return new AppException(HttpStatus.NOT_FOUND, code, "Không tìm thấy dữ liệu.");
    }
}
