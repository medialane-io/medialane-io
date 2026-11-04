import { afterEach, expect, mock, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MedialaneApiError } from "@medialane/sdk";
import { mockForThisFile } from "../../../test/mock-for-this-file";

let finish: () => void = () => {};
let fail: (err: unknown) => void = () => {};
const signOutOtherDevices = mock(
  () =>
    new Promise<void>((resolve, reject) => {
      finish = resolve;
      fail = reject;
    }),
);
await mockForThisFile("@/lib/medialane-client", {
  getMedialaneClient: () => ({ api: { account: { signOutOtherDevices } } }) as never,
});
const { SignOutOtherDevices } = await import("./sign-out-other-devices");

afterEach(() => signOutOtherDevices.mockClear());

const button = () => screen.getByRole("button", { name: "Sign out other devices" });

test("signs out other devices once and shows that it is done", async () => {
  render(<SignOutOtherDevices />);
  fireEvent.click(button());
  expect(signOutOtherDevices).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(button()).toHaveProperty("disabled", true));
  fireEvent.click(button());
  expect(signOutOtherDevices).toHaveBeenCalledTimes(1);
  finish();
  expect(await screen.findByText("Other devices are signed out.")).toBeTruthy();
});

test("shows the error and lets you try again", async () => {
  render(<SignOutOtherDevices />);
  fireEvent.click(button());
  const body = { error: "Sign in again to make this change", code: "sign_in_again" };
  fail(new MedialaneApiError(403, body.error, undefined, body, "/v1/users/me/sign-out-other-devices", body.code));
  expect(await screen.findByText("Sign in again to make this change")).toBeTruthy();
  expect(button()).toHaveProperty("disabled", false);
});

test("explains that a device with a key can still sign in", () => {
  render(<SignOutOtherDevices />);
  expect(screen.getByText("Devices listed above can still sign in with their key. Remove a device to stop that.")).toBeTruthy();
});
