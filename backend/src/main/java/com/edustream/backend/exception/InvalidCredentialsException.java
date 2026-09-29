package com.edustream.backend.exception;

public class InvalidCredentialsException extends BusinessException {
    public InvalidCredentialsException() {
        super("Email ou mot de passe invalide", "INVALID_CREDENTIALS", 401);
    }
}
