package com.edustream.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CardDataDTO {
    @NotBlank(message = "Card number is required")
    private String cardNumber;

    @NotNull(message = "Expiry month is required")
    private Integer expiryMonth;

    @NotNull(message = "Expiry year is required")
    private Integer expiryYear;

    @NotBlank(message = "CVV is required")
    private String cvv;

    @NotBlank(message = "Cardholder name is required")
    private String cardholderName;

    public CardDataDTO() {}

    public CardDataDTO(String cardNumber, Integer expiryMonth, Integer expiryYear, String cvv, String cardholderName) {
        this.cardNumber = cardNumber;
        this.expiryMonth = expiryMonth;
        this.expiryYear = expiryYear;
        this.cvv = cvv;
        this.cardholderName = cardholderName;
    }

    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }

    public Integer getExpiryMonth() { return expiryMonth; }
    public void setExpiryMonth(Integer expiryMonth) { this.expiryMonth = expiryMonth; }

    public Integer getExpiryYear() { return expiryYear; }
    public void setExpiryYear(Integer expiryYear) { this.expiryYear = expiryYear; }

    public String getCvv() { return cvv; }
    public void setCvv(String cvv) { this.cvv = cvv; }

    public String getCardholderName() { return cardholderName; }
    public void setCardholderName(String cardholderName) { this.cardholderName = cardholderName; }
}
