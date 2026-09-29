package com.edustream.backend.service;

import com.edustream.backend.dto.CardDataDTO;
import com.edustream.backend.exception.InvalidCardException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CardValidatorTest {

    @Test
    @DisplayName("Should pass valid card data")
    void testValidCardData() {
        CardDataDTO validCard = new CardDataDTO("4532 1111 2222 3333", 12, 2028, "123", "Jean Dupont");
        assertDoesNotThrow(() -> CardValidator.validateCardData(validCard));
    }

    @Test
    @DisplayName("Should throw exception when card data is null")
    void testNullCardData() {
        InvalidCardException ex = assertThrows(InvalidCardException.class, () -> CardValidator.validateCardData(null));
        assertTrue(ex.getMessage().contains("requises"));
    }

    @Test
    @DisplayName("Should throw exception when card number is not 16 digits")
    void testInvalidCardNumberLength() {
        CardDataDTO invalidCard = new CardDataDTO("12345", 12, 2028, "123", "Jean Dupont");
        InvalidCardException ex = assertThrows(InvalidCardException.class, () -> CardValidator.validateCardData(invalidCard));
        assertTrue(ex.getMessage().contains("16 chiffres"));
    }

    @Test
    @DisplayName("Should throw exception when expiry month is out of bounds")
    void testInvalidExpiryMonth() {
        CardDataDTO invalidCard = new CardDataDTO("4532111122223333", 14, 2028, "123", "Jean Dupont");
        assertThrows(InvalidCardException.class, () -> CardValidator.validateCardData(invalidCard));
    }

    @Test
    @DisplayName("Should throw exception when CVV is invalid")
    void testInvalidCvv() {
        CardDataDTO invalidCard = new CardDataDTO("4532111122223333", 12, 2028, "12", "Jean Dupont");
        assertThrows(InvalidCardException.class, () -> CardValidator.validateCardData(invalidCard));
    }

    @Test
    @DisplayName("Should mask card number correctly")
    void testMaskCardNumber() {
        assertEquals("3333", CardValidator.maskCardNumber("4532 1111 2222 3333"));
        assertEquals("3333", CardValidator.maskCardNumber("3333"));
    }
}
