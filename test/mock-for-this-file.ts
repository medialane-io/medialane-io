import { afterAll, beforeAll, mock } from "bun:test";

type Exports = Record<string, unknown>;

/**
 * Returns `real` with each key of `fakes` replaced by a stand-in that uses the fake while
 * `isActive()` is true and the real export otherwise. A fake must be a function or an object of
 * the same kind as the real export (a function cannot stand in for a forwardRef component), since
 * the stand-in hands calls or property reads to whichever is current.
 */
export function gateExports<T extends Exports>(real: T, fakes: Partial<T>, isActive: () => boolean): T {
  const gated: Exports = { ...real };
  for (const key of Object.keys(fakes)) {
    const current = () => (isActive() ? fakes : real)[key];
    const fake = fakes[key];
    const original = real[key];
    if (original !== undefined && typeof original !== typeof fake) {
      throw new Error(`gateExports: "${key}" is a ${typeof original} in the real module; replace it with a ${typeof original}`);
    }
    if (typeof fake === "function") {
      gated[key] = (...args: unknown[]) => (current() as (...a: unknown[]) => unknown)(...args);
    } else if (fake !== null && typeof fake === "object") {
      gated[key] = new Proxy({}, {
        get: (_target, prop) => {
          const source = current() as object;
          const value = Reflect.get(source, prop, source);
          return typeof value === "function" ? value.bind(source) : value;
        },
        has: (_target, prop) => Reflect.has(current() as object, prop),
        ownKeys: () => Reflect.ownKeys(current() as object),
        getOwnPropertyDescriptor: (_target, prop) => {
          const descriptor = Reflect.getOwnPropertyDescriptor(current() as object, prop);
          return descriptor && { ...descriptor, configurable: true };
        },
      });
    } else {
      throw new Error(`gateExports: "${key}" must be a function or an object to be replaced`);
    }
  }
  return gated as T;
}

/**
 * Replaces exports of `specifier` for the tests of the calling file only.
 *
 * Bun keeps a module mock for the rest of the run, so a plain mock.module leaks into every
 * test file that runs later. Here each replaced export uses the fake while this file's
 * tests run and the real export before and after. Returns a copy of the real module.
 * Use the "@/..." form: a relative path would resolve against this helper.
 */
export async function mockForThisFile<T extends Exports>(
  specifier: string,
  fakes: Partial<T> | ((real: T) => Partial<T>),
): Promise<T> {
  if (specifier.startsWith(".")) throw new Error(`mockForThisFile: use the "@/..." form for ${specifier}`);
  const real = { ...(await import(specifier)) } as T;
  let active = false;
  beforeAll(() => { active = true; });
  afterAll(() => { active = false; });
  const gated = gateExports(real, typeof fakes === "function" ? fakes(real) : fakes, () => active);
  mock.module(specifier, () => gated);
  return real;
}
