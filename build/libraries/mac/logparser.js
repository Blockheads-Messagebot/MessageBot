"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Parses logs from the portal into a standard format. This is only used by the [[PortalApi]] class.
 */
var MacLogParser = (function () {
    /**
     * Creates a new instance of the class.
     *
     * @param name the name of the world.
     */
    function MacLogParser(name) {
        var _this = this;
        /**
         * Parses the logs into a standard format.
         *
         * @param lines {string[]} the raw log lines.
         */
        this.parse = function (lines) {
            // Copy the lines array
            lines = lines.slice(0);
            // Assume first line is valid, if it isn't it will be dropped.
            for (var i = lines.length - 1; i > 0; i--) {
                var line = lines[i];
                if (!_this.isValidLine(line)) {
                    lines[i - 1] += '\n' + lines.splice(i, 1);
                    continue;
                }
                _this.addLine(line);
            }
            if (_this.isValidLine(lines[0])) {
                _this.addLine(lines[0]);
            }
            var entries = _this.entries.reverse();
            _this.entries = [];
            return entries;
        };
        this.isValidLine = function (line) {
            return /^\w\w\w (?:\d| )\d \d\d\d\d \d\d:\d\d:\d\d ([\w-]+) BlockheadsServer\[/.test(line);
        };
        this.addLine = function (line) {
            var ts = line.substr(0, 20);
            _this.entries.push({
                raw: line,
                timestamp: new Date(ts),
                message: line.substr(line.indexOf(']') + 6 + _this.name.length)
            });
        };
        this.name = name;
        this.entries = [];
    }
    return MacLogParser;
}());
exports.MacLogParser = MacLogParser;
