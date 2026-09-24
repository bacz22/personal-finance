package com.finance.personalfinance.auth.domain.repository;

import com.finance.personalfinance.auth.domain.model.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {

    Optional<AuthSession> findByIdAndUserId(Long id, Long userId);

    List<AuthSession> findAllByUserId(Long userId);
}
