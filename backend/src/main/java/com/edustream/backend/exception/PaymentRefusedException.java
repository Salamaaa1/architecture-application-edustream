package com.edustream.backend.exception;

public class PaymentRefusedException extends BusinessException {
    public PaymentRefusedException(String reason) {
        super("Paiement refusé : " + reason, "PAYMENT_REFUSED", 402);
    }
}
