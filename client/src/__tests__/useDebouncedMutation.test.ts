import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { mock } from 'node:test';
import { useDebouncedMutation, type SaveOptions } from '../hooks/useDebouncedMutation';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type EventCallback = () => void;

class MockElement {
  nodeType = 1;
  tagName: string;
  nodeName: string;
  ownerDocument: unknown;
  style: Record<string, string> = {};
  children: unknown[] = [];
  constructor(tag = 'DIV', doc?: unknown) {
    this.tagName = tag;
    this.nodeName = tag;
    this.ownerDocument = doc;
  }
  appendChild<T>(c: T): T { this.children.push(c); return c; }
  removeChild<T>(c: T): T { return c; }
  insertBefore<T>(c: T): T { this.children.push(c); return c; }
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
  removeAttribute() {}
  contains() { return true; }
}

const eventListeners = new Map<string, Set<EventCallback>>();

interface MockDoc {
  nodeType: number;
  createElement: (t: string) => MockElement;
  createTextNode: () => { nodeType: number; nodeName: string };
  addEventListener: () => void;
  removeEventListener: () => void;
  activeElement: null;
  body: null;
  visibilityState: string;
  documentElement?: MockElement;
}

const mockDoc: MockDoc = {
  nodeType: 9,
  createElement: (t: string) => new MockElement(t.toUpperCase(), mockDoc),
  createTextNode: () => ({ nodeType: 3, nodeName: '#text' }),
  addEventListener() {},
  removeEventListener() {},
  activeElement: null,
  body: null,
  visibilityState: 'visible',
};
mockDoc.documentElement = new MockElement('HTML', mockDoc);

interface MockWindow {
  document: MockDoc;
  HTMLIFrameElement: new () => void;
  addEventListener: (event: string, fn: EventCallback) => void;
  removeEventListener: (event: string, fn: EventCallback) => void;
  dispatchEvent: (event: string) => void;
  setTimeout: Window['setTimeout'];
  clearTimeout: Window['clearTimeout'];
}

const mockWindow: MockWindow = {
  document: mockDoc,
  HTMLIFrameElement: class {},
  addEventListener(event: string, fn: EventCallback) {
    if (!eventListeners.has(event)) eventListeners.set(event, new Set());
    eventListeners.get(event)!.add(fn);
  },
  removeEventListener(event: string, fn: EventCallback) {
    eventListeners.get(event)?.delete(fn);
  },
  dispatchEvent(event: string) {
    eventListeners.get(event)?.forEach((fn) => fn());
  },
  setTimeout: ((...args: Parameters<Window['setTimeout']>) =>
    globalThis.setTimeout(...(args as [TimerHandler, number?]))) as unknown as Window['setTimeout'],
  clearTimeout: ((...args: Parameters<Window['clearTimeout']>) =>
    globalThis.clearTimeout(...(args as [number?]))) as unknown as Window['clearTimeout'],
};

const g = globalThis as unknown as { document: MockDoc; window: MockWindow };
g.document = mockDoc;
g.window = mockWindow;

