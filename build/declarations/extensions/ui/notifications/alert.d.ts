/** @hidden */
export declare function alert(html: string, buttons?: Array<{
    text: string;
    style?: string;
} | string>, callback?: (text: string) => void): void;
export declare function prompt(text: string, callback?: (response: string) => void): void;
