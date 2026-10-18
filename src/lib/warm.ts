type Nav = { connection?: { saveData?: boolean } }

/** Start the light loads always and the heavy ones (the globe's 218 KB) only when the guest hasn't asked to save data. */
export function warm(nav: object, light: (() => unknown)[], heavy: (() => unknown)[]) {
  light.forEach((f) => f())
  if (!(nav as Nav).connection?.saveData) heavy.forEach((f) => f())
}
