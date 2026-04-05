import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '@/pages/Home'

describe('Home', () => {
  it('renders the landing page hero title', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    expect(screen.getByText('DripNSole')).toBeTruthy()
  })

  it('renders CTA buttons', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    expect(screen.getByText('Start Selling')).toBeTruthy()
    expect(screen.getByText('Discover Items')).toBeTruthy()
  })
})
