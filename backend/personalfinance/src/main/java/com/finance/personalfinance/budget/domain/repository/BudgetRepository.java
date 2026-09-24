package com.finance.personalfinance.budget.domain.repository;

import com.finance.personalfinance.budget.domain.model.Budget;
import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.transaction.domain.model.Transaction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    @EntityGraph(attributePaths = "category")
    List<Budget> findAllByUserIdAndMonthOrderByCategory_NameAsc(Long userId, LocalDate month);

    @EntityGraph(attributePaths = "category")
    List<Budget> findAllByUserIdOrderByMonthDescCategory_NameAsc(Long userId);

    @EntityGraph(attributePaths = "category")
    Optional<Budget> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndMonthAndCategory_Id(Long userId, LocalDate month, Long categoryId);

    boolean existsByUserIdAndMonthAndCategory_IdAndIdNot(
            Long userId, LocalDate month, Long categoryId, Long id
    );

    boolean existsByCategory_IdAndUserId(Long categoryId, Long userId);

    @Query("""
            select t.category.id as categoryId, sum(t.amount) as spent
            from Transaction t
            where t.userId = :userId
              and t.type = :type
              and t.transactionDate >= :startDate
              and t.transactionDate < :endDate
            group by t.category.id
            """)
    List<BudgetSpentProjection> summarizeSpentByCategory(
            @Param("userId") Long userId,
            @Param("type") CategoryType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
