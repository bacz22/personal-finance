package com.finance.personalfinance.auth.application;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordRecoveryRateLimiterTest {

    @Test
    void allowsOnlyOneRecoveryRequestPerEmailWithinTenMinutes() throws ReflectiveOperationException {
        Class<?> limiterType = Class.forName(
                "com.finance.personalfinance.auth.application.PasswordRecoveryRateLimiter");
        Object limiter = limiterType.getConstructor().newInstance();
        Method allow = limiterType.getMethod("allow", String.class, String.class);

        assertTrue((boolean) allow.invoke(limiter, "person@example.com", "192.0.2.10"));
        assertFalse((boolean) allow.invoke(limiter, "person@example.com", "192.0.2.11"));
    }

    @Test
    void allowsAtMostTenRecoveryRequestsPerIpWithinOneHour() throws ReflectiveOperationException {
        Class<?> limiterType = Class.forName(
                "com.finance.personalfinance.auth.application.PasswordRecoveryRateLimiter");
        Object limiter = limiterType.getConstructor().newInstance();
        Method allow = limiterType.getMethod("allow", String.class, String.class);

        for (int index = 0; index < 10; index++) {
            assertTrue((boolean) allow.invoke(limiter, "person" + index + "@example.com", "192.0.2.10"));
        }
        assertFalse((boolean) allow.invoke(limiter, "person11@example.com", "192.0.2.10"));
    }

    @Test
    void refundedFailedDeliveryCanBeRetried() throws ReflectiveOperationException {
        Class<?> limiterType = Class.forName(
                "com.finance.personalfinance.auth.application.PasswordRecoveryRateLimiter");
        Object limiter = limiterType.getConstructor().newInstance();
        Method allow = limiterType.getMethod("allow", String.class, String.class);
        Method refund = limiterType.getMethod("refund", String.class, String.class);

        assertTrue((boolean) allow.invoke(limiter, "person@example.com", "192.0.2.10"));
        refund.invoke(limiter, "person@example.com", "192.0.2.10");
        assertTrue((boolean) allow.invoke(limiter, "person@example.com", "192.0.2.10"));
    }
}
