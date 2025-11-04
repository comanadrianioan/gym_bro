import React from 'react';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { AuthProvider } from '../context/AuthProvider';

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // Could read theme from settings later; default system handled by Paper
  const theme = MD3LightTheme;
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>{children}</AuthProvider>
    </PaperProvider>
  );
};


