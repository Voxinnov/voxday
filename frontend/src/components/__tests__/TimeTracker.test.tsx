import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TimeTracker from '../TimeTracker';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock('../../services/api', () => ({
  default: mockApiClient,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('TimeTracker Component', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: { name: 'Developer' },
    isFreelancer: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: mockUser,
    });

    // Mock successful API responses
    mockApiClient.get.mockResolvedValue({
      data: {
        id: 1,
        taskId: 1,
        startTime: new Date().toISOString(),
        endTime: null,
        durationMins: null,
        notes: 'Test entry',
        task: {
          id: 1,
          title: 'Test Task',
          project: { name: 'Test Project' },
        },
      },
    });

    mockApiClient.post.mockResolvedValue({
      data: {
        id: 1,
        taskId: 1,
        startTime: new Date().toISOString(),
        endTime: null,
        durationMins: null,
        notes: 'Test entry',
      },
    });
  });

  it('renders time tracker correctly', () => {
    render(
      <TestWrapper>
        <TimeTracker />
      </TestWrapper>
    );

    expect(screen.getByText('Time Tracker')).toBeInTheDocument();
  });

  it('shows no active timer when no running entry', async () => {
    mockApiClient.get.mockResolvedValue({ data: null });

    render(
      <TestWrapper>
        <TimeTracker />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No active timer')).toBeInTheDocument();
    });
  });

  it('shows active timer with task information', async () => {
    const startTime = new Date();
    mockApiClient.get.mockResolvedValue({
      data: {
        id: 1,
        taskId: 1,
        startTime: startTime.toISOString(),
        endTime: null,
        durationMins: null,
        notes: 'Test entry',
        task: {
          id: 1,
          title: 'Test Task',
          project: { name: 'Test Project' },
        },
      },
    });

    render(
      <TestWrapper>
        <TimeTracker />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('displays elapsed time correctly', async () => {
    const startTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    mockApiClient.get.mockResolvedValue({
      data: {
        id: 1,
        taskId: 1,
        startTime: startTime.toISOString(),
        endTime: null,
        durationMins: null,
        notes: 'Test entry',
        task: {
          id: 1,
          title: 'Test Task',
          project: { name: 'Test Project' },
        },
      },
    });

    render(
      <TestWrapper>
        <TimeTracker />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/2:00:00/)).toBeInTheDocument();
    });
  });

  it('handles start timer action', async () => {
    mockApiClient.get.mockResolvedValue({ data: null });
    mockApiClient.post.mockResolvedValue({
      data: {
        id: 1,
        taskId: 1,
        startTime: new Date().toISOString(),
        endTime: null,
        durationMins: null,
        notes: 'Test entry',
      },
    });

    render(
      <TestWrapper>
        <TimeTracker />
      </TestWrapper>
    );

    await waitFor(() => {
      const startButton = screen.getByText('Start Timer');
      fireEvent.click(startButton);
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/time-entries/start', {
      taskId: 1,
    });
  });

  it('handles stop timer action', async () => {
    const startTime = new Date();
    mockApiClient.get.mockResolvedValue({
      data: {
        id: 1,
        taskId: 1,
        startTime: startTime.toISOString(),
        endTime: null,
        durationMins: null,
        notes: 'Test entry',
        task: {
          id: 1,
          title: 'Test Task',
          project: { name: 'Test Project' },
        },
      },
    });

    mockApiClient.put.mockResolvedValue({
      data: {
        id: 1,
        taskId: 1,
        startTime: startTime.toISOString(),
        endTime: new Date().toISOString(),
        durationMins: 120,
        notes: 'Test entry',
      },
    });

    render(
      <TestWrapper>
        <TimeTracker />
      </TestWrapper>
    );

    await waitFor(() => {
      const stopButton = screen.getByText('Stop Timer');
      fireEvent.click(stopButton);
    });

    expect(mockApiClient.put).toHaveBeenCalledWith('/time-entries/1/stop');
  });

  it('opens manual time entry modal', async () => {
    mockApiClient.get.mockResolvedValue({ data: null });

    render(
      <TestWrapper>
        <TimeTracker />
      </TestWrapper>
    );

    await waitFor(() => {
      const manualButton = screen.getByText('Log Time Manually');
      fireEvent.click(manualButton);
    });

    expect(screen.getByText('Log Time Manually')).toBeInTheDocument();
  });

  it('submits manual time entry', async () => {
    mockApiClient.get.mockResolvedValue({ data: null });
    mockApiClient.post.mockResolvedValue({
      data: {
        id: 1,
        taskId: 1,
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T12:00:00Z',
        durationMins: 120,
        notes: 'Manual entry',
      },
    });

    render(
      <TestWrapper>
        <TimeTracker />
      </TestWrapper>
    );

    await waitFor(() => {
      const manualButton = screen.getByText('Log Time Manually');
      fireEvent.click(manualButton);
    });

    const startTimeInput = screen.getByLabelText(/start time/i);
    const endTimeInput = screen.getByLabelText(/end time/i);
    const notesInput = screen.getByLabelText(/notes/i);
    const submitButton = screen.getByText('Create Entry');

    fireEvent.change(startTimeInput, { target: { value: '2024-01-01T10:00' } });
    fireEvent.change(endTimeInput, { target: { value: '2024-01-01T12:00' } });
    fireEvent.change(notesInput, { target: { value: 'Manual entry' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalledWith('/time-entries', {
        taskId: 1,
        startTime: '2024-01-01T10:00:00.000Z',
        endTime: '2024-01-01T12:00:00.000Z',
        notes: 'Manual entry',
      });
    });
  });

  it('handles API errors gracefully', async () => {
    mockApiClient.get.mockRejectedValue(new Error('API Error'));

    render(
      <TestWrapper>
        <TimeTracker />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error loading timer')).toBeInTheDocument();
    });
  });

  it('updates timer display in real-time', async () => {
    const startTime = new Date(Date.now() - 1000); // 1 second ago
    mockApiClient.get.mockResolvedValue({
      data: {
        id: 1,
        taskId: 1,
        startTime: startTime.toISOString(),
        endTime: null,
        durationMins: null,
        notes: 'Test entry',
        task: {
          id: 1,
          title: 'Test Task',
          project: { name: 'Test Project' },
        },
      },
    });

    render(
      <TestWrapper>
        <TimeTracker />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    // Timer should update every second
    await waitFor(() => {
      expect(screen.getByText(/0:00:01/)).toBeInTheDocument();
    });
  });
});
