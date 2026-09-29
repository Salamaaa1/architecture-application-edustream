package com.edustream.backend.service;

import com.edustream.backend.dto.CardDataDTO;

public interface PaymentGateway {
    String processPayment(double amount, CardDataDTO cardData);
}
