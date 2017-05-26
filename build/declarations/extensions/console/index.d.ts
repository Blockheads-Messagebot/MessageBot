export interface ConsoleExtensionExports {
    /**
     * Logs a message to the console, visible to the bot user but not sent to players on the server.
     */
    log: (message: string) => void;
}
