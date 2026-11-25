/**
 * Creates the empty session storage required by KLighD during server-side capture.
 */
export function createSessionStorage(): Storage {
  return {
    get length() {
      return 0;
    },
    clear() {},
    getItem() {
      return null;
    },
    key() {
      return null;
    },
    removeItem() {},
    setItem() {},
  };
}
