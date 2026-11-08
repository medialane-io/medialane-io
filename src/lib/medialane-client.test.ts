import { expect, test } from "bun:test";
import { medialaneConfig } from "./medialane-client";

test("io's purchases carry the platform fee", () => {
  expect(medialaneConfig().feeConfig).toEqual({ enabled: true });
});
