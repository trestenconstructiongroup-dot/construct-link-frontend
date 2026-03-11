/**
 * Centralized auth event handlers.
 * Used by the API layer to trigger logout on 401 without circular imports.
 */

type OnUnauthorizedCallback = () => void | Promise<void>;

let onUnauthorizedCallback: OnUnauthorizedCallback | null = null;

export function setOnUnauthorized(callback: OnUnauthorizedCallback | null): void {
  onUnauthorizedCallback = callback;
}

export function triggerUnauthorized(): void {
  if (onUnauthorizedCallback) {
    void Promise.resolve(onUnauthorizedCallback());
  }
}
