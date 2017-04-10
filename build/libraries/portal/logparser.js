"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Parses logs from the portal into a standard format. This is only used by the [[PortalAPI]] class.
 */
class PortalLogParser {
    /**
     * Creates a new instance of the PortalLogParser class.
     */
    constructor() {
        this.entries = [];
        this.parse = this.parse.bind(this);
    }
    /**
     * Parses the logs into a standard format.
     *
     * @param lines {string[]} the raw log lines.
     */
    parse(lines) {
        // Copy the lines array
        lines = lines.slice(0);
        // Assume first line is valid, if it isn't it will be dropped.
        for (let i = lines.length - 1; i > 0; i--) {
            let line = lines[i];
            if (!this.isValidLine(line)) {
                lines[i - 1] += '\n' + lines.splice(i, 1);
                continue;
            }
            this.addLine(line);
        }
        if (this.isValidLine(lines[0])) {
            this.addLine(lines[0]);
        }
        let entries = this.entries.reverse();
        this.entries = [];
        return entries;
    }
    isValidLine(line) {
        return /^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d\.\d\d\d blockheads_server/.test(line);
    }
    addLine(line) {
        let ts = line.substr(0, 24)
            .replace(' ', 'T')
            .replace(' ', 'Z');
        this.entries.push({
            raw: line,
            timestamp: new Date(ts),
            message: line.substr(line.indexOf(']') + 2)
        });
    }
}
exports.PortalLogParser = PortalLogParser;