function renderHook<T extends object>(
  saveFn: (val: T, opts?: SaveOptions) => Promise<unknown>,
  delay = 500,
) {
  let result!: ReturnType<typeof useDebouncedMutation<T>>;
  function Component({ save }: { save: typeof saveFn }) {
    result = useDebouncedMutation(save, delay);
    return null;
  }

  const container = new MockElement('DIV', mockDoc) as unknown as Element;
  const root = createRoot(container);
  act(() => {
    root.render(createElement(Component, { save: saveFn }));
  });

  return {
    get current() {
      return result;
    },
    rerender(newSave: typeof saveFn) {
      act(() => {
        root.render(createElement(Component, { save: newSave }));
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe('useDebouncedMutation', () => {
  afterEach(() => {
    mock.timers.reset();
    eventListeners.clear();
  });

  it('one save at a time', async () => {
    const calls: Array<{ value: { item: string }; opts?: SaveOptions }> = [];
    let resolveFirst!: () => void;
    const firstPromise = new Promise<void>((r) => { resolveFirst = r; });

    let isFirst = true;
    const saveFn = (val: { item: string }, opts?: SaveOptions) => {
      calls.push({ value: val, opts });
      if (isFirst) {
        isFirst = false;
        return firstPromise;
      }
      return Promise.resolve();
    };

    const hook = renderHook(saveFn, 300);

    mock.timers.enable({ apis: ['setTimeout'] });

    // Trigger first save
    act(() => { hook.current.run({ item: 'first' }); });
    act(() => { mock.timers.tick(300); });

    // First save is now in flight
    assert.equal(calls.length, 1);
    assert.equal(calls[0].value.item, 'first');
    assert.equal(hook.current.status, 'saving');

    // While first save is in flight, trigger second save
    act(() => { hook.current.run({ item: 'second' }); });
    act(() => { mock.timers.tick(300); });

    // Second save should NOT have started yet because first save is in flight
    assert.equal(calls.length, 1);

    mock.timers.reset();

    // Now complete the first save
    await act(async () => {
      resolveFirst();
      await Promise.resolve();
    });

    // Once the first save completed, second save was automatically flushed
    assert.equal(calls.length, 2);
    assert.equal(calls[1].value.item, 'second');
    assert.equal(hook.current.status, 'saved');
  });

  it('latest value sent last', async () => {
    const saved: string[] = [];
    const saveFn = async (val: { text: string }) => {
      saved.push(val.text);
    };

    const hook = renderHook(saveFn, 400);

    mock.timers.enable({ apis: ['setTimeout'] });

    // Rapid successive runs: only the latest should be sent
    act(() => { hook.current.run({ text: 'v1' }); });
    act(() => { mock.timers.tick(100); });
    act(() => { hook.current.run({ text: 'v2' }); });
    act(() => { mock.timers.tick(100); });
    act(() => { hook.current.run({ text: 'v3' }); });

    // Let the full debounce delay expire for v3
    act(() => { mock.timers.tick(400); });

    mock.timers.reset();

    await act(async () => {
      await Promise.resolve();
    });

    assert.deepEqual(saved, ['v3'], 'Only latest value v3 should have been saved');
    assert.equal(hook.current.status, 'saved');
  });

  it('a failed save reports error and retry works', async () => {
    let shouldFail = true;
    const attempts: string[] = [];

    const saveFn = async (val: { count: number }) => {
      attempts.push(`try-${val.count}`);
      if (shouldFail) {
        throw new Error('Save failed');
      }
    };

    const hook = renderHook(saveFn, 200);

    mock.timers.enable({ apis: ['setTimeout'] });

    act(() => { hook.current.run({ count: 42 }); });
    act(() => { mock.timers.tick(200); });

    mock.timers.reset();

    await act(async () => {
      await Promise.resolve();
    });

    assert.equal(hook.current.status, 'error');
    assert.deepEqual(attempts, ['try-42']);

    // Now fix the failure and call retry()
    shouldFail = false;
    await act(async () => {
      hook.current.retry();
      await Promise.resolve();
    });

    assert.equal(hook.current.status, 'saved');
    assert.deepEqual(attempts, ['try-42', 'try-42'], 'Retry should send the failed value again');
  });

  it('a page-hide flush sends the pending value even while a save is in flight', async () => {
    const calls: Array<{ value: { title: string }; opts?: SaveOptions }> = [];
    let resolveFirst!: () => void;
    const firstPromise = new Promise<void>((r) => { resolveFirst = r; });

    let isFirst = true;
    const saveFn = (val: { title: string }, opts?: SaveOptions) => {
      calls.push({ value: val, opts });
      if (isFirst) {
        isFirst = false;
        return firstPromise;
      }
      return Promise.resolve();
    };

    const hook = renderHook(saveFn, 500);

    mock.timers.enable({ apis: ['setTimeout'] });

    // Start first save
    act(() => { hook.current.run({ title: 'doc-1' }); });
    act(() => { mock.timers.tick(500); });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].value.title, 'doc-1');
    assert.equal(hook.current.status, 'saving');

    // Queue pending change while doc-1 is in flight
    act(() => { hook.current.run({ title: 'doc-2' }); });

    // Simulate page-hide event while save 1 is still in flight
    act(() => {
      mockWindow.dispatchEvent('pagehide');
    });

    // Page-hide flush must send doc-2 with keepalive: true immediately even though save 1 is in flight
    assert.equal(calls.length, 2, 'Pending value must be sent on page-hide even while another save is in flight');
    assert.equal(calls[1].value.title, 'doc-2');
    assert.equal(calls[1].opts?.keepalive, true, 'Page-hide flush must use keepalive');

    mock.timers.reset();

    await act(async () => {
      resolveFirst();
      await Promise.resolve();
    });
  });
});
