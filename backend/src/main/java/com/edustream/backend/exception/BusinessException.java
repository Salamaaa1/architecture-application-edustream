package com.edustream.backend.exception;

public class BusinessException extends RuntimeException {
    private final String code;
    private final int statusCode;

    public BusinessException(String message, String code, int statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }

    public String getCode() { return code; }
    public int getStatusCode() { return statusCode; }
}
