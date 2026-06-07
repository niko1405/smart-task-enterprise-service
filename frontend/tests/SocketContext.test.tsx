import { render, screen } from '@testing-library/react';
import { SocketProvider } from '../src/context/SocketContext';
import { useSocket } from '../src/hooks/useSocket';
import { useAuth } from '../src/hooks/useAuth';
import * as socketLib from '../src/lib/socket';

jest.mock('../src/hooks/useAuth');
jest.mock('../src/lib/socket');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedCreateSocket = socketLib.createSocket as jest.MockedFunction<
  typeof socketLib.createSocket
>;

function Probe(): JSX.Element {
  const socket = useSocket();
  return <span>{socket ? 'connected' : 'disconnected'}</span>;
}

describe('SocketProvider', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not create a socket without a token', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });
    render(
      <SocketProvider>
        <Probe />
      </SocketProvider>
    );
    expect(screen.getByText('disconnected')).toBeInTheDocument();
    expect(mockedCreateSocket).not.toHaveBeenCalled();
  });

  it('creates a socket when a token is present', () => {
    const disconnect = jest.fn();
    mockedCreateSocket.mockReturnValue({ disconnect } as never);
    mockedUseAuth.mockReturnValue({
      user: null,
      token: 'jwt',
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });
    const { unmount } = render(
      <SocketProvider>
        <Probe />
      </SocketProvider>
    );
    expect(mockedCreateSocket).toHaveBeenCalledWith('jwt');
    expect(screen.getByText('connected')).toBeInTheDocument();
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
