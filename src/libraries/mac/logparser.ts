import {LogEntry} from '../blockheads/types/logs';

/**
 * Parses logs from the portal into a standard format. This is only used by the [[PortalAPI]] class.
 */
export class MacLogParser {
    /** @hidden */
    private entries: LogEntry[];

    /**
     * Creates a new instance of the class.
     */
    constructor() {
        this.entries = [];
    }

    /**
     * Parses the logs into a standard format.
     *
     * @param lines {string[]} the raw log lines.
     */
    parse(lines: string[]): LogEntry[] {
        // Copy the lines array
        lines = lines.splice(0);

        // Assume first line is valid, if it isn't it will be dropped.
        for (let i = lines.length; i > 0; i--) {
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
    private isValidLine(line: string): boolean {
        return /^\w\w\w (?:\d| )\d \d\d\d\d \d\d:\d\d:\d\d ([\w-]+) BlockheadsServer\[/.test(line);
    }

    /** @hidden */
    private addLine(line: string): void {
        let ts = line.substr(0, 20);

        this.entries.push({
            raw: line,
            timestamp: new Date(ts),
            message: line.substr(line.indexOf(']') + 2)
        });
    }
}
