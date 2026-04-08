import { describe, it, expect } from 'vitest'
import { render, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '@/pages/Home'

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  )
}

describe('Home', () => {
  it('renders the landing page hero title', () => {
    const { container } = renderHome()
    const main = within(container).getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: 'DripNSole' })).toBeTruthy()
  })

  it('renders hero CTA links', () => {
    const { container } = renderHome()
    const main = within(container).getByRole('main')
    expect(within(main).getByRole('link', { name: /Start Selling Free/i })).toBeTruthy()
    expect(within(main).getByRole('link', { name: /Shop Thrift Finds/i })).toBeTruthy()
  })
})
