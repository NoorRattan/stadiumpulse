import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AppRouter } from "./router";

/** Top-level provider composition for StadiumPulse. */
export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AccessibilityProvider>
          <AppRouter />
        </AccessibilityProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
