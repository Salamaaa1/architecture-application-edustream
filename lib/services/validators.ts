import { InvalidCardException } from '@/lib/exceptions'
import { CardData } from '@/lib/types'

export class CardValidator {
  private static readonly CURRENT_YEAR = new Date().getFullYear()

  static validateCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '')
    if (digits.length < 13 || digits.length > 19) return false

    let sum = 0
    let isEven = false
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10)
      if (isEven) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      sum += digit
      isEven = !isEven
    }
    return sum % 10 === 0
  }

  static validateExpiry(expiryMonth: number, expiryYear: number): boolean {
    if (expiryMonth < 1 || expiryMonth > 12) return false
    if (expiryYear < this.CURRENT_YEAR) return false
    if (expiryYear === this.CURRENT_YEAR && expiryMonth < new Date().getMonth() + 1) {
      return false
    }
    if (expiryYear > this.CURRENT_YEAR + 20) return false
    return true
  }

  static validateCVV(cvv: string): boolean {
    const cvvDigits = cvv.replace(/\D/g, '')
    return cvvDigits.length === 3 || cvvDigits.length === 4
  }

  static validateCardholderName(name: string): boolean {
    return name.trim().length >= 3 && name.trim().length <= 50
  }

  static validateCardData(cardData: CardData): void {
    if (!this.validateCardNumber(cardData.cardNumber)) {
      throw new InvalidCardException('Numéro de carte invalide')
    }
    if (!this.validateExpiry(cardData.expiryMonth, cardData.expiryYear)) {
      throw new InvalidCardException('Date d\'expiration invalide')
    }
    if (!this.validateCVV(cardData.cvv)) {
      throw new InvalidCardException('CVV invalide')
    }
    if (!this.validateCardholderName(cardData.cardholderName)) {
      throw new InvalidCardException('Nom du titulaire invalide')
    }
  }

  static getCardType(cardNumber: string): string {
    const digits = cardNumber.replace(/\D/g, '')
    if (/^4/.test(digits)) return 'VISA'
    if (/^5[1-5]/.test(digits)) return 'MASTERCARD'
    if (/^3[47]/.test(digits)) return 'AMEX'
    return 'UNKNOWN'
  }

  static maskCardNumber(cardNumber: string): string {
    const digits = cardNumber.replace(/\D/g, '')
    return `****-****-****-${digits.slice(-4)}`
  }
}
