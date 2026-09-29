package com.edustream.backend.service;

import com.edustream.backend.dto.CardDataDTO;
import com.edustream.backend.exception.InvalidCardException;

public class CardValidator {

    public static void validateCardData(CardDataDTO cardData) {
        if (cardData == null) {
            throw new InvalidCardException("Données de carte requises");
        }

        String cardNumber = cardData.getCardNumber() != null ? cardData.getCardNumber().replaceAll("\\s+", "") : "";
        if (cardNumber.length() != 16 || !cardNumber.matches("\\d+")) {
            throw new InvalidCardException("Numéro de carte invalide (16 chiffres requis)");
        }

        if (cardData.getExpiryMonth() == null || cardData.getExpiryMonth() < 1 || cardData.getExpiryMonth() > 12) {
            throw new InvalidCardException("Mois d'expiration invalide");
        }

        if (cardData.getExpiryYear() == null || cardData.getExpiryYear() < 2024 || cardData.getExpiryYear() > 2040) {
            throw new InvalidCardException("Année d'expiration invalide");
        }

        if (cardData.getCvv() == null || cardData.getCvv().length() != 3 || !cardData.getCvv().matches("\\d+")) {
            throw new InvalidCardException("CVV invalide (3 chiffres requis)");
        }

        if (cardData.getCardholderName() == null || cardData.getCardholderName().trim().isEmpty()) {
            throw new InvalidCardException("Nom du titulaire requis");
        }
    }

    public static String maskCardNumber(String cardNumber) {
        if (cardNumber == null) return "****";
        String clean = cardNumber.replaceAll("\\s+", "");
        if (clean.length() < 4) return clean;
        return clean.substring(clean.length() - 4);
    }
}
