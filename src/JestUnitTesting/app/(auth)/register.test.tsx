// register.test.tsx

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterPage from '@/app/(auth)/register/page'

// userEvent v14: always use setup() so the user-event instance manages its
// own clock instead of fighting with any global timer mocks.
const user = userEvent.setup()

// Mocks
const mockPush = jest.fn()
const mockSignUp = jest.fn()
const mockUpsert = jest.fn()

// Mock next/navigation to provide useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signUp: mockSignUp },
    from: () => ({ upsert: mockUpsert }),
  }),
}))

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

// Helper function to fill in the registration form. This abstracts away the details of interacting with the form elements, making the tests cleaner and more focused on the expected outcomes rather than the mechanics of filling out the form. By default, it uses valid input values, but you can override them to test different scenarios (e.g. password mismatch).
async function fillForm({
  name = 'Jane Doe',
  age = '25',
  email = 'jane@example.com',
  password = 'Password1!',
  confirm = 'Password1!',
} = {}) {
  await user.type(screen.getByPlaceholderText('John Doe'), name)
  await user.type(screen.getByPlaceholderText('25'), age)
  await user.type(screen.getByPlaceholderText('you@example.com'), email)
  const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
  await user.type(passwordInput, password)
  await user.type(confirmInput, confirm)
}

beforeEach(() => jest.clearAllMocks())

// Tests for RegisterPage component
describe('RegisterPage — rendering', () => {
  it('renders the Create an account heading', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument()
  })

  it('renders the Full name input', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
  })

  it('renders the Age input', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('25')).toBeInTheDocument()
  })

  it('renders the Email input', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
  })

  it('renders two password inputs (Password + Confirm)', () => {
    render(<RegisterPage />)
    expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2)
  })

  it('renders the Create account button', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('renders the Sign in link pointing to /login', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })

  it('does NOT show an error initially', () => {
    render(<RegisterPage />)
    expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument()
  })

  it('does NOT show the password match indicator before any input', () => {
    render(<RegisterPage />)
    expect(screen.queryByText(/passwords match/i)).not.toBeInTheDocument()
  })
})

describe('RegisterPage — password visibility toggles', () => {
  it('password field defaults to type="password"', () => {
    render(<RegisterPage />)
    const [passwordInput] = screen.getAllByPlaceholderText('••••••••')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('confirm field defaults to type="password"', () => {
    render(<RegisterPage />)
    const [, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    expect(confirmInput).toHaveAttribute('type', 'password')
  })

  it('clicking the first eye icon reveals the password field', async () => {
    render(<RegisterPage />)
    const [passwordInput] = screen.getAllByPlaceholderText('••••••••')
    const toggleButtons = screen.getAllByRole('button').filter(b => b.getAttribute('type') === 'button')
    await user.click(toggleButtons[0])
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('clicking the second eye icon reveals the confirm field', async () => {
    render(<RegisterPage />)
    const [, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    const toggleButtons = screen.getAllByRole('button').filter(b => b.getAttribute('type') === 'button')
    await user.click(toggleButtons[1])
    expect(confirmInput).toHaveAttribute('type', 'text')
  })
})

describe('RegisterPage — live password match indicator', () => {
  it('shows "Passwords do not match" when confirm differs from password', async () => {
    render(<RegisterPage />)
    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'different')
    expect(screen.getAllByText(/passwords do not match/i)[0]).toBeInTheDocument()
  })

  it('shows "Passwords match" when confirm equals password', async () => {
    render(<RegisterPage />)
    const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'password123')
    expect(screen.getAllByText(/passwords match/i)[0]).toBeInTheDocument()
  })

  it('does NOT show indicator when confirm is empty', () => {
    render(<RegisterPage />)
    expect(screen.queryByText(/passwords/i)).not.toBeInTheDocument()
  })
})

// The following tests focus on the form submission behavior, including client-side validation (password mismatch), successful registration flow (with and without email confirmation), and error handling for Supabase signUp errors. By simulating user interactions and mocking the Supabase client, we can verify that the RegisterPage component behaves correctly under various scenarios without needing a real backend or network requests.
describe('RegisterPage — client-side password mismatch', () => {
  it('shows error and does NOT call signUp when passwords mismatch on submit', async () => {
    render(<RegisterPage />)
    await fillForm({ confirm: 'WrongPassword!' })
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getAllByText(/passwords do not match/i)[0]).toBeInTheDocument()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('does NOT redirect on password mismatch', async () => {
    render(<RegisterPage />)
    await fillForm({ confirm: 'WrongPassword!' })
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(mockPush).not.toHaveBeenCalled()
  })
})

describe('RegisterPage — successful registration (email confirmation OFF)', () => {
  beforeEach(() => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'new-user-id' }, session: { access_token: 'tok' } },
      error: null,
    })
    mockUpsert.mockResolvedValue({ error: null })
  })

  it('calls supabase.auth.signUp with email and password', async () => {
    render(<RegisterPage />)
    await fillForm()
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'jane@example.com',
        password: 'Password1!',
      })
    )
  })

  it('upserts the profile with the user id and name', async () => {
    render(<RegisterPage />)
    await fillForm({ name: 'Jane Doe' })
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(mockUpsert).toHaveBeenCalledWith({ id: 'new-user-id', name: 'Jane Doe' })
    )
  })

  it('redirects to "/" when a session is returned (email confirmation OFF)', async () => {
    render(<RegisterPage />)
    await fillForm()
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
  })
})

describe('RegisterPage — successful registration (email confirmation ON)', () => {
  it('redirects to /login?message=check-your-email when no session is returned', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'new-user-id' }, session: null },
      error: null,
    })
    mockUpsert.mockResolvedValue({ error: null })

    render(<RegisterPage />)
    await fillForm()
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/login?message=check-your-email')
    )
  })
})

describe('RegisterPage — Supabase errors', () => {
  it('shows error message when signUp returns an error', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email already in use' },
    })

    render(<RegisterPage />)
    await fillForm()
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(screen.getByText(/email already in use/i)).toBeInTheDocument()
    )
  })

  it('shows fallback error when signUp returns no user and no error message', async () => {
    mockSignUp.mockResolvedValue({ data: { user: null }, error: null })

    render(<RegisterPage />)
    await fillForm()
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    )
  })

  it('does NOT redirect on signUp error', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'Signup disabled' },
    })

    render(<RegisterPage />)
    await fillForm()
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => screen.getByText(/signup disabled/i))
    expect(mockPush).not.toHaveBeenCalled()
  })
})

describe('RegisterPage — loading state', () => {
  it('shows "Creating account..." while request is in flight', async () => {
    mockSignUp.mockReturnValue(new Promise(() => {})) // never resolves
    render(<RegisterPage />)
    await fillForm()
    // Use fireEvent (synchronous) so we can assert the loading state before
    // the click's async chain yields. findByRole would time out because the
    // promise never resolves and there is nothing to wait for.
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
    )
  })
})
