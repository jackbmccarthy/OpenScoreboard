const root = globalThis as Record<string, any>;

if (!root.globalThis) {
    root.globalThis = root;
}

if (!root.structuredClone) {
    root.structuredClone = <T>(value: T): T => {
        if (value === undefined || value === null) {
            return value;
        }

        return JSON.parse(JSON.stringify(value));
    };
}

if (!Object.hasOwn) {
    Object.defineProperty(Object, 'hasOwn', {
        configurable: true,
        value: (object: object, property: PropertyKey) => Object.prototype.hasOwnProperty.call(object, property),
    });
}

if (!Math.trunc) {
    Math.trunc = (value: number) => (value < 0 ? Math.ceil(value) : Math.floor(value));
}

if (!Array.prototype.at) {
    Object.defineProperty(Array.prototype, 'at', {
        configurable: true,
        value(index: number) {
            const normalizedIndex = Math.trunc(index) || 0;
            const targetIndex = normalizedIndex < 0 ? this.length + normalizedIndex : normalizedIndex;

            return this[targetIndex];
        },
    });
}

if (!String.prototype.at) {
    Object.defineProperty(String.prototype, 'at', {
        configurable: true,
        value(index: number) {
            const normalizedIndex = Math.trunc(index) || 0;
            const targetIndex = normalizedIndex < 0 ? this.length + normalizedIndex : normalizedIndex;

            return this.charAt(targetIndex);
        },
    });
}

if (!String.prototype.replaceAll) {
    Object.defineProperty(String.prototype, 'replaceAll', {
        configurable: true,
        value(searchValue: string | RegExp, replaceValue: string) {
            if (searchValue instanceof RegExp) {
                return this.replace(searchValue, replaceValue);
            }

            if (searchValue === '') {
                return this.split('').join(replaceValue);
            }

            return this.split(searchValue).join(replaceValue);
        },
    });
}

if (!Promise.allSettled) {
    Promise.allSettled = (promises: Iterable<unknown>) => Promise.all(
        Array.from(promises).map(promise => Promise.resolve(promise)
            .then(value => ({ status: 'fulfilled', value }))
            .catch(reason => ({ status: 'rejected', reason }))),
    ) as Promise<PromiseSettledResult<unknown>[]>;
}

if (!root.queueMicrotask) {
    root.queueMicrotask = (callback: () => void) => Promise.resolve().then(callback);
}

if (!root.requestIdleCallback) {
    root.requestIdleCallback = (callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void) => {
        const start = Date.now();

        return window.setTimeout(() => {
            callback({
                didTimeout: false,
                timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
            });
        }, 1);
    };
}

if (!root.cancelIdleCallback) {
    root.cancelIdleCallback = (id: number) => window.clearTimeout(id);
}

if (!root.CSS) {
    root.CSS = {};
}

if (!root.CSS.escape) {
    root.CSS.escape = (value: string) => {
        const stringValue = String(value);

        return stringValue.replace(/(^-?\d)|[^a-zA-Z0-9_-]/g, (match, leadingDigit) => {
            if (leadingDigit) {
                return `\\3${leadingDigit} `;
            }

            return `\\${match}`;
        });
    };
}

if (root.crypto && !root.crypto.randomUUID) {
    root.crypto.randomUUID = () => {
        const bytes = new Uint8Array(16);

        if (root.crypto.getRandomValues) {
            root.crypto.getRandomValues(bytes);
        } else {
            for (let index = 0; index < bytes.length; index += 1) {
                bytes[index] = Math.floor(Math.random() * 256);
            }
        }

        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(bytes, byte => {
            const value = byte.toString(16);

            return value.length === 1 ? `0${value}` : value;
        });

        return [
            hex.slice(0, 4).join(''),
            hex.slice(4, 6).join(''),
            hex.slice(6, 8).join(''),
            hex.slice(8, 10).join(''),
            hex.slice(10, 16).join(''),
        ].join('-');
    };
}

if (!Element.prototype.append) {
    Element.prototype.append = function append(...nodes: (Node | string)[]) {
        for (const node of nodes) {
            this.appendChild(typeof node === 'string' ? document.createTextNode(node) : node);
        }
    };
}

if (!Element.prototype.replaceChildren) {
    Element.prototype.replaceChildren = function replaceChildren(...nodes: (Node | string)[]) {
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }

        this.append(...nodes);
    };
}

if (!root.ResizeObserver) {
    class EditorResizeObserver {
        private callback: ResizeObserverCallback;
        private elements = new Set<Element>();
        private frame = 0;
        private lastSizes = new Map<Element, string>();

        constructor(callback: ResizeObserverCallback) {
            this.callback = callback;
        }

        observe(element: Element) {
            this.elements.add(element);
            this.schedule();
        }

        unobserve(element: Element) {
            this.elements.delete(element);
            this.lastSizes.delete(element);
        }

        disconnect() {
            this.elements.clear();
            this.lastSizes.clear();

            if (this.frame) {
                cancelAnimationFrame(this.frame);
                this.frame = 0;
            }
        }

        private schedule() {
            if (this.frame || this.elements.size === 0) {
                return;
            }

            this.frame = requestAnimationFrame(() => {
                this.frame = 0;
                this.check();

                if (this.elements.size > 0) {
                    this.schedule();
                }
            });
        }

        private check() {
            const entries: ResizeObserverEntry[] = [];

            for (const element of Array.from(this.elements)) {
                const rect = element.getBoundingClientRect();
                const sizeKey = `${rect.width}:${rect.height}`;

                if (this.lastSizes.get(element) === sizeKey) {
                    continue;
                }

                this.lastSizes.set(element, sizeKey);

                entries.push({
                    target: element,
                    contentRect: rect,
                    borderBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
                    contentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
                    devicePixelContentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
                } as ResizeObserverEntry);
            }

            if (entries.length > 0) {
                this.callback(entries, this as unknown as ResizeObserver);
            }
        }
    }

    root.ResizeObserver = EditorResizeObserver;
}
