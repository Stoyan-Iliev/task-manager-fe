import { createContext, useMemo, useState, type ReactNode, useEffect } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";

type ThemeMode = "light" | "dark";

interface ThemeContextProps {
  mode: ThemeMode;
  toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ThemeContextProps>({
  mode: "light",
  toggleColorMode: () => {},
});

export default function CustomThemeProvider({ children }: { children: ReactNode }) {
  // Initialize mode from localStorage or default to light
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem("themeMode");
    return (savedMode === "light" || savedMode === "dark") ? savedMode : "light";
  });

  // Save mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
}