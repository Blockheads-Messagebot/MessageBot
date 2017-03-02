export class Hook {
    listeners: {[key: string]: [Function]};
    on: Function;
    fire: Function;

    constructor() {
        this.listeners = {};

        this.listen = this.listen.bind(this);
        this.on = this.listen;
        this.remove = this.remove.bind(this);
        this.check = this.check.bind(this);
        this.fire = this.check;
    }

    /**
     * Function used to begin listening to an event.
     *
     * @example
     * listen('event', console.log);
     * //alternatively
     * on('event', console.log);
     */
    listen(key: string, callback: Function): void {
        if (typeof callback != 'function') {
            throw new Error('callback must be a function.');
        }

        key = key.toLocaleLowerCase();

        if (!this.listeners[key]) {
            this.listeners[key] = [callback];
        } else if (!this.listeners[key].includes(callback)) {
            this.listeners[key].push(callback);
        }
    }

    
    /**
     * Function used to stop listening to an event. If the listener was not found, no action will be taken.
     *
     * @example
     * //Earlier attached myFunc to 'event'
     * remove('event', myFunc);
     */
    remove(key: string, callback: Function): void {
        key = key.toLocaleLowerCase();
        if (this.listeners[key]) {
            if (this.listeners[key].includes(callback)) {
                this.listeners[key].splice(this.listeners[key].indexOf(callback), 1);
            }
        }
    }

    /**
     * Function used to call events.
     *
     * @example
     * check('test', 1, 2, 3);
     * check('test', true);
     * // alternatively
     * fire('test', 1, 2, 3);
     * fire('test', true);
     */
    //tslint:disable-next-line:no-any
    check(key: string, ...args: any[]): void {
        key = key.toLocaleLowerCase();
        if (!this.listeners[key]) {
            return;
        }

        this.listeners[key].forEach(listener => {
            try {
                listener(...args);
            } catch (e) {
                if (key != 'error') {
                    this.check('error', e);
                }
            }
        });
    }
}
