/** @hidden */
export interface MessageConfig {
    message: string;
    joins_low: number;
    joins_high: number;
    group: MessageGroupType;
    not_group: MessageGroupType;
}
/** @hidden */
export declare type MessageGroupType = 'all' | 'staff' | 'mod' | 'admin' | 'owner' | 'nobody';
/** @hidden **/
export declare type JoinMessageConfig = MessageConfig;
/** @hidden **/
export declare type LeaveMessageConfig = MessageConfig;
/** @hidden **/
export declare type TriggerMessageConfig = MessageConfig & {
    trigger: string;
};
/** @hidden **/
export declare type AnnouncementMessageConfig = {
    message: string;
};
