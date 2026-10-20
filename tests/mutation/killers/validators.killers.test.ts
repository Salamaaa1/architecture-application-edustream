import { describe, it, expect } from 'vitest'
import { CardValidator } from '@/lib/services/validators'

// Mutants survivants du tour 1 : plages Mastercard 2221-2720 non testées dans leur ensemble,
// et ancre « ^ » de la détection AMEX.
describe('CardValidator.getCardType — plages Mastercard 2221-2720 (tueurs)', () => {
  it.each([
    ['2221', 'début de la plage 22[1-9]'],
    ['2229', 'fin de 22[1-9]'],
    ['2230', 'début de 2[3-9]x (2230-2299)'],
    ['2299', 'fin de 2[3-9]x'],
    ['2300', 'début de [3-6]xx (2300-2699)'],
    ['2699', 'fin de [3-6]xx'],
    ['2700', 'début de 7[01]x (2700-2719)'],
    ['2719', 'fin de 7[01]x'],
    ['2720', 'dernier préfixe valide'],
  ])('%s est une Mastercard (%s)', (prefix) => {
    expect(CardValidator.getCardType(`${prefix}000000000000`)).toBe('MASTERCARD')
  })

  it.each(['2220', '2721', '2800', '2000'])('%s n\'est pas une Mastercard', (prefix) => {
    expect(CardValidator.getCardType(`${prefix}000000000000`)).toBe('UNKNOWN')
  })
})

describe('CardValidator.getCardType — le préfixe doit être en début de numéro (tueurs)', () => {
  it('« 34 » ou « 37 » au milieu du numéro ne suffit pas pour AMEX', () => {
    expect(CardValidator.getCardType('6011 3400 0000 0000')).toBe('UNKNOWN')
    expect(CardValidator.getCardType('9999 3700 0000 0000')).toBe('UNKNOWN')
  })

  it('« 4 » ou « 51 » au milieu du numéro ne suffit pas pour VISA / MASTERCARD', () => {
    expect(CardValidator.getCardType('6011 4000 0000 0000')).toBe('UNKNOWN')
    expect(CardValidator.getCardType('6011 5100 0000 0000')).toBe('UNKNOWN')
  })
})
