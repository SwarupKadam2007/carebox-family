import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SetupErrorScreen } from './components/layout/SetupErrorScreen';
import { ENV, IS_SUPABASE_CONFIGURED } from './lib/env';

export const App: React.FC = () => {
  // In production builds, never silently fake data if Supabase keys are missing
  if (ENV.IS_PRODUCTION && !IS_SUPABASE_CONFIGURED) {
    return <SetupErrorScreen />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
