import { afterEach, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();

import { cleanup, render } from "@testing-library/react";
import { QuickAction } from "./quick-action";

afterEach(() => cleanup());

test("Send, Receive, Launch, and Activity each render a distinct action color", () => {
  const { getByText } = render(
    <>
      <QuickAction label="Send" action="buy" icon={<span />} onClick={() => {}} />
      <QuickAction label="Receive" action="offer" icon={<span />} onClick={() => {}} />
      <QuickAction label="Launch" action="remix" icon={<span />} onClick={() => {}} />
      <QuickAction label="Activity" action="submit" icon={<span />} onClick={() => {}} />
    </>
  );
  const grads = ["Send", "Receive", "Launch", "Activity"].map((label) => {
    const button = getByText(label).closest("button")!;
    return (button.querySelector("span") as HTMLElement).style.getPropertyValue("--ml-grad");
  });
  expect(new Set(grads).size).toBe(4);
});
