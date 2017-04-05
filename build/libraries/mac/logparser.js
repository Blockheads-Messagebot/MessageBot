"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Parses logs from the portal into a standard format. This is only used by the [[PortalAPI]] class.
 */
class MacLogParser {
    /**
     * Creates a new instance of the class.
     *
     * @param name the name of the world.
     */
    constructor(name) {
        this.name = name;
        this.entries = [];
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
    /** @hidden */
    isValidLine(line) {
        return /^\w\w\w (?:\d| )\d \d\d\d\d \d\d:\d\d:\d\d ([\w-]+) BlockheadsServer\[/.test(line);
    }
    /** @hidden */
    addLine(line) {
        let ts = line.substr(0, 20);
        this.entries.push({
            raw: line,
            timestamp: new Date(ts),
            message: line.substr(line.indexOf(']') + 6 + this.name.length)
        });
    }
}
exports.MacLogParser = MacLogParser;
