package com.edustream.backend.service;

import com.edustream.backend.dto.CardDataDTO;
import com.edustream.backend.exception.InsufficientFundsException;
import com.edustream.backend.exception.InvalidCardException;
import com.edustream.backend.exception.PaymentRefusedException;
import com.edustream.backend.model.Payment;
import com.edustream.backend.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private PaymentService paymentService;

    private CardDataDTO validCard;

    @BeforeEach
    void setUp() {
        validCard = new CardDataDTO("4532 1111 2222 3333", 10, 2027, "456", "Karim Bennani");
    }

    @Test
    @DisplayName("Should process payment successfully and save completed payment")
    void testProcessPaymentSuccess() {
        when(paymentGateway.processPayment(1490.0, validCard)).thenReturn("TXN-SUCCESS-123");
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));

        Payment payment = paymentService.processPayment("enr-1", "std-1", "react", 1490.0, validCard);

        assertNotNull(payment);
        assertEquals("completed", payment.getStatus());
        assertEquals("TXN-SUCCESS-123", payment.getTransactionId());
        assertEquals("3333", payment.getCardLast4());
        assertEquals(1490.0, payment.getAmount());
        verify(paymentRepository, times(1)).save(any(Payment.class));
    }

    @Test
    @DisplayName("Should save failed payment record when payment gateway throws InsufficientFundsException")
    void testProcessPaymentInsufficientFunds() {
        when(paymentGateway.processPayment(1490.0, validCard)).thenThrow(new InsufficientFundsException());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));

        assertThrows(InsufficientFundsException.class, () ->
                paymentService.processPayment("enr-1", "std-1", "react", 1490.0, validCard)
        );

        verify(paymentRepository, times(1)).save(argThat(p ->
                "failed".equals(p.getStatus()) && p.getTransactionId().startsWith("FAILED-")
        ));
    }

    @Test
    @DisplayName("Should throw InvalidCardException when card data fails validation")
    void testProcessPaymentInvalidCard() {
        CardDataDTO badCard = new CardDataDTO("123", 10, 2027, "456", "Karim Bennani");

        assertThrows(InvalidCardException.class, () ->
                paymentService.processPayment("enr-1", "std-1", "react", 1490.0, badCard)
        );

        verify(paymentGateway, never()).processPayment(anyDouble(), any());
    }
}
