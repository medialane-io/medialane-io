import { afterEach, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();

import { cleanup, render } from "@testing-library/react";
import { QuickAction } from "./quick-action";

afterEach(() => cleanup());

test("Send, Receive, and Activity all render the same vault gradient", () => {
  const { getByText } = render(
    <>
      <QuickAction label="Send" action="vault" icon={<span />} onClick={() => {}} />
      <QuickAction label="Receive" action="vault" icon={<span />} onClick={() => {}} />
      <QuickAction label="Activity" action="vault" icon={<span />} onClick={() => {}} />
    </>
  );
  const icons = ["Send", "Receive", "Activity"].map((label) => {
    const button = getByText(label).closest("button")!;
    return (button.querySelector("span") as HTMLElement).style.getPropertyValue("--ml-grad");
  });
  expect(icons[0]).toBe(icons[1]);
  expect(icons[1]).toBe(icons[2]);
});
