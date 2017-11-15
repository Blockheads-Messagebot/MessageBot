import { WorldApi } from 'blockheads-api/api'
import { SimpleEvent, SafeSimpleEvent } from './events'
// Typescript incorrectly types clearTimeout as not accepting a NodeJS.Timer
declare function clearTimeout(handle: number | NodeJS.Timer): void


/**
 * Arguments passed when a player joins the server
 * @hidden
 */
export interface JoinEventArgs {
    name: string
    ip: string
}

/**
 * Arguments passed when a player or the server sends a message
 * @hidden
 */
export interface MessageEventArgs {
    name: string
    message: string
}

/**
 * Internal class used by the [[World]] class to watch chat.
 * @hidden
 */
export class ChatWatcher {
    protected _onMessage: SimpleEvent<MessageEventArgs> = new SimpleEvent()
    protected _onJoin: SimpleEvent<JoinEventArgs> = new SimpleEvent()
    protected _onLeave: SimpleEvent<string> = new SimpleEvent()
    protected _onOther: SimpleEvent<string> = new SimpleEvent()
    protected timeoutId: NodeJS.Timer | number | null = null

    /**
     * Event which fires when a player joins the server.
     */
    get onJoin(): SafeSimpleEvent<JoinEventArgs> {
        return this._onJoin.asEvent()
    }

    /**
     * Event which fires when a player leaves the server.
     */
    get onLeave(): SafeSimpleEvent<string> {
        return this._onLeave.asEvent()
    }

    /**
     * Event which fires when a player sends a message in chat.
     */
    get onMessage(): SafeSimpleEvent<MessageEventArgs> {
        return this._onMessage.asEvent()
    }

    /**
     * Event which fires when a chat message cannot be parsed as a message, join, or leave.
     */
    get onOther(): SafeSimpleEvent<string> {
        return this._onOther.asEvent()
    }

    /**
     * True if the watcher is currently running, otherwise false.
     */
    get running(): boolean {
        return this.timeoutId != null
    }

    /**
     * Creates a new ChatWatcher
     * @param api the api to be used to communicate with chat
     * @param online a shared array with the host world class that this class keeps up to date.
     */
    constructor(protected api: Pick<WorldApi, 'getMessages'>, protected online: string[]) {}

    /**
     * Starts the listener. Calling multiple times will not result in multiple listeners being started.
     */
    start(): void {
        if (this.timeoutId) this.stop()
        this.timeoutId = setTimeout(this.checkChat, 0, 0)
    }

    /**
     * Stops the listener if it is running. If not running, does nothing.
     */
    stop(): void {
        if (this.timeoutId) clearTimeout(this.timeoutId)
        this.timeoutId = null
    }

    /**
     * Parses a chat message, firing the appropriate events if required.
     */
    protected parse = (message: string): void => {
        let parseError = () => {
            this._onOther.dispatch(message)
        }

        if (/^[^a-z]+ - Player Connected /.test(message)) {
            try {
                let [, name, ip] = message.match(/Connected ([^a-z]{3,}) \| ([\d.]+) \| .{32}$/) as RegExpMatchArray
                if (!this.online.includes(name)) {
                    this.online.includes(name) || this.online.push(name)
                    this._onJoin.dispatch({name, ip})
                    return
                }
            } catch (_) { }
            return parseError()
        }

        if (/^[^a-z]+ - Player Disconnected /.test(message)) {
            try {
                let [, name] = message.match(/Disconnected ([^a-z]{3,})$/) as RegExpMatchArray
                if (this.online.includes(name)) {
                    this.online.splice(this.online.indexOf(name), 1)
                    this._onLeave.dispatch(name)
                    return
                }
            } catch (_) { }
            return parseError()
        }

        if (message.slice(0, 18).includes(': ')) {
            let name = this.getUser(message)
            if (name) {
                message = message.substr(name.length + 2)
                if (name == 'SERVER' && message.startsWith('/')) {
                    return parseError()
                }

                this._onMessage.dispatch({name, message})
                return
            }
        }

        return parseError()
    }

    /**
     * Parses a message to extract a player name.
     * @param message the message to extract a name from.
     */
    protected getUser(message: string): string {
        for (let i = 18; i > 4; i--) {
            let possibleName = message.substring(0, message.lastIndexOf(': ', i))
            if (this.online.includes(possibleName) || possibleName == 'SERVER') {
                return possibleName
            }
        }
        // Player is most likely offline
        if (/[^a-z]{3,16}: /.test(message)) return message.substring(0, message.lastIndexOf(': ', 18))
        // Invalid name
        return ''
    }

    /**
     * Continually checks chat for new messages
     * @param lastId the ID to pass to the API to get only most recent messages.
     */
    protected checkChat = async (lastId: number): Promise<void> => {
        try {
            let { log, nextId } = await this.api.getMessages(lastId)
            if (this.timeoutId == null) return
            log.forEach(this.parse)
            this.timeoutId = setTimeout(this.checkChat, 5000, nextId)
        } catch (_) {
            // Network error, wait 30 seconds before retrying
            this.timeoutId = setTimeout(this.checkChat, 30000, 0)
            return
        }
    }
}
