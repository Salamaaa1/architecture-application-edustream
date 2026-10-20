import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Button } from '@/components/ui/button'

describe('UI Component Suite - Accessibility & Boundary Behaviors', () => {
  describe('Button Component', () => {
    it('should render button with default variant classes and text', () => {
      render(<Button>Cliquez ici</Button>)
      const button = screen.getByRole('button', { name: /cliquez ici/i })
      expect(button).toBeInTheDocument()
      expect(button).not.toBeDisabled()
    })

    it('should support variant="destructive" and size="sm"', () => {
      render(
        <Button variant="destructive" size="sm">
          Supprimer
        </Button>
      )
      const button = screen.getByRole('button', { name: /supprimer/i })
      expect(button.className).toContain('bg-destructive')
    })

    it('should reflect disabled state and prevent pointer events', () => {
      render(<Button disabled>Indisponible</Button>)
      const button = screen.getByRole('button', { name: /indisponible/i })
      expect(button).toBeDisabled()
      expect(button.className).toContain('disabled:opacity-50')
    })

    it('should invoke onClick handler when clicked', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Action</Button>)
      const button = screen.getByRole('button', { name: /action/i })

      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})
