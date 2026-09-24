package com.finance.personalfinance.auth.domain.model;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordRecoveryCredentialTest {

    @Test
    void credentialCanBeUsedOnlyBeforeExpiryAndBeforeConsumption() throws ReflectiveOperationException {
        Class<?> credentialType = Class.forName(
                "com.finance.personalfinance.auth.domain.model.PasswordRecoveryCredential");
        Object credential = credentialType.getConstructor(Long.class, String.class, Instant.class)
                .newInstance(1L, "encoded-secret", Instant.now().plusSeconds(60));
        Method isUsable = credentialType.getMethod("isUsable");
        Method consume = credentialType.getMethod("consume");

        assertTrue((boolean) isUsable.invoke(credential));
        consume.invoke(credential);
        assertFalse((boolean) isUsable.invoke(credential));
    }

    @Test
    void expiredCredentialCannotBeUsed() throws ReflectiveOperationException {
        Class<?> credentialType = Class.forName(
                "com.finance.personalfinance.auth.domain.model.PasswordRecoveryCredential");
        Object credential = credentialType.getConstructor(Long.class, String.class, Instant.class)
                .newInstance(1L, "encoded-secret", Instant.now().minusSeconds(1));

        assertFalse((boolean) credentialType.getMethod("isUsable").invoke(credential));
    }
}
