"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function checkJoins(player, message) {
    return player.getJoins() >= message.joins_low && player.getJoins() <= message.join_high;
}
exports.checkJoins = checkJoins;
function checkGroups(player, message) {
    return isInGroup(player, message.group) && !isInGroup(player, message.not_group);
}
exports.checkGroups = checkGroups;
function isInGroup(player, group) {
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
