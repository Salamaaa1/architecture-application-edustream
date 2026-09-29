package com.edustream.backend.exception;

public class EmailAlreadyExistsException extends BusinessException {
    public EmailAlreadyExistsException(String email) {
        super("L'email " + email + " est déjà utilisé", "EMAIL_EXISTS", 409);
    }
}
