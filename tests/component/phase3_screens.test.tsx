import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginScreen from '../../src/components/screens/LoginScreen';
import ConsentScreen from '../../src/components/screens/ConsentScreen';
import InviteScreen from '../../src/components/screens/InviteScreen';
import { AuthProvider } from '../../src/context/AuthContext';
import { AppProvider } from '../../src/context/AppContext';

describe('Phase 3 Screens: Auth, Consent, and Family Invitation', () => {
  it('renders LoginScreen with welcome header and demo bypass button', () => {
    render(
      <AuthProvider>
        <AppProvider>
          <LoginScreen />
        </AppProvider>
      </AuthProvider>
    );

    expect(screen.getByText('CareBox')).toBeInTheDocument();
    expect(screen.getByText('Family Medicine Companion')).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText(/Continue as Demo User/i)).toBeInTheDocument();
  });

  it('renders ConsentScreen with DPDP Act checkboxes and disables continue until all checked', () => {
    render(
      <AuthProvider>
        <AppProvider>
          <ConsentScreen />
        </AppProvider>
      </AuthProvider>
    );

    expect(screen.getByText('Privacy First')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Medicine Data Processing')).toBeInTheDocument();

    const continueButton = screen.getByRole('button', { name: /Continue to CareBox/i });
    expect(continueButton).toBeDisabled();

    // Check "Accept all three"
    const acceptAllBtn = screen.getByRole('button', { name: /Accept all three/i });
    fireEvent.click(acceptAllBtn);

    expect(continueButton).not.toBeDisabled();
  });

  it('renders InviteScreen with current members and invite form', () => {
    render(
      <AuthProvider>
        <AppProvider>
          <InviteScreen />
        </AppProvider>
      </AuthProvider>
    );

    expect(screen.getByText('Family Circle')).toBeInTheDocument();
    expect(screen.getByText('Current Members')).toBeInTheDocument();
    expect(screen.getByText('Invite Someone')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('family@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Invitation/i })).toBeInTheDocument();
  });

  it('handles sending invitation in InviteScreen', async () => {
    render(
      <AuthProvider>
        <AppProvider>
          <InviteScreen />
        </AppProvider>
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText('family@example.com');
    fireEvent.change(emailInput, { target: { value: 'priya.kadam@example.com' } });

    const submitBtn = screen.getByRole('button', { name: /Send Invitation/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Invitation sent!')).toBeInTheDocument();
  });
});
