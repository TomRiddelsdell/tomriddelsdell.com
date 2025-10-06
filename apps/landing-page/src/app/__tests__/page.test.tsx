/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import Page from '../page'

describe('Landing Page', () => {
  it('renders the main heading', () => {
    render(<Page />)
    
    // This test will pass if any heading exists
    const headings = screen.getAllByRole('heading')
    expect(headings.length).toBeGreaterThan(0)
  })

  it('renders without crashing', () => {
    render(<Page />)
    // If we get here without throwing, the component rendered successfully
    expect(true).toBe(true)
  })
})