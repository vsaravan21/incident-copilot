/** Hobby Fluid Compute allows 300s. Investigations use multiple Fireworks tool rounds. */
export const ASSISTANT_MAX_DURATION_SECONDS = 300;
export const ASSISTANT_CLIENT_TIMEOUT_MS =
  (ASSISTANT_MAX_DURATION_SECONDS - 10) * 1000;
