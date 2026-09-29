package com.edustream.backend.service;

import com.edustream.backend.dto.CardDataDTO;
import com.edustream.backend.exception.InsufficientFundsException;
import com.edustream.backend.exception.PaymentRefusedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MockPaymentGatewayTest {

    private MockPaymentGateway gateway;

    @BeforeEach
    void setUp() {
        gateway = new MockPaymentGateway(0.0);
    }

    @Test
    @DisplayName("Should process payment and return transaction ID")
    void testProcessPaymentSuccess() {
        CardDataDTO card = new CardDataDTO("4532 1111 2222 3333", 12, 2028, "123", "Jean Dupont");
        String txn = gateway.processPayment(1490.0, card);

        assertNotNull(txn);
        assertTrue(txn.startsWith("TXN-"));
    }

    @Test
    @DisplayName("Should throw InsufficientFundsException when card ends with 0000")
    void testInsufficientFunds() {
        CardDataDTO card = new CardDataDTO("4532 1111 2222 0000", 12, 2028, "123", "Jean Dupont");
        assertThrows(InsufficientFundsException.class, () -> gateway.processPayment(1490.0, card));
    }

    @Test
    @DisplayName("Should throw PaymentRefusedException when card ends with 9999")
    void testPaymentRefused() {
        CardDataDTO card = new CardDataDTO("4532 1111 2222 9999", 12, 2028, "123", "Jean Dupont");
        assertThrows(PaymentRefusedException.class, () -> gateway.processPayment(1490.0, card));
    }

    @Test
    @DisplayName("Should throw PaymentRefusedException when random rejection rate triggers")
    void testRandomRejectionRate() {
        MockPaymentGateway rejectingGateway = new MockPaymentGateway(1.0); // 100% rejection rate
        CardDataDTO card = new CardDataDTO("4532 1111 2222 3333", 12, 2028, "123", "Jean Dupont");

        assertThrows(PaymentRefusedException.class, () -> rejectingGateway.processPayment(1490.0, card));
    }
}
