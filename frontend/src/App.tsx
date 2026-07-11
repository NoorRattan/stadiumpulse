import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppRouter } from "./router";

/** Top-level provider composition for StadiumPulse. */
export default function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <AccessibilityProvider>
            <AppRouter />
          </AccessibilityProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
