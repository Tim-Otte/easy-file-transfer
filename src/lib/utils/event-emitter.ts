/**
 * A generic event emitter class that allows subscribing to, unsubscribing from,
 * and emitting typed events.
 *
 * @typeParam T - An interface mapping event names to their handler signatures.
 */
export class EventEmitter<T extends { [K in keyof T]: (...args: Parameters<T[K]>) => void }> {
    /**
     * Stores arrays of event handler functions for each event type.
     */
    private eventHandlers: { [K in keyof T]: T[K][] } = {} as { [K in keyof T]: T[K][] };

    /**
     * Registers an event handler for a specific event.
     *
     * @param event - The event name to listen for.
     * @param callback - The handler function to call when the event is emitted.
     */
    on<K extends keyof T>(event: K, callback: T[K]): void {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }

        this.eventHandlers[event].push(callback);
    }

    /**
     * Unregisters a previously registered event handler for a specific event.
     *
     * @param event - The event name to remove the handler from.
     * @param callback - The handler function to remove.
     */
    off<K extends keyof T>(event: K, callback: T[K]): void {
        const handlers = this.eventHandlers[event];
        const index = handlers.indexOf(callback);
        if (index !== -1) {
            handlers.splice(index, 1);
        }
    }

    /**
     * Emits an event, calling all registered handlers for that event with the provided arguments.
     *
     * @param event - The event name to emit.
     * @param args - The arguments to pass to the event handlers.
     */
    protected emit<K extends keyof T>(event: K, ...args: Parameters<T[K]> extends infer P
        ? P extends [...unknown[]]
        ? P
        : never
        : never): void {

        if (!this.eventHandlers[event]) {
            return;
        }

        for (const fn of this.eventHandlers[event]) {
            (fn as (...a: typeof args) => void)(...args);
        }
    }
}