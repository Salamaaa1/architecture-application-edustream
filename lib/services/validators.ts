import { InvalidCardException } from '@/lib/exceptions'
import type { CardData } from '@/lib/types'

const CARD_NUMBER_MIN_LENGTH = 13
const CARD_NUMBER_MAX_LENGTH = 19
const MAX_EXPIRY_YEARS_AHEAD = 20
const NAME_MIN_LENGTH = 3
const NAME_MAX_LENGTH = 50

export class CardValidator {
  /**
   * Retourne l'année courante à chaque appel (et non une seule fois au
   * chargement du module) afin que la validation reste correcte sur un
   * serveur longue durée et que les tests puissent figer la date.
   */
  private static currentYear(): number {
    return new Date().getFullYear()
  }

  /** Luhn + longueur 13-19. Seuls les espaces, tirets et points sont tolérés comme séparateurs. */
  static validateCardNumber(cardNumber: string): boolean {
    if (typeof cardNumber !== 'string') return false
    if (!/^[\d\s.-]+$/.test(cardNumber)) return false

    const digits = cardNumber.replace(/\D/g, '')
    if (digits.length < CARD_NUMBER_MIN_LENGTH || digits.length > CARD_NUMBER_MAX_LENGTH) {
      return false
    }

    let sum = 0
    let doubleIt = false
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = Number(digits[i])
      if (doubleIt) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      sum += digit
      doubleIt = !doubleIt
    }
    return sum % 10 === 0
  }

  static validateExpiry(expiryMonth: number, expiryYear: number): boolean {
    if (!Number.isInteger(expiryMonth) || !Number.isInteger(expiryYear)) return false
    if (expiryMonth < 1 || expiryMonth > 12) return false

    const now = new Date()
    const year = now.getFullYear()
    if (expiryYear < year) return false
    if (expiryYear === year && expiryMonth < now.getMonth() + 1) return false
    if (expiryYear > year + MAX_EXPIRY_YEARS_AHEAD) return false
    return true
  }

  /** Le CVV doit contenir exactement 3 ou 4 chiffres, sans aucun autre caractère. */
  static validateCVV(cvv: string): boolean {
    if (typeof cvv !== 'string') return false
    return /^\d{3,4}$/.test(cvv.trim())
  }

  static validateCardholderName(name: string): boolean {
    if (typeof name !== 'string') return false
    const length = name.trim().length
    return length >= NAME_MIN_LENGTH && length <= NAME_MAX_LENGTH
  }

  static validateCardData(cardData: CardData): void {
    if (!this.validateCardNumber(cardData.cardNumber)) {
      throw new InvalidCardException('Numéro de carte invalide')
    }
    if (!this.validateExpiry(cardData.expiryMonth, cardData.expiryYear)) {
      throw new InvalidCardException("Date d'expiration invalide")
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
    if (/^(5[1-5]|2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720))/.test(digits)) return 'MASTERCARD'
    if (/^3[47]/.test(digits)) return 'AMEX'
    return 'UNKNOWN'
  }

  static maskCardNumber(cardNumber: string): string {
    const digits = cardNumber.replace(/\D/g, '')
    return `****-****-****-${digits.slice(-4)}`
  }
}
