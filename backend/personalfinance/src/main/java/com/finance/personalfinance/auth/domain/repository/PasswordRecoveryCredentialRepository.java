package com.finance.personalfinance.auth.domain.repository;

import com.finance.personalfinance.auth.domain.model.PasswordRecoveryCredential;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordRecoveryCredentialRepository extends JpaRepository<PasswordRecoveryCredential, Long> {

    Optional<PasswordRecoveryCredential> findByUserId(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select credential from PasswordRecoveryCredential credential where credential.userId = :userId")
    Optional<PasswordRecoveryCredential> findByUserIdForUpdate(@Param("userId") Long userId);

    @Modifying
    void deleteByUserId(Long userId);
}
