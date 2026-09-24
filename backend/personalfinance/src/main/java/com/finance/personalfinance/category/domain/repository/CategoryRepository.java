package com.finance.personalfinance.category.domain.repository;

import com.finance.personalfinance.category.domain.model.Category;
import com.finance.personalfinance.category.domain.model.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByUserIdOrderByTypeAscNameAsc(Long userId);

    List<Category> findAllByUserIdOrderByTypeAscNameAscIdAsc(Long userId);

    Optional<Category> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndTypeAndNameIgnoreCase(Long userId, CategoryType type, String name);

    boolean existsByUserIdAndTypeAndNameIgnoreCaseAndIdNot(
            Long userId,
            CategoryType type,
            String name,
            Long id
    );

    boolean existsByUserId(Long userId);
}
