import { expect, test } from "bun:test";
import { gateExports } from "./mock-for-this-file";

const real = {
  greet: (name: string) => `hello ${name}`,
  wallet: { label: "real", describe() { return `wallet ${this.label}`; } },
  untouched: () => "same",
};

test("replaced functions call the fake while active and the real one otherwise", () => {
  let active = true;
  const gated = gateExports(real, { greet: (name: string) => `fake ${name}` }, () => active);
  expect(gated.greet("ana")).toBe("fake ana");
  active = false;
  expect(gated.greet("ana")).toBe("hello ana");
});

test("replaced objects read from the fake while active and the real one otherwise, keeping `this`", () => {
  let active = true;
  const fakeWallet = { label: "fake", describe() { return `wallet ${this.label}`; } };
  const gated = gateExports(real, { wallet: fakeWallet }, () => active);
  expect(gated.wallet.describe()).toBe("wallet fake");
  active = false;
  expect(gated.wallet.label).toBe("real");
  expect(gated.wallet.describe()).toBe("wallet real");
});

test("exports that are not replaced stay the real ones", () => {
  const gated = gateExports(real, { greet: () => "fake" }, () => true);
  expect(gated.untouched).toBe(real.untouched);
});

test("a fake read at call time sees later changes to the test's own state", () => {
  let reply = "first";
  const gated = gateExports(real, { greet: () => reply }, () => true);
  reply = "second";
  expect(gated.greet("x")).toBe("second");
});

test("primitive replacements are refused, since they cannot hand back to the real value", () => {
  expect(() => gateExports({ LIMIT: 1 }, { LIMIT: 2 }, () => true)).toThrow("LIMIT");
});

test("a fake of another kind than the real export is refused, since it could not hand back", () => {
  const component = { $$typeof: Symbol.for("react.forward_ref"), render: () => null };
  expect(() => gateExports({ default: component }, { default: () => null }, () => true)).toThrow("default");
});
