"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simpleevent_1 = require("../simpleevent");
const child_process_1 = require("child_process");
const fs = require("fs");
const chatparser_1 = require("./chatparser");
class MacChatWatcher {
    /**
     * Creates a new instance of the MacChatWatcher class.
     *
     * @param path the path to where the world is stored.
     */
    constructor(path) {
        /**
         * @inheritdoc
         */
        this.onMessage = new simpleevent_1.SimpleEvent();
        this.path = path;
    }
    /**
     * @inheritdoc
     */
    setup(name, online) {
        let re = new RegExp(String.raw `^\w\w\w ( |\d)\d \d\d:\d\d:\d\d ([\w-]+) BlockheadsServer\[\d+]: ${name.toUpperCase()}`);
        this.parser = new chatparser_1.MacChatParser(online);
        this.logs = fs.createWriteStream(this.path + '/logs.txt', { flags: 'a' });
        this.tail = child_process_1.spawn('tail', [
            '-f',
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
exports.MacChatWatcher = MacChatWatcher;
