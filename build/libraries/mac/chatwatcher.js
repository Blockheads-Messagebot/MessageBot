"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var simpleevent_1 = require("../simpleevent");
var child_process_1 = require("child_process");
var fs = require("fs");
var chatparser_1 = require("./chatparser");
var MacChatWatcher = (function () {
    /**
     * Creates a new instance of the MacChatWatcher class.
     *
     * @param path the path to where the world is stored.
     */
    function MacChatWatcher(path) {
        var _this = this;
        /**
         * @inheritdoc
         */
        this.onMessage = new simpleevent_1.SimpleEvent();
        /**
         * @inheritdoc
         */
        this.setup = function (name, online) {
            var re = new RegExp((_a = ["^www ( |d)d dd:dd:dd ([w-]+) BlockheadsServer[d+]: ", ""], _a.raw = ["^\\w\\w\\w ( |\\d)\\d \\d\\d:\\d\\d:\\d\\d ([\\w-]+) BlockheadsServer\\[\\d+]: ", ""], String.raw(_a, name.toUpperCase())));
            _this.parser = new chatparser_1.MacChatParser(online);
            _this.logs = fs.createWriteStream(_this.path + '/logs.txt', { flags: 'a' });
            _this.tail = child_process_1.spawn('tail', [
                '-fF',
                '-n', '0',
                '/private/var/log/system.log'
            ]);
            _this.tail.stdout.on('data', function (data) {
                var year = (new Date()).getFullYear();
                if (Buffer.isBuffer(data)) {
                    data = data.toString('utf8');
                }
                var lines = data.split('\n');
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    // Get multiline messages
                    while (lines[++i] && lines[i].startsWith('\t')) {
                        line += '\n' + lines[i];
                    }
                    i--;
                    if (re.test(line)) {
                        _this.parser.parse(line.substr(line.indexOf(']: ') + 6 + name.length))
                            .forEach(function (message) { return _this.onMessage.dispatch(message); });
                        _this.logs.write(line.slice(0, 7) + year + ' ' + line.slice(7) + '\n');
                    }
                }
            });
            var _a;
        };
        this.path = path;
    }
    return MacChatWatcher;
}());
exports.MacChatWatcher = MacChatWatcher;
