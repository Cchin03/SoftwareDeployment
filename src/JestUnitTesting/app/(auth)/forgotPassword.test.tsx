import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ForgotPasswordPage from '@/app/(auth)/forgotPassword/page'

// Mocks
const mockResetPasswordForEmail = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { resetPasswordForEmail: mockResetPasswordForEmail },
  }),
}))

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

// Clear mocks before each test to ensure test isolation and prevent state leakage between tests
beforeEach(() => jest.clearAllMocks())

// Tests for ForgotPasswordPage component
describe('ForgotPasswordPage — rendering', () => {
  it('renders the page heading', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument()
  })

  it('renders the email input', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument()
  })

  it('renders the Send reset link button', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('renders the Back to sign in link', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute('href', '/login')
  })

  it('does NOT show success message initially', () => {
    render(<ForgotPasswordPage />)
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument()
  })

  it('does NOT show an error initially', () => {
    render(<ForgotPasswordPage />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('ForgotPasswordPage — successful reset request', () => {
  it('calls resetPasswordForEmail with the entered email', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    render(<ForgotPasswordPage />)

    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'user@test.com',
      expect.objectContaining({ redirectTo: expect.stringContaining('/api/auth/callback') })
    )
  })

  it('shows success message after reset email is sent', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    render(<ForgotPasswordPage />)

    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() =>
      expect(screen.getByText(/check your email for a password reset link/i)).toBeInTheDocument()
    )
  })

  it('hides the form after success', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    render(<ForgotPasswordPage />)

    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /send reset link/i })).not.toBeInTheDocument()
    )
  })

  it('shows the 📬 emoji in the success state', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    render(<ForgotPasswordPage />)

    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => expect(screen.getByText('📬')).toBeInTheDocument())
  })
})

describe('ForgotPasswordPage — failed reset request', () => {
  it('shows an error message when Supabase returns an error', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'User not found' } })
    render(<ForgotPasswordPage />)

    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'bad@email.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() =>
      expect(screen.getByText(/user not found/i)).toBeInTheDocument()
    )
  })

  it('keeps the form visible after an error', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'User not found' } })
    render(<ForgotPasswordPage />)

    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'bad@email.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
    )
  })
})

describe('ForgotPasswordPage — loading state', () => {
  it('shows "Sending..." while the request is in flight', async () => {
    mockResetPasswordForEmail.mockReturnValue(new Promise(() => {})) // never resolves
    render(<ForgotPasswordPage />)

    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'user@test.com')
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByRole('button', { name: /sending/i })).toBeDisabled()
  })

  it('re-enables the button after the request completes', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Some error' } })
    render(<ForgotPasswordPage />)

    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /send reset link/i })).not.toBeDisabled()
    )
  })
})

describe('ForgotPasswordPage — redirectTo URL', () => {
  it('passes the correct callback URL origin in redirectTo', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    render(<ForgotPasswordPage />)

    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => expect(mockResetPasswordForEmail).toHaveBeenCalled())
    const [, options] = mockResetPasswordForEmail.mock.calls[0]
    expect(options.redirectTo).toContain('/api/auth/callback')
  })
})
