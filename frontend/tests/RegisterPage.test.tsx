import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from '../src/pages/RegisterPage';
import { useAuth } from '../src/hooks/useAuth';

jest.mock('../src/hooks/useAuth');
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('RegisterPage', () => {
  const register = jest.fn();

  beforeEach(() => {
    register.mockReset();
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: jest.fn(),
      register,
      logout: jest.fn(),
    });
  });

  function renderPage(): void {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
  }

  it('validates a short password', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText('Full name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(
      await screen.findByText('Password must be at least 8 characters')
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers with valid data', async () => {
    register.mockResolvedValue(undefined);
    renderPage();
    await userEvent.type(screen.getByLabelText('Full name'), 'Jane Smith');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
      })
    );
  });
});
