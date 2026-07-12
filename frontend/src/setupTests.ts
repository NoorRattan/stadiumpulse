import "@testing-library/jest-dom/vitest";
import "vitest-axe/extend-expect";

Element.prototype.scrollIntoView = vi.fn();

class MockResizeObserver implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

globalThis.ResizeObserver = MockResizeObserver;

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const supabaseQuery = {
  select: vi.fn(() => supabaseQuery),
  order: vi.fn(() => supabaseQuery),
  limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
};

vi.mock("@/services/supabaseConfig", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInAnonymously: vi.fn(),
      signInWithOAuth: vi.fn(() => Promise.resolve({ error: null })),
      signInWithPassword: vi.fn(() => Promise.resolve({ error: null })),
      signUp: vi.fn(() =>
        Promise.resolve({ data: { session: null }, error: null }),
      ),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    from: vi.fn(() => supabaseQuery),
    removeChannel: vi.fn(() => Promise.resolve({ error: null })),
  },
}));
