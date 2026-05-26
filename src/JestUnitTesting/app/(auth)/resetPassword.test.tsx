// resetPassword.test.tsx

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetPasswordPage from '@/app/(auth)/resetPassword/page'

// Mocks for next/navigation and supabase client to isolate tests from external dependencies and control their behavior. We mock useRouter to track redirects, and the supabase client to simulate session retrieval and password update responses without making real API calls. We also mock next/link to prevent actual navigation during tests and allow us to verify link rendering.
const mockPush = jest.fn()
const mockGetSession = jest.fn()
const mockUpdateUser = jest.fn()
const mockSignOut = jest.fn()

// Mock next/navigation to provide useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
    },
  }),
}))

// Mock next/link to prevent actual navigation during tests and allow us to verify link rendering
jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

// Clear mocks before each test to ensure test isolation and prevent state leakage between tests
function mockValidSession() {
  mockGetSession.mockResolvedValue({ data: { session: { access_token: 'valid-token' } } })
}

// Helper function to fill in the login form and submit it. This abstracts away the details of interacting with the form elements, making the tests cleaner and more focused on the expected outcomes rather than the mechanics of filling out the form. By default, it uses valid credentials, but you can override them to test different scenarios (e.g. invalid credentials).
function mockNoSession() {
  mockGetSession.mockResolvedValue({ data: { session: null } })
}

// Helper function to wait until the initial session check is complete and the page is ready for interaction. This is necessary because the component shows a loading state while it checks the session, and we need to wait for that to finish before we can interact with the form elements in our tests. By waiting for the "Verifying reset link..." text to disappear, we can be confident that the component has finished its initial loading state and is ready for user interaction.
async function waitForReady() {
  await waitFor(() =>
    expect(screen.queryByText(/verifying reset link/i)).not.toBeInTheDocument()
  )
}

// The following tests cover the various states and behaviors of the ResetPasswordPage component, including loading state, handling of invalid/expired reset links, form rendering for valid links, password visibility toggles, client-side validation for password mismatch and length requirements, successful password update flow (including sign out and redirect), and error handling for Supabase updateUser errors. By simulating user interactions and mocking the Supabase client responses, we can verify that the component behaves correctly under different scenarios without needing a real backend or network requests.
let user: ReturnType<typeof userEvent.setup>

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) })
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})

// Tests for ResetPasswordPage component
describe('ResetPasswordPage — loading state', () => {
  it('shows "Verifying reset link..." while session check is in flight', async () => {
    mockGetSession.mockReturnValue(new Promise(() => {})) // never resolves
    render(<ResetPasswordPage />)
    expect(screen.getByText(/verifying reset link/i)).toBeInTheDocument()
  })

  it('shows a spinner during loading', () => {
    mockGetSession.mockReturnValue(new Promise(() => {}))
    render(<ResetPasswordPage />)
    // Spinner is a div with animate-spin class
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
})

describe('ResetPasswordPage — invalid / expired link', () => {
  it('shows "Link Invalid" heading when session is null', async () => {
    mockNoSession()
    render(<ResetPasswordPage />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /link invalid/i })).toBeInTheDocument()
    )
  })

  it('shows the expired link error message', async () => {
    mockNoSession()
    render(<ResetPasswordPage />)

    await waitFor(() =>
      expect(screen.getByText(/reset link is invalid or has expired/i)).toBeInTheDocument()
    )
  })

  it('shows a "Request New Link" button that navigates to /forgotPassword', async () => {
    mockNoSession()
    render(<ResetPasswordPage />)

    await waitFor(() => screen.getByRole('button', { name: /request new link/i }))
    await user.click(screen.getByRole('button', { name: /request new link/i }))

    expect(mockPush).toHaveBeenCalledWith('/forgotPassword')
  })

  it('does NOT show the password form when link is invalid', async () => {
    mockNoSession()
    render(<ResetPasswordPage />)

    await waitFor(() => screen.getByRole('heading', { name: /link invalid/i }))
    expect(screen.queryByRole('button', { name: /update password/i })).not.toBeInTheDocument()
  })
})

// The following tests cover the rendering of the password reset form when a valid session is present, including the presence of form elements, functionality of password visibility toggles, client-side validation for password mismatch and length requirements, successful password update flow (including sign out and redirect), and error handling for Supabase updateUser errors. By simulating user interactions and mocking the Supabase client responses, we can verify that the component behaves correctly under different scenarios without needing a real backend or network requests.
describe('ResetPasswordPage — valid link (form rendering)', () => {
  it('renders the Set new password heading', async () => {
    mockValidSession()
    render(<ResetPasswordPage />)
    await waitForReady()

    expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument()
  })

  it('renders two password inputs', async () => {
    mockValidSession()
    render(<ResetPasswordPage />)
    await waitForReady()

    expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2)
  })

  it('renders the Update Password submit button', async () => {
    mockValidSession()
    render(<ResetPasswordPage />)
    await waitForReady()

    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument()
  })

  it('renders the Back to Shop link', async () => {
    mockValidSession()
    render(<ResetPasswordPage />)
    await waitForReady()

    expect(screen.getByRole('link', { name: /back to shop/i })).toHaveAttribute('href', '/')
  })

  it('both password inputs default to type="password"', async () => {
    mockValidSession()
    render(<ResetPasswordPage />)
    await waitForReady()

    const inputs = screen.getAllByPlaceholderText('••••••••')
    inputs.forEach(input => expect(input).toHaveAttribute('type', 'password'))
  })
})

