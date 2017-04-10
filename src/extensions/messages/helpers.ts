import {Player} from '../../libraries/blockheads/player';
import {MessageConfig, MessageGroupType} from './index';

/** @hidden */
export function checkJoins(player: Player, message: MessageConfig) {
    return player.getJoins() >= message.joins_low && player.getJoins() <= message.join_high;
}

/** @hidden */
export function checkGroups(player: Player, message: MessageConfig): boolean {
    return isInGroup(player, message.group) && !isInGroup(player, message.not_group);
}

/** @hidden */
function isInGroup(player: Player, group: MessageGroupType): boolean {
    switch (group) {
        case 'all':
            return true;
        case 'staff':
            return player.isStaff();
        case 'mod':
            return player.isMod();
        case 'admin':
            return player.isAdmin();
        case 'owner':
            return player.isOwner();
        default:
            return false;
    }
}
