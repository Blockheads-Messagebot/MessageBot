var world = require('./world');

/**
 * Function used to check if users are in defined groups.
 *
 * @example
 * checkGroup('admin', 'SERVER') // true
 * @param {string} group the group to check
 * @param {string} name the name of the user to check
 * @return {bool}
 */
function checkGroup(group, name) {
    name = name.toLocaleUpperCase();
    switch (group.toLocaleLowerCase()) {
        case 'all':
            return true;
        case 'admin':
            return world.lists.admin.includes(name);
        case 'mod':
            return world.lists.mod.includes(name);
        case 'staff':
            return world.lists.staff.includes(name);
        case 'owner':
            return world.owner == name;
        default:
            return false;
    }
}

module.exports = {checkGroup};
