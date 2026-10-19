import { expect, test } from "bun:test";
import { MedialaneApiError } from "@medialane/sdk";
import { rawErrorOf, uploadDiagnosticsOf } from "./mint-intent-actions";

test("the raw error keeps the HTTP status, message and cause", () => {
  expect(rawErrorOf(new MedialaneApiError(502, "Service unavailable", undefined, {}))).toContain("HTTP 502");
  const wrapped = Object.assign(new Error("We couldn't upload your file."), { cause: new TypeError("Load failed") });
  expect(rawErrorOf(wrapped)).toBe("Error: We couldn't upload your file. | cause TypeError: Load failed");
});

test("the upload diagnostics on an error are read for the debug snapshot", () => {
  const diagnostics = { fileReadable: "ok", uploadHostReachable: "ok", retry: "TypeError: Failed to fetch" };
  expect(uploadDiagnosticsOf(Object.assign(new Error("upload failed"), { diagnostics }))).toEqual(diagnostics as never);
  expect(uploadDiagnosticsOf(new Error("other"))).toBeUndefined();
  expect(uploadDiagnosticsOf("text")).toBeUndefined();
});
