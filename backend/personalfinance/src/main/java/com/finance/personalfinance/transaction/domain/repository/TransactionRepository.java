package com.finance.personalfinance.transaction.domain.repository;

import com.finance.personalfinance.transaction.domain.model.Transaction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, TransactionSearchRepository {

    @EntityGraph(attributePaths = "category")
    Optional<Transaction> findByIdAndUserId(Long id, Long userId);

    @EntityGraph(attributePaths = "category")
    List<Transaction> findAllByUserIdOrderByTransactionDateDescIdDesc(Long userId);

    long countByCategory_IdAndUserId(Long categoryId, Long userId);

    boolean existsByCategory_IdAndUserId(Long categoryId, Long userId);

    @Query("""
            select t.category.id as categoryId, count(t.id) as transactionCount
            from Transaction t
            where t.userId = :userId
            group by t.category.id
            """)
    List<CategoryTransactionCount> countByCategoryForUser(@Param("userId") Long userId);
}
