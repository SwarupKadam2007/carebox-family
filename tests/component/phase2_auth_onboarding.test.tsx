import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingScreen } from '../../src/components/screens/OnboardingScreen';
import {
  checkUserConsents,
  onboardNewFamily,
  deleteUserAccount,
  exportUserData,
} from '../../src/lib/authService';

// Mock AppContext
const mockSetCurrentStep = vi.fn();
const mockShowToast = vi.fn();

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => ({
    setCurrentStep: mockSetCurrentStep,
    showToast: mockShowToast,
  }),
}));

describe('Phase 2: Real Auth, Onboarding & DPDP Data Services', () => {
  describe('OnboardingScreen Role Selection', () => {
    it('renders role choices for parent vs caregiver', () => {
      render(<OnboardingScreen />);
      expect(screen.getByText(/I take medicines/i)).toBeInTheDocument();
      expect(screen.getByText(/I care for someone/i)).toBeInTheDocument();
    });

    it('handles selecting parent mode', async () => {
      render(<OnboardingScreen />);
      const parentBtn = screen.getByRole('button', { name: /I take medicines/i });
      fireEvent.click(parentBtn);

      await waitFor(() => {
        expect(mockSetCurrentStep).toHaveBeenCalledWith('connect-box');
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.stringContaining('Parent (Device Owner)')
        );
      });
    });

    it('handles selecting caregiver mode', async () => {
      render(<OnboardingScreen />);
      const caregiverBtn = screen.getByRole('button', { name: /I care for someone/i });
      fireEvent.click(caregiverBtn);

      await waitFor(() => {
        expect(mockSetCurrentStep).toHaveBeenCalledWith('connect-box');
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.stringContaining('Family Caregiver')
        );
      });
    });
  });

  describe('Auth & DPDP Service Functions', () => {
    it('checkUserConsents returns true in mock/demo fallback', async () => {
      const result = await checkUserConsents('usr-1');
      expect(result).toBe(true);
    });

    it('onboardNewFamily returns initial mock family and 6-digit pairing code', async () => {
      const { data, error } = await onboardNewFamily('Kadam Family', 'Mom', 'parent');
      expect(error).toBeNull();
      expect(data).toHaveProperty('pairing_code');
      expect(data).toHaveProperty('family_id');
      expect(data.role).toBe('parent');
    });

    it('deleteUserAccount succeeds in mock fallback', async () => {
      const { error } = await deleteUserAccount();
      expect(error).toBeNull();
    });

    it('exportUserData returns structured DPDP archive', async () => {
      const { data, error } = await exportUserData('usr-test');
      expect(error).toBeNull();
      expect(data).toHaveProperty('userId', 'usr-test');
      expect(data).toHaveProperty('exportedAt');
      expect(data).toHaveProperty('format');
    });
  });
});
