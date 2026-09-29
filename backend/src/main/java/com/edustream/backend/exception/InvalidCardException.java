package com.edustream.backend.exception;

public class InvalidCardException extends BusinessException {
    public InvalidCardException(String reason) {
        super("Carte invalide : " + reason, "INVALID_CARD", 400);
    }
}
