package com.finance.personalfinance.dashboard.domain.repository;

import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.transaction.domain.model.Transaction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DashboardRepository extends org.springframework.data.repository.Repository<Transaction, Long> {

    @Query("""
            select coalesce(sum(case when t.type = :incomeType then t.amount else 0 end), 0) as income,
                   coalesce(sum(case when t.type = :expenseType then t.amount else 0 end), 0) as expense,
                   count(t.id) as transactionCount
            from Transaction t
            where t.userId = :userId
              and t.transactionDate >= :startDate
              and t.transactionDate < :endDate
            """)
    DashboardTotalsProjection summarizeMonth(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("incomeType") CategoryType incomeType,
            @Param("expenseType") CategoryType expenseType
    );

    @Query("""
            select c.id as categoryId,
                   c.name as categoryName,
                   c.iconKey as iconKey,
                   c.color as color,
                   sum(t.amount) as amount
            from Transaction t
            join t.category c
            where t.userId = :userId
              and t.type = :type
              and t.transactionDate >= :startDate
              and t.transactionDate < :endDate
            group by c.id, c.name, c.iconKey, c.color
            order by sum(t.amount) desc, c.name asc
            """)
    List<DashboardCategoryProjection> summarizeExpensesByCategory(
            @Param("userId") Long userId,
            @Param("type") CategoryType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
            select t.transactionDate as transactionDate, sum(t.amount) as amount
            from Transaction t
            where t.userId = :userId
              and t.type = :type
              and t.transactionDate >= :startDate
              and t.transactionDate < :endDate
            group by t.transactionDate
            order by t.transactionDate asc
            """)
    List<DashboardDailyExpenseProjection> summarizeExpensesByDay(
            @Param("userId") Long userId,
            @Param("type") CategoryType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
            select coalesce(sum(t.amount), 0)
            from Transaction t
            where t.userId = :userId
              and t.type = :type
              and t.transactionDate >= :startDate
              and t.transactionDate < :endDate
            """)
    BigDecimal sumByTypeAndDateRange(
            @Param("userId") Long userId,
            @Param("type") CategoryType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @EntityGraph(attributePaths = "category")
    List<Transaction> findTop8ByUserIdAndTransactionDateGreaterThanEqualAndTransactionDateLessThanOrderByTransactionDateDescIdDesc(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    );
}
