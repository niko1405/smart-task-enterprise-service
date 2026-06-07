type Handler = (payload: unknown) => void;

// Minimal stand-in for a socket.io-client Socket used to drive the real-time
// hook logic in tests.
export class FakeSocket {
  private handlers = new Map<string, Set<Handler>>();
  public emitted: Array<{ event: string; payload: unknown }> = [];

  on(event: string, handler: Handler): this {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler);
    this.handlers.set(event, set);
    return this;
  }

  off(event: string, handler: Handler): this {
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  emit(event: string, payload: unknown): this {
    this.emitted.push({ event, payload });
    return this;
  }

  // Test helper: simulate a server-pushed event.
  trigger(event: string, payload: unknown): void {
    this.handlers.get(event)?.forEach((h) => h(payload));
  }
}
