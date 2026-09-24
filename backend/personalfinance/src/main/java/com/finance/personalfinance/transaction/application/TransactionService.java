package com.finance.personalfinance.transaction.application;

import com.finance.personalfinance.category.domain.model.Category;
import com.finance.personalfinance.category.domain.model.CategoryType;
import com.finance.personalfinance.category.domain.repository.CategoryRepository;
import com.finance.personalfinance.common.exception.AppException;
import com.finance.personalfinance.transaction.api.TransactionPageResponse;
import com.finance.personalfinance.transaction.api.TransactionRequest;
import com.finance.personalfinance.transaction.api.TransactionResponse;
import com.finance.personalfinance.transaction.api.TransactionTotalsResponse;
import com.finance.personalfinance.transaction.domain.model.Transaction;
import com.finance.personalfinance.transaction.domain.repository.TransactionFilter;
import com.finance.personalfinance.transaction.domain.repository.TransactionRepository;
import com.finance.personalfinance.transaction.domain.repository.TransactionTotalsProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final int MAX_SEARCH_LENGTH = 100;

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public TransactionPageResponse findAll(
            Long userId,
            CategoryType type,
            Long categoryId,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            String rawSearch,
            int page,
            int size
    ) {
        validateFilters(startDate, endDate, minAmount, maxAmount, page, size);
        if (categoryId != null && categoryId <= 0) {
            throw badRequest("INVALID_CATEGORY_ID", "Danh mục không hợp lệ.");
        }
        String search = normalizeSearch(rawSearch);
        Long searchId = parseSearchId(search);

        var pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by(Sort.Direction.DESC, "transactionDate")
                        .and(Sort.by(Sort.Direction.DESC, "id"))
        );
        TransactionFilter filter = new TransactionFilter(
                userId, type, categoryId, startDate, endDate, minAmount, maxAmount, search, searchId
        );
        Page<Transaction> result = transactionRepository.findFiltered(filter, pageable);
        TransactionTotalsProjection totals = transactionRepository.summarizeFiltered(filter);

        return TransactionPageResponse.builder()
                .items(result.getContent().stream().map(TransactionResponse::from).toList())
                .page(page)
                .size(size)
                .totalItems(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .totals(TransactionTotalsResponse.of(totals.getIncome(), totals.getExpense()))
                .build();
    }

    @Transactional(readOnly = true)
    public TransactionResponse findOne(Long userId, Long transactionId) {
        return TransactionResponse.from(findOwnedTransaction(userId, transactionId));
    }

    @Transactional
    public TransactionResponse create(Long userId, TransactionRequest request) {
        Category category = findOwnedCategory(userId, request.getCategoryId());
        validateCategory(category, request.getType(), true);
        Transaction transaction = new Transaction(
                userId,
                category,
                request.getType(),
                request.getAmount(),
                request.getTitle(),
                request.getTransactionDate(),
                request.getNote()
        );
        return TransactionResponse.from(transactionRepository.saveAndFlush(transaction));
    }

    @Transactional
    public TransactionResponse update(Long userId, Long transactionId, TransactionRequest request) {
        Transaction transaction = findOwnedTransaction(userId, transactionId);
        Category category = findOwnedCategory(userId, request.getCategoryId());
        boolean keepingExistingCategory = category.getId().equals(transaction.getCategory().getId());
        validateCategory(category, request.getType(), !keepingExistingCategory);
        transaction.update(
                category,
                request.getType(),
                request.getAmount(),
                request.getTitle(),
                request.getTransactionDate(),
                request.getNote()
        );
        return TransactionResponse.from(transactionRepository.saveAndFlush(transaction));
    }

    @Transactional
    public void delete(Long userId, Long transactionId) {
        transactionRepository.delete(findOwnedTransaction(userId, transactionId));
    }

    private void validateFilters(
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            int page,
            int size
    ) {
        if (page < 1) {
            throw badRequest("INVALID_PAGE", "Số trang phải lớn hơn hoặc bằng 1.");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw badRequest("INVALID_PAGE_SIZE", "Số mục mỗi trang phải từ 1 đến 100.");
        }
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw badRequest("INVALID_DATE_RANGE", "Ngày bắt đầu không được sau ngày kết thúc.");
        }
        if ((minAmount != null && minAmount.signum() < 0)
                || (maxAmount != null && maxAmount.signum() < 0)) {
            throw badRequest("INVALID_AMOUNT_RANGE", "Giá trị lọc số tiền không được âm.");
        }
        if (minAmount != null && maxAmount != null && minAmount.compareTo(maxAmount) > 0) {
            throw badRequest("INVALID_AMOUNT_RANGE", "Số tiền tối thiểu không được lớn hơn số tiền tối đa.");
        }
    }

    private String normalizeSearch(String rawSearch) {
        if (rawSearch == null || rawSearch.isBlank()) return null;
        String search = rawSearch.trim();
        if (search.length() > MAX_SEARCH_LENGTH) {
            throw badRequest("SEARCH_TOO_LONG", "Từ khóa tìm kiếm tối đa 100 ký tự.");
        }
        return search;
    }

    private Long parseSearchId(String search) {
        if (search == null || !search.matches("\\d{1,19}")) return null;
        try {
            return Long.valueOf(search);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private void validateCategory(Category category, CategoryType type, boolean requireActive) {
        if (requireActive && !category.isActive()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CATEGORY_INACTIVE", "Danh mục đã bị vô hiệu hóa.");
        }
        if (category.getType() != type) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CATEGORY_TYPE_MISMATCH",
                    "Loại giao dịch không khớp với loại danh mục.");
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

    private Transaction findOwnedTransaction(Long userId, Long transactionId) {
        return transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "TRANSACTION_NOT_FOUND",
                        "Không tìm thấy giao dịch."
                ));
    }

    private AppException badRequest(String code, String message) {
        return new AppException(HttpStatus.BAD_REQUEST, code, message);
    }
}
