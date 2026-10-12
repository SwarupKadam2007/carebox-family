import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../src/components/common/ErrorBoundary';
import { LoadingState } from '../../src/components/common/LoadingState';
import { EmptyState } from '../../src/components/common/EmptyState';
import { ErrorState } from '../../src/components/common/ErrorState';
import { DemoModeBanner } from '../../src/components/layout/DemoModeBanner';
import { SetupErrorScreen } from '../../src/components/layout/SetupErrorScreen';
import { Pill } from 'lucide-react';

// Component that throws to test ErrorBoundary
const ProblemChild: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test crash in child component');
  }
  return <div>Safe Child Content</div>;
};

describe('Phase 1 Components & Quick Fixes', () => {
  describe('ErrorBoundary', () => {
    it('renders normal children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ProblemChild shouldThrow={false} />
        </ErrorBoundary>
      );
      expect(screen.getByText('Safe Child Content')).toBeInTheDocument();
    });

    it('catches render errors and renders graceful recovery UI', () => {
      // Suppress console.error during expected crash test
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ProblemChild shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went unexpectedly wrong')).toBeInTheDocument();
      expect(screen.getByText(/CareBox encountered an issue while rendering/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reload Application/i })).toBeInTheDocument();

      spy.mockRestore();
    });
  });

  describe('DemoModeBanner', () => {
    it('renders demo mode notice correctly', () => {
      render(<DemoModeBanner />);
      expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
      expect(screen.getByText(/Using simulated local data/i)).toBeInTheDocument();
    });
  });

  describe('SetupErrorScreen', () => {
    it('renders production configuration required notice', () => {
      render(<SetupErrorScreen />);
      expect(screen.getByText('Configuration Required')).toBeInTheDocument();
      expect(screen.getByText('VITE_SUPABASE_URL')).toBeInTheDocument();
      expect(screen.getByText('VITE_SUPABASE_ANON_KEY')).toBeInTheDocument();
    });
  });

  describe('LoadingState', () => {
    it('displays loading message with aria status', () => {
      render(<LoadingState message="Fetching doses..." />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Fetching doses...')).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders title, description, and action button', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          icon={Pill}
          title="No Prescriptions"
          description="Add your daily medicines"
          actionLabel="Add Medicine"
          onAction={handleAction}
        />
      );

      expect(screen.getByText('No Prescriptions')).toBeInTheDocument();
      expect(screen.getByText('Add your daily medicines')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: 'Add Medicine' });
      fireEvent.click(btn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorState', () => {
    it('renders error notice and triggers retry button', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          title="Sync Failed"
          message="Could not reach database"
          onRetry={handleRetry}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Sync Failed')).toBeInTheDocument();
      expect(screen.getByText('Could not reach database')).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });
});
