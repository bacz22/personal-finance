package com.finance.personalfinance.reports.domain.repository;

import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.transaction.domain.model.Transaction;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MonthlyComparisonRepository extends org.springframework.data.repository.Repository<Transaction, Long> {

    @Query("""
            select c.id as categoryId,
                   c.name as categoryName,
                   c.iconKey as categoryIconKey,
                   c.color as categoryColor,
                   sum(case when t.transactionDate >= :monthAStart and t.transactionDate < :monthAEnd
                            then t.amount else 0 end) as monthAAmount,
                   sum(case when t.transactionDate >= :monthBStart and t.transactionDate < :monthBEnd
                            then t.amount else 0 end) as monthBAmount
            from Transaction t
            join t.category c
            where t.userId = :userId
              and t.type = :expenseType
              and ((t.transactionDate >= :monthAStart and t.transactionDate < :monthAEnd)
                   or (t.transactionDate >= :monthBStart and t.transactionDate < :monthBEnd))
            group by c.id, c.name, c.iconKey, c.color
            """)
    List<MonthlyComparisonCategoryProjection> summarizeExpensesByCategory(
            @Param("userId") Long userId,
            @Param("expenseType") CategoryType expenseType,
            @Param("monthAStart") LocalDate monthAStart,
            @Param("monthAEnd") LocalDate monthAEnd,
            @Param("monthBStart") LocalDate monthBStart,
            @Param("monthBEnd") LocalDate monthBEnd
    );
}
