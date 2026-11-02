import { expect, test } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useWhenChanged } from "./use-when-changed";

test("runs once on mount", () => {
  let runs = 0;
  renderHook(() => useWhenChanged("a", () => { runs++; }));
  expect(runs).toBe(1);
});

test("runs again only when the value changes", () => {
  let runs = 0;
  const { rerender } = renderHook(({ value }) => useWhenChanged(value, () => { runs++; }), {
    initialProps: { value: "a" },
  });
  rerender({ value: "a" });
  expect(runs).toBe(1);
  rerender({ value: "b" });
  expect(runs).toBe(2);
});

test("calls the latest effect", () => {
  const seen: string[] = [];
  const { rerender } = renderHook(
    ({ value, label }) => useWhenChanged(value, () => { seen.push(label); }),
    { initialProps: { value: 1, label: "first" } },
  );
  rerender({ value: 2, label: "second" });
  expect(seen).toEqual(["first", "second"]);
});
