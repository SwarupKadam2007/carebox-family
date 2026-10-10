import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '../../src/context/AppContext';
import { TodayScreen } from '../../src/components/screens/TodayScreen';
import { HistoryScreen } from '../../src/components/screens/HistoryScreen';
import { RefillsScreen } from '../../src/components/screens/RefillsScreen';
import { PrivacyDignityScreen } from '../../src/components/screens/PrivacyDignityScreen';
import { SimulatorScreen } from '../../src/components/screens/SimulatorScreen';

describe('CareBox Family Component Tests', () => {
  it('renders TodayScreen with greeting, dose cards, and this week row', () => {
    render(
      <AppProvider>
        <TodayScreen />
      </AppProvider>
    );

    expect(screen.getByText(/Mom's medicines today/i)).toBeInTheDocument();
    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.getByText('Afternoon')).toBeInTheDocument();
    expect(screen.getByText('Night')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
  });

  it('renders RefillsScreen with medication list and pharmacy button', () => {
    render(
      <AppProvider>
        <RefillsScreen />
      </AppProvider>
    );

    expect(screen.getByText('Metformin 500mg')).toBeInTheDocument();
    expect(screen.getByText('Atorvastatin 10mg')).toBeInTheDocument();
    expect(screen.getByText(/Remind me to order/i)).toBeInTheDocument();
    expect(screen.getByText(/Order from pharmacy/i)).toBeInTheDocument();
  });

  it('renders HistoryScreen with weekly/monthly toggle and insight card', () => {
    render(
      <AppProvider>
        <HistoryScreen />
      </AppProvider>
    );

    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText(/12 of 14 doses this week/i)).toBeInTheDocument();
    expect(screen.getByText(/Share with doctor/i)).toBeInTheDocument();
  });

  it('renders PrivacyDignityScreen with sharing toggles and family members', () => {
    render(
      <AppProvider>
        <PrivacyDignityScreen />
      </AppProvider>
    );

    expect(screen.getByText(/Show status only \(no location\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Gentle reminders only/i)).toBeInTheDocument();
    expect(screen.getByText(/Parent can pause sharing/i)).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Sneha')).toBeInTheDocument();
    expect(screen.getByText('Dad')).toBeInTheDocument();
  });

  it('renders CareBox Simulator with 3 compartments and one big button', () => {
    render(
      <AppProvider>
        <SimulatorScreen />
      </AppProvider>
    );

    expect(screen.getByText(/CareBox Hardware Simulator/i)).toBeInTheDocument();
    expect(screen.getAllByText(/morning/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/afternoon/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/press/i).length).toBeGreaterThan(0);
  });
});
