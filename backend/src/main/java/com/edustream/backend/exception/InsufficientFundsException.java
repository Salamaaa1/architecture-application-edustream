package com.edustream.backend.exception;

public class InsufficientFundsException extends BusinessException {
    public InsufficientFundsException() {
        super("Fonds insuffisants", "INSUFFICIENT_FUNDS", 402);
    }
}
