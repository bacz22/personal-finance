package com.finance.personalfinance.transaction.domain.repository;

import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.transaction.domain.model.Transaction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Selection;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Repository
@RequiredArgsConstructor
class TransactionSearchRepositoryImpl implements TransactionSearchRepository {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final EntityManager entityManager;

    @Override
    public Page<Transaction> findFiltered(TransactionFilter filter, Pageable pageable) {
        CriteriaBuilder builder = entityManager.getCriteriaBuilder();

        CriteriaQuery<Long> countQuery = builder.createQuery(Long.class);
        Root<Transaction> countRoot = countQuery.from(Transaction.class);
        countQuery.select(builder.count(countRoot))
                .where(predicates(builder, countRoot, filter).toArray(Predicate[]::new));
        long total = entityManager.createQuery(countQuery).getSingleResult();

        CriteriaQuery<Transaction> query = builder.createQuery(Transaction.class);
        Root<Transaction> root = query.from(Transaction.class);
        root.fetch("category", JoinType.INNER);
        query.select(root)
                .distinct(true)
                .where(predicates(builder, root, filter).toArray(Predicate[]::new))
                .orderBy(sortOrders(builder, root, pageable.getSort()));

        List<Transaction> items = entityManager.createQuery(query)
                .setFirstResult(Math.toIntExact(pageable.getOffset()))
                .setMaxResults(pageable.getPageSize())
                .getResultList();
        return new PageImpl<>(items, pageable, total);
    }

    @Override
    public TransactionTotalsProjection summarizeFiltered(TransactionFilter filter) {
        CriteriaBuilder builder = entityManager.getCriteriaBuilder();
        CriteriaQuery<Tuple> query = builder.createTupleQuery();
        Root<Transaction> root = query.from(Transaction.class);

        Selection<BigDecimal> income = builder.coalesce(
                builder.sum(builder.<BigDecimal>selectCase()
                        .when(builder.equal(root.get("type"), CategoryType.INCOME), root.<BigDecimal>get("amount"))
                        .otherwise(ZERO)),
                ZERO
        ).alias("income");
        Selection<BigDecimal> expense = builder.coalesce(
                builder.sum(builder.<BigDecimal>selectCase()
                        .when(builder.equal(root.get("type"), CategoryType.EXPENSE), root.<BigDecimal>get("amount"))
                        .otherwise(ZERO)),
                ZERO
        ).alias("expense");

        query.multiselect(income, expense)
                .where(predicates(builder, root, filter).toArray(Predicate[]::new));
        Tuple totals = entityManager.createQuery(query).getSingleResult();
        return new TransactionTotalsProjection() {
            @Override
            public BigDecimal getIncome() {
                return totals.get("income", BigDecimal.class);
            }

            @Override
            public BigDecimal getExpense() {
                return totals.get("expense", BigDecimal.class);
            }
        };
    }

    private List<Predicate> predicates(CriteriaBuilder builder, Root<Transaction> root, TransactionFilter filter) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(builder.equal(root.get("userId"), filter.userId()));

        if (filter.type() != null) {
            predicates.add(builder.equal(root.get("type"), filter.type()));
        }
        if (filter.categoryId() != null) {
            predicates.add(builder.equal(root.get("category").get("id"), filter.categoryId()));
        }
        if (filter.startDate() != null) {
            predicates.add(builder.greaterThanOrEqualTo(root.get("transactionDate"), filter.startDate()));
        }
        if (filter.endDate() != null) {
            predicates.add(builder.lessThanOrEqualTo(root.get("transactionDate"), filter.endDate()));
        }
        if (filter.minAmount() != null) {
            predicates.add(builder.greaterThanOrEqualTo(root.get("amount"), filter.minAmount()));
        }
        if (filter.maxAmount() != null) {
            predicates.add(builder.lessThanOrEqualTo(root.get("amount"), filter.maxAmount()));
        }
        if (filter.search() != null) {
            String pattern = "%" + escapeLike(filter.search().toLowerCase(Locale.ROOT)) + "%";
            Predicate textMatch = builder.or(
                    builder.like(builder.lower(root.get("title")), pattern, '\\'),
                    builder.like(builder.lower(builder.coalesce(root.get("note"), "")), pattern, '\\')
            );
            if (filter.searchId() != null) {
                textMatch = builder.or(textMatch, builder.equal(root.get("id"), filter.searchId()));
            }
            predicates.add(textMatch);
        }
        return predicates;
    }

    private List<jakarta.persistence.criteria.Order> sortOrders(
            CriteriaBuilder builder,
            Root<Transaction> root,
            Sort sort
    ) {
        List<jakarta.persistence.criteria.Order> orders = new ArrayList<>();
        sort.forEach(order -> {
            var expression = root.get(order.getProperty());
            orders.add(order.isAscending() ? builder.asc(expression) : builder.desc(expression));
        });
        return orders;
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
