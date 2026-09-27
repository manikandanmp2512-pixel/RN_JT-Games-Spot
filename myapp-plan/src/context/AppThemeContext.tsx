import React, {
  createContext,
  useContext,
  useState,
} from "react";

type AppThemeContextType = {
  isDark: boolean;

  toggleTheme: () => void;
};

const AppThemeContext =
  createContext<
    AppThemeContextType | undefined
  >(undefined);

export function AppThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [
    isDark,
    setIsDark,
  ] = useState(false);

  const toggleTheme = () => {

    setIsDark(
      (previous) => !previous
    );
  };

  return (
    <AppThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
      }}
    >
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {

  const context =
    useContext(
      AppThemeContext
    );

  if (!context) {

    throw new Error(
      "useAppTheme must be used inside AppThemeProvider"
    );
  }

  return context;
}