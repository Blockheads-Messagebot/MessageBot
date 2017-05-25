import {ChatWatcher, ChatMessage} from '../blockheads/types/chat';
import {SimpleEvent} from '../simpleevent';
import {spawn, ChildProcess} from 'child_process';
import * as fs from 'fs';
import {MacChatParser as ChatParser} from './chatparser';

export class MacChatWatcher implements ChatWatcher {
    private tail: ChildProcess;

    private logs: fs.WriteStream;

    private path: string;

    private parser: ChatParser;

    /**
     * @inheritdoc
     */
    public onMessage = new SimpleEvent<ChatMessage>();

    /**
     * Creates a new instance of the MacChatWatcher class.
     *
     * @param path the path to where the world is stored.
     */
    constructor(path: string) {
        this.path = path;
    }

    /**
     * @inheritdoc
     */
    setup(name: string, online: string[]): void {
        let re = new RegExp(String.raw`^\w\w\w ( |\d)\d \d\d:\d\d:\d\d ([\w-]+) BlockheadsServer\[\d+]: ${name.toUpperCase()}`);
        this.parser = new ChatParser(online);

        this.logs = fs.createWriteStream(this.path + '/logs.txt', {flags: 'a'});

        this.tail = spawn('tail', [
            '-fF',
            '-n', '0',
            '/private/var/log/system.log'
        ]);

        this.tail.stdout.on('data', (data) => {
            let year = (new Date()).getFullYear();
            if (Buffer.isBuffer(data)) {
                data = data.toString('utf8');
            }
            let lines = data.split('\n');

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                // Get multiline messages
                while (lines[++i] && lines[i].startsWith('\t')) {
                    line += '\n' + lines[i];
                }
                i--;

                if (re.test(line)) {
                    this.parser.parse(line.substr(line.indexOf(']: ') + 6 + name.length))
                        .forEach(message => this.onMessage.dispatch(message));

                    this.logs.write(line.slice(0, 7) + year + ' ' + line.slice(7) + '\n');
                }
            }
        });
    }
}
