import { WorldApi } from 'blockheads-api/api'
import { ISimpleEvent, createSimpleEventDispatcher } from 'strongly-typed-events'

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
    private _onMessage = createSimpleEventDispatcher<MessageEventArgs>()
    private _onJoin = createSimpleEventDispatcher<JoinEventArgs>()
    private _onLeave = createSimpleEventDispatcher<string>()
    private _onOther = createSimpleEventDispatcher<string>()

    /**
     * Event which fires when a player joins the server.
     */
    get onJoin(): ISimpleEvent<JoinEventArgs> {
        return this._onJoin.asEvent()
    }

    /**
     * Event which fires when a player leaves the server.
     */
    get onLeave(): ISimpleEvent<string> {
        return this._onLeave.asEvent()
    }

    /**
     * Event which fires when a player sends a message in chat.
     */
    get onMessage(): ISimpleEvent<MessageEventArgs> {
        return this._onMessage.asEvent()
    }

    /**
     * Event which fires when a chat message cannot be parsed as a message, join, or leave.
     */
    get onOther(): ISimpleEvent<string> {
        return this._onOther.asEvent()
    }

    /**
     * Creates a new ChatWatcher
     * @param api the api to be used to communicate with chat
     * @param online a shared array with the host world class that this class keeps up to date.
     */
    constructor(private api: WorldApi, private online: string[]) {
        this.checkChat(0)
    }

    /**
     * Parses a chat message, firing the appropriate events if required.
     */
    parse = (message: string): void => {
        if (/^[^a-z]+ - Player Connected /.test(message)) {
            try {
                let [, name, ip] = message.match(/Connected (.*) \| ([\d.]+) \|/) as RegExpMatchArray
                this.online.includes(name) || this.online.push(name)
                this._onJoin.dispatch({name, ip})
                return
            } catch (_) {
                this._onOther.dispatch(message)
                return
            }
        }

        if (/^[^a-z] - Player Disconnected /.test(message)) {
            let [, name] = message.match(/Disconnected (.*)$/) as RegExpMatchArray
            if (this.online.includes(name)) {
                this.online.splice(this.online.indexOf(name), 1)
                this._onLeave.dispatch(name)
                return
            }
        }

        if (message.slice(0, 18).includes(': ')) {
            let name = this.getUser(message)
            if (name) {
                message = message.substr(name.length + 2)
                this._onMessage.dispatch({name, message})
                return
            }
        }

        this._onOther.dispatch(message)
    }

    /**
     * Parses a message to extract a player name.
     * @param message the message to extract a name from.
     */
    private getUser(message: string): string {
        for (let i = 18; i > 4; i--) {
            let possibleName = message.substring(0, message.lastIndexOf(': ', i))
            if (this.online.includes(possibleName) || possibleName == 'SERVER') {
                return possibleName
            }
        }
        // Should ideally never happen.
        return message.substring(0, message.lastIndexOf(': ', 18))
    }

    /**
     * Continually checks chat for new messages
     * @param lastId the ID to pass to the API to get only most recent messages.
     */
    private checkChat = async (lastId: number) => {
        try {
            let { log, nextId } = await this.api.getMessages(lastId)
            log.forEach(this.parse)
            setTimeout(this.checkChat, 5000, nextId)
        } catch (_) {
            // Network error, wait 30 seconds before retrying
            return setTimeout(this.checkChat, 30000, 0)
        }
    }
}
