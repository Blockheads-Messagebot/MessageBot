export declare class Ajax {
    static get(url?: string, params?: {
        [key: string]: string | number;
    }): Promise<string>;
    static getJSON(url?: string, params?: {
        [key: string]: string | number;
    }): Promise<{
        [key: string]: any;
    }>;
    static post(url?: string, params?: {
        [key: string]: string | number;
    }): Promise<string>;
    static postJSON(url?: string, params?: {
        [key: string]: string | number;
    }): Promise<{
        [key: string]: any;
    }>;
}