// The following tests focus on the password visibility toggle functionality for both password fields. By simulating user clicks on the eye icons and verifying that the corresponding input field's type attribute changes from "password" to "text", we can confirm that the toggle functionality works as intended, allowing users to reveal or hide their password inputs as needed.
describe('ResetPasswordPage — password visibility toggles', () => {
  it('first eye icon reveals the password field', async () => {
    mockValidSession()
    render(<ResetPasswordPage />)
    await waitForReady()

    const [passwordInput] = screen.getAllByPlaceholderText('••••••••')
    const toggles = screen.getAllByRole('button').filter(b => b.getAttribute('type') === 'button')
    await user.click(toggles[0])
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('second eye icon reveals the confirm field', async () => {
    mockValidSession()
    render(<ResetPasswordPage />)
    await waitForReady()

    const [, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    const toggles = screen.getAllByRole('button').filter(b => b.getAttribute('type') === 'button')
    await user.click(toggles[1])
    expect(confirmInput).toHaveAttribute('type', 'text')
  })
})

describe('ResetPasswordPage — client-side validation', () => {
  it('shows error when passwords do not match', async () => {
    mockValidSession()
    render(<ResetPasswordPage />)
    await waitForReady()

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInput, 'Password1!')
    await user.type(confirmInput, 'Different1!')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('shows error when password is shorter than 6 characters', async () => {
    mockValidSession()
    render(<ResetPasswordPage />)
    await waitForReady()

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInput, 'abc')
    await user.type(confirmInput, 'abc')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('accepts password that is exactly 6 characters', async () => {
    mockValidSession()
    mockUpdateUser.mockResolvedValue({ error: null })
    mockSignOut.mockResolvedValue({})

    render(<ResetPasswordPage />)
    await waitForReady()

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInput, 'abc123')
    await user.type(confirmInput, 'abc123')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalled())
  })
})

describe('ResetPasswordPage — successful password update', () => {
  it('calls updateUser with the new password', async () => {
    mockValidSession()
    mockUpdateUser.mockResolvedValue({ error: null })
    mockSignOut.mockResolvedValue({})

    render(<ResetPasswordPage />)
    await waitForReady()

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInput, 'NewPassword1!')
    await user.type(confirmInput, 'NewPassword1!')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() =>
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPassword1!' })
    )
  })

  it('shows success message after update', async () => {
    mockValidSession()
    mockUpdateUser.mockResolvedValue({ error: null })
    mockSignOut.mockResolvedValue({})

    render(<ResetPasswordPage />)
    await waitForReady()

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInput, 'NewPassword1!')
    await user.type(confirmInput, 'NewPassword1!')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() =>
      expect(screen.getByText(/password updated.*redirecting/i)).toBeInTheDocument()
    )
  })

  it('calls signOut after a successful update', async () => {
    mockValidSession()
    mockUpdateUser.mockResolvedValue({ error: null })
    mockSignOut.mockResolvedValue({})

    render(<ResetPasswordPage />)
    await waitForReady()

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInput, 'NewPassword1!')
    await user.type(confirmInput, 'NewPassword1!')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(mockSignOut).toHaveBeenCalled())
  })

  it('redirects to /login after 2 seconds', async () => {
    mockValidSession()
    mockUpdateUser.mockResolvedValue({ error: null })
    mockSignOut.mockResolvedValue({})

    render(<ResetPasswordPage />)
    await waitForReady()

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInput, 'NewPassword1!')
    await user.type(confirmInput, 'NewPassword1!')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(mockSignOut).toHaveBeenCalled())
    act(() => jest.advanceTimersByTime(2000))

    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})

describe('ResetPasswordPage — Supabase updateUser error', () => {
  it('shows error message when updateUser fails', async () => {
    mockValidSession()
    mockUpdateUser.mockResolvedValue({ error: { message: 'Update failed on server' } })

    render(<ResetPasswordPage />)
    await waitForReady()

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInput, 'NewPassword1!')
    await user.type(confirmInput, 'NewPassword1!')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() =>
      expect(screen.getByText(/update failed on server/i)).toBeInTheDocument()
    )
  })

  it('does NOT redirect when updateUser fails', async () => {
    mockValidSession()
    mockUpdateUser.mockResolvedValue({ error: { message: 'Update failed on server' } })

    render(<ResetPasswordPage />)
    await waitForReady()

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInput, 'NewPassword1!')
    await user.type(confirmInput, 'NewPassword1!')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => screen.getByText(/update failed on server/i))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does NOT call signOut when updateUser fails', async () => {
    mockValidSession()
    mockUpdateUser.mockResolvedValue({ error: { message: 'Update failed' } })

    render(<ResetPasswordPage />)
    await waitForReady()

    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInput, 'NewPassword1!')
    await user.type(confirmInput, 'NewPassword1!')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => screen.getByText(/update failed/i))
    expect(mockSignOut).not.toHaveBeenCalled()
  })
})
