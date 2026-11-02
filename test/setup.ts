import { afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register({ url: "https://www.medialane.io/" });

// Bun does not run Testing Library's automatic cleanup. Unmount after every test so nothing
// rendered in one file re-renders after that file's module mocks have handed back.
const { cleanup } = await import("@testing-library/react");
afterEach(() => cleanup());
