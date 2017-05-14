"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Parses logs from the portal into a standard format. This is only used by the [[PortalApi]] class.
 */
var PortalLogParser = (function () {
    /**
     * Creates a new instance of the PortalLogParser class.
     */
    function PortalLogParser() {
        this.entries = [];
        this.parse = this.parse.bind(this);
    }
    /**
     * Parses the logs into a standard format.
     *
     * @param lines {string[]} the raw log lines.
     */
    PortalLogParser.prototype.parse = function (lines) {
        // Copy the lines array
        lines = lines.slice(0);
        // Assume first line is valid, if it isn't it will be dropped.
        for (var i = lines.length - 1; i > 0; i--) {
            var line = lines[i];
            if (!this.isValidLine(line)) {
                lines[i - 1] += '\n' + lines.splice(i, 1);
                continue;
            }
            this.addLine(line);
        }
        if (this.isValidLine(lines[0])) {
            this.addLine(lines[0]);
        }
        var entries = this.entries.reverse();
        this.entries = [];
        return entries;
    };
    PortalLogParser.prototype.isValidLine = function (line) {
        return /^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d\.\d\d\d blockheads_server/.test(line);
    };
    PortalLogParser.prototype.addLine = function (line) {
        var ts = line.substr(0, 24)
            .replace(' ', 'T')
            .replace(' ', 'Z');
        this.entries.push({
            raw: line,
            timestamp: new Date(ts),
            message: line.substr(line.indexOf(']') + 2)
        });
    };
    return PortalLogParser;
}());
exports.PortalLogParser = PortalLogParser;
