package com.edustream.backend.service;

import com.edustream.backend.dto.CardDataDTO;
import com.edustream.backend.exception.InsufficientFundsException;
import com.edustream.backend.exception.PaymentRefusedException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class MockPaymentGateway implements PaymentGateway {

    private double rejectionRate = 0.0; // 0 by default for predictable testing, can set via field or constructor

    public MockPaymentGateway() {}

    public MockPaymentGateway(double rejectionRate) {
        this.rejectionRate = rejectionRate;
    }

    @Override
    public String processPayment(double amount, CardDataDTO cardData) {
        CardValidator.validateCardData(cardData);

        String cardNumber = cardData.getCardNumber().replaceAll("\\D", "");
        if (cardNumber.endsWith("0000")) {
            throw new InsufficientFundsException();
        }

        if (cardNumber.endsWith("4111111111111111") || cardNumber.endsWith("9999")) {
            throw new PaymentRefusedException("Carte bloquée ou refusée par la banque");
        }

        if (rejectionRate > 0 && Math.random() < rejectionRate) {
            throw new PaymentRefusedException("Transaction refusée aléatoirement par la banque");
        }

        return "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
