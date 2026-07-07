import { useAuth } from "../hooks/useAuth";

/** Placeholder: replaced in Session 6. */
export default function LoginPage(): JSX.Element {
  const { signInGuest } = useAuth();

  return (
    <main className="mx-auto max-w-md px-6 py-10" id="main-content">
      <h1 className="font-display text-4xl text-text-primary">Sign In</h1>
      <button
        className="mt-6 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        type="button"
        onClick={() => void signInGuest()}
      >
        Continue as guest
      </button>
    </main>
  );
}
