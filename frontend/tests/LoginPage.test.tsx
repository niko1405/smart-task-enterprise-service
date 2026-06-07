import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../src/pages/LoginPage';
import { useAuth } from '../src/hooks/useAuth';

jest.mock('../src/hooks/useAuth');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function renderLogin(): void {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  const login = jest.fn();

  beforeEach(() => {
    login.mockReset();
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login,
      register: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('shows a validation error for invalid email', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('calls login with credentials on valid submit', async () => {
    login.mockResolvedValue(undefined);
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'admin@smarttask.com');
    await userEvent.type(screen.getByLabelText('Password'), 'admin123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith('admin@smarttask.com', 'admin123')
    );
  });

  it('surfaces an error message when login fails', async () => {
    login.mockRejectedValue(new Error('Invalid email or password'));
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'admin@smarttask.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password'
    );
  });
});
