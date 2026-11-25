import { JSDOM } from "jsdom";

export interface SandboxedDom {
  dom: JSDOM;
  document: Document;
}

/**
 * Runs a callable with a temporary browser-like DOM installed on the Node global object.
 */
export async function withSandboxedDom<T>(
  callable: (sandbox: SandboxedDom) => T | Promise<T>,
): Promise<T> {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true,
  });
  const globals = globalThis as unknown as Record<string, unknown>;
  const originalGlobals = replaceGlobals(globals, {
    window: dom.window,
    document: dom.window.document,
    Element: dom.window.Element,
    HTMLElement: dom.window.HTMLElement,
    SVGElement: dom.window.SVGElement,
    Node: dom.window.Node,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    KeyboardEvent: dom.window.KeyboardEvent,
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
  });

  try {
    return await callable({ dom, document: dom.window.document });
  } finally {
    Object.assign(globals, originalGlobals);
    dom.window.close();
  }
}

function replaceGlobals(
  globals: Record<string, unknown>,
  replacements: Record<string, unknown>,
): Record<string, unknown> {
  const originals = Object.fromEntries(
    Object.keys(replacements).map((key) => [key, globals[key]]),
  );
  Object.assign(globals, replacements);
  return originals;
}
