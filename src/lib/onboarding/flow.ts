export type OnboardingStep =
  | "email"
  | "checking-email"
  | "registering"
  | "code"
  | "verifying-code"
  | "link-device"
  | "creating-passkey"
  | "deploying"
  | "signing-in"
  | "done";

export interface FlowState {
  step: OnboardingStep;
  error: string | null;
  canRetry: boolean;
  accountExisted: boolean;
  keySetupAddress: string | null;
}

export type FlowEvent =
  | { type: "email-submitted" }
  | { type: "account-found"; exists: boolean }
  | { type: "registering" }
  | { type: "code-sent" }
  | { type: "email-step-failed"; message: string }
  | { type: "code-submitted" }
  | { type: "code-failed"; message: string | null }
  | { type: "wallet-setup-started" }
  | { type: "key-setup-started"; address: string }
  | { type: "wallet-progress"; step: "creating-passkey" | "deploying" | "signing-in" }
  | { type: "wallet-failed"; message: string; canRetry: boolean }
  | { type: "key-setup-finished" }
  | { type: "link-required" }
  | { type: "device-not-linked" }
  | { type: "finished" };

export const initialFlow = (start: "email" | "wallet"): FlowState => ({
  step: start === "wallet" ? "creating-passkey" : "email",
  error: null,
  canRetry: true,
  accountExisted: false,
  keySetupAddress: null,
});

export function flowReducer(state: FlowState, event: FlowEvent): FlowState {
  switch (event.type) {
    case "email-submitted":
      return { ...state, step: "checking-email", error: null };
    case "account-found":
      return { ...state, accountExisted: event.exists };
    case "registering":
      return { ...state, step: "registering" };
    case "code-sent":
      return { ...state, step: "code", error: null };
    case "email-step-failed":
      return { ...state, step: "email", error: event.message };
    case "code-submitted":
      return { ...state, step: "verifying-code", error: null };
    case "code-failed":
      return { ...state, step: "code", error: event.message };
    case "wallet-setup-started":
      return { ...state, step: "creating-passkey", error: null, canRetry: true };
    case "key-setup-started":
      return { ...state, step: "creating-passkey", error: null, canRetry: true, keySetupAddress: event.address };
    case "wallet-progress":
      return { ...state, step: event.step };
    case "wallet-failed":
      return { ...state, step: "creating-passkey", error: event.message, canRetry: event.canRetry };
    case "key-setup-finished":
      return { ...state, keySetupAddress: null };
    case "link-required":
      return { ...state, step: "email" };
    case "device-not-linked":
      return { ...state, step: "link-device", error: null };
    case "finished":
      return { ...state, step: "done" };
  }
}

export const retryTarget = (
  state: FlowState,
): { type: "key-setup"; walletAddress: string } | { type: "wallet-setup" } =>
  state.keySetupAddress ? { type: "key-setup", walletAddress: state.keySetupAddress } : { type: "wallet-setup" };
