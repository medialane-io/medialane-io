import { describe, expect, test } from "bun:test";
import {
  buildSetFirstGuardianCall,
  buildTriggerEscapeOwnerCall,
  buildCompleteEscapeOwnerCall,
  buildCancelEscapeCall,
} from "@medialane/sdk/starknet";

// The calldata-encoding behavior itself is covered upstream by
// @medialane/sdk's own guardian.test.ts — this file only proves io's
// migration wired the SDK module in correctly, without re-mocking
// "./sponsored-invoke" (that's sponsored-invoke.test.ts's job; mock.module
// on a shared module leaks across test files in the same bun test run and
// broke that file's own tests when tried here).
describe("io guardian module", () => {
  test("re-exports the SDK's guardian calldata builders unchanged", async () => {
    const guardian = await import("./guardian");
    expect(guardian.buildSetFirstGuardianCall).toBe(buildSetFirstGuardianCall);
    expect(guardian.buildTriggerEscapeOwnerCall).toBe(buildTriggerEscapeOwnerCall);
    expect(guardian.buildCompleteEscapeOwnerCall).toBe(buildCompleteEscapeOwnerCall);
    expect(guardian.buildCancelEscapeCall).toBe(buildCancelEscapeCall);
  });

  test("exposes the AVNU-sponsored execution wrappers", async () => {
    const guardian = await import("./guardian");
    expect(typeof guardian.setFirstGuardian).toBe("function");
    expect(typeof guardian.triggerEscapeOwner).toBe("function");
    expect(typeof guardian.completeEscapeOwner).toBe("function");
    expect(typeof guardian.cancelEscape).toBe("function");
    expect(typeof guardian.getGuardians).toBe("function");
    expect(typeof guardian.getEscape).toBe("function");
    expect(typeof guardian.getEscapeSecurityPeriod).toBe("function");
  });
});
