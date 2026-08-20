// login.test.tsx

import React, { Suspense } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/(auth)/login/page'

// Mocks for next/navigation and supabase client to isolate tests from external dependencies and control their behavior. We mock useRouter to track redirects, useSearchParams to control query params, and the supabase client to simulate authentication responses without making real API calls. We also mock next/link to prevent actual navigation during tests and allow us to verify link rendering.
const mockPush = jest.fn()
const mockRefresh = jest.fn()
let mockNextParam: string | null = null

// Mock supabase client with signInWithPassword and from methods. The from method is used to fetch the user's profile after authentication to determine their role (user or admin). By mocking these, we can simulate different authentication scenarios (success, failure, admin vs user) without relying on a real backend. 
const mockSignInWithPassword = jest.fn()
const mockFrom = jest.fn()

// Mock next/navigation to provide useRouter and useSearchParams hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => ({ get: (key: string) => key === 'next' ? mockNextParam : null }),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: mockSignInWithPassword },
    from: mockFrom,
  }),
}))

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

//  Fixture builders 
function mockAuthSuccess(role: 'user' | 'admin' = 'user') {
  const userId = 'user-abc'
  mockSignInWithPassword.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  })
  mockFrom.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { role }, error: null }),
  })
}

// Helper function to fill in the login form and submit it. This abstracts away the details of interacting with the form elements, making the tests cleaner and more focused on the expected outcomes rather than the mechanics of filling out the form. By default, it uses valid credentials, but you can override them to test different scenarios (e.g. invalid credentials).
function mockAuthFailure() {
  mockSignInWithPassword.mockResolvedValue({
    data: null,
    error: { message: 'Invalid login credentials' },
  })
}

// Helper function to fill in the login form and submit it. This abstracts away the details of interacting with the form elements, making the tests cleaner and more focused on the expected outcomes rather than the mechanics of filling out the form. By default, it uses valid credentials, but you can override them to test different scenarios (e.g. invalid credentials).
async function fillAndSubmit(email = 'user@example.com', password = 'password123') {
  await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), email)
  await userEvent.type(screen.getByPlaceholderText(/••••••••/), password)
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
}

beforeEach(() => {
  jest.clearAllMocks()
  mockNextParam = null
})

// Tests 
describe('LoginPage — rendering', () => {
  it('renders the Welcome back heading', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('renders the email input', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument()
  })

  it('renders the password input', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument()
  })

  it('renders the Sign in button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders the Forgot password link pointing to /forgotPassword', () => {
    render(<LoginPage />)
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgotPassword')
  })

  it('renders the Create one link pointing to /register', () => {
    render(<LoginPage />)
    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/register')
  })

  it('does NOT show an error banner initially', () => {
    render(<LoginPage />)
    expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument()
  })

  it('password input type is "password" by default', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText(/••••••••/)).toHaveAttribute('type', 'password')
  })
})

describe('LoginPage — password visibility toggle', () => {
  it('toggles password to text when eye icon is clicked', async () => {
    render(<LoginPage />)
    const input = screen.getByPlaceholderText(/••••••••/)
    // Find the toggle button (the only non-submit button in the form area)
    const toggle = screen.getByRole('button', { name: '' }) // icon button has no accessible name
    await userEvent.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
  })

  it('toggles password back to hidden on second click', async () => {
    render(<LoginPage />)
    const input  = screen.getByPlaceholderText(/••••••••/)
    const toggle = screen.getAllByRole('button').find(b => b.getAttribute('type') === 'button')!
    await userEvent.click(toggle)
    await userEvent.click(toggle)
    expect(input).toHaveAttribute('type', 'password')
  })
})

describe('LoginPage — successful login', () => {
  it('calls signInWithPassword with correct credentials', async () => {
    mockAuthSuccess()
    render(<LoginPage />)
    await fillAndSubmit('user@example.com', 'secret123')

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
    })
  })

  it('redirects regular user to "/" by default', async () => {
    mockAuthSuccess('user')
    render(<LoginPage />)
    await fillAndSubmit()

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
  })

  it('redirects regular user to the ?next= URL when provided', async () => {
    mockAuthSuccess('user')
    mockNextParam = '/product/electronics/iphone'
    render(<LoginPage />)
    await fillAndSubmit()

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/product/electronics/iphone')
    )
  })

  it('always redirects admin to /admin/dashboard regardless of ?next=', async () => {
    mockAuthSuccess('admin')
    mockNextParam = '/cart'
    render(<LoginPage />)
    await fillAndSubmit()

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard')
    )
  })

  it('calls router.refresh() after a successful user login', async () => {
    mockAuthSuccess('user')
    render(<LoginPage />)
    await fillAndSubmit()

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
  })

  it('also calls router.refresh() after a successful admin login', async () => {
    mockAuthSuccess('admin')
    render(<LoginPage />)
    await fillAndSubmit()

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/dashboard'))
    expect(mockRefresh).toHaveBeenCalled()
  })
})

describe('LoginPage — failed login', () => {
  it('shows error message on invalid credentials', async () => {
    mockAuthFailure()
    render(<LoginPage />)
    await fillAndSubmit()

    await waitFor(() =>
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    )
  })

  it('does NOT redirect on failed login', async () => {
    mockAuthFailure()
    render(<LoginPage />)
    await fillAndSubmit()

    await waitFor(() => expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument())
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('clears the error message on the next submit attempt', async () => {
    mockAuthFailure()
    render(<LoginPage />)
    await fillAndSubmit()
    await waitFor(() => screen.getByText(/invalid email or password/i))

    // Second attempt succeeds
    mockAuthSuccess()
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() =>
      expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument()
    )
  })
})

describe('LoginPage — loading state', () => {
  it('shows "Signing in..." while request is in flight', async () => {
    mockSignInWithPassword.mockReturnValue(new Promise(() => {})) // never resolves
    render(<LoginPage />)

    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'user@test.com')
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'password')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('button', { name: /signing in/i })).toBeDisabled()
  })
})

describe('LoginPage — register link with ?next= param', () => {
  it('appends encoded ?next= to register link when param is present', () => {
    mockNextParam = '/cart'
    render(<LoginPage />)
    const registerLink = screen.getByRole('link', { name: /create one/i })
    expect(registerLink).toHaveAttribute(
      'href',
      `/register?next=${encodeURIComponent('/cart')}`
    )
  })

  it('register link points to plain /register when no ?next= param', () => {
    mockNextParam = null
    render(<LoginPage />)
    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/register')
  })
})