import test from 'ava'

import { Player, PlayerInfo, WorldLists } from './player'

const lists = { adminlist: [], modlist: [], whitelist: [], blacklist: [] }

const tn = ([s]: TemplateStringsArray) => `Player - ${s}`

const defaultInfo: PlayerInfo = { ip: '0.0.0.0', ips: ['0.0.0.0', '0.0.0.1'], joins: 1}

function makePlayer(name: string, lists2: Partial<WorldLists> = {}, info: Partial<PlayerInfo> = {}) {
    return new Player(name, {...defaultInfo, ...info}, {...lists, ...lists2})
}

test(tn`Should expose the player name`, t => {
    let player = makePlayer('NAME')
    t.is(player.name, 'NAME')
})

test(tn`Should expose the player IP`, t => {
    let player = makePlayer('NAME')
    t.is(player.ip, defaultInfo.ip)
})

test(tn`Should expose all player IPs`, t => {
    let player = makePlayer('NAME')
    t.deepEqual(player.ips, defaultInfo.ips)
})

test(tn`Should expose the player joins`, t => {
    let player = makePlayer('NAME')
    t.is(player.joins, defaultInfo.joins)
})

test(tn`Should correctly report if the player has joined`, t => {
    let player = makePlayer('NAME')
    let player2 = makePlayer('NAME', {}, {joins: 0})

    t.is(player.hasJoined, true)
    t.is(player2.hasJoined, false)
})

test(tn`Should report SERVER as the owner`, t => {
    let player = makePlayer('SERVER')
    t.is(player.isOwner, true)
})

test(tn`Should correctly report owners`, t => {
    let player = makePlayer('NAME', {}, {owner: true})
    t.is(player.isOwner, true)
})

test(tn`The owner should be an admin`, t => {
    let player = makePlayer('NAME', {}, {owner: true})
    t.is(player.isAdmin, true)
})

test(tn`If the player is on the adminlist they should be an admin`, t => {
    let player = makePlayer('NAME', { adminlist: ['NAME']})
    t.is(player.isAdmin, true)
})

test(tn`If the player is on both the admin and the modlist they should be an admin`, t => {
    let player = makePlayer('NAME', { adminlist: ['NAME'], modlist: ['NAME']})
    t.is(player.isAdmin, true)
})

test(tn`If the player is on the modlist they should be a mod`, t => {
    let player = makePlayer('NAME', { modlist: ['NAME']})
    t.is(player.isMod, true)
})

test(tn`If the player is on the adminlist and the modlist they should not be a mod`, t => {
    let player = makePlayer('NAME', { adminlist: ['NAME'], modlist: ['NAME'] })
    t.is(player.isMod, false)
})

test(tn`If the player is on the adminlist they should be whitelisted`, t => {
    let player = makePlayer('NAME', {adminlist: ['NAME']})
    t.is(player.isWhitelisted, true)
})

test(tn`If the player is on the modlist they should be whitelisted`, t => {
    let player = makePlayer('NAME', {modlist: ['NAME']})
    t.is(player.isWhitelisted, true)
})

test(tn`If the player is on the whitelist they should be whitelisted`, t => {
    let player = makePlayer('NAME', {whitelist: ['NAME']})
    t.is(player.isWhitelisted, true)
})

test(tn`If the player is an admin they should be staff`, t => {
    let player = makePlayer('NAME', {adminlist: ['NAME']})
    t.is(player.isStaff, true)
})

test(tn`If the player is a mod they should be staff`, t => {
    let player = makePlayer('NAME', {modlist: ['NAME']})
    t.is(player.isStaff, true)
})

test(tn`If the player is the owner they should be staff`, t => {
    let player = makePlayer('NAME', {}, {owner: true})
    t.is(player.isStaff, true)
})

test(tn`If the player is not an admin, mod, or owner they should not be staff`, t => {
    let player = makePlayer('NAME')
    t.is(player.isStaff, false)
})

test(tn`If the player is on the blacklist they should be banned`, t => {
    let player = makePlayer('NAME', {blacklist: ['NAME']})
    t.is(player.isBanned, true)
})

test(tn`If the player is on the adminlist they should not be banned`, t => {
    let player = makePlayer('NAME', { blacklist: ['NAME'], adminlist: ['NAME'] })
    t.is(player.isBanned, false)
})

test(tn`If the player is on the modlist they should not be banned`, t => {
    let player = makePlayer('NAME', { blacklist: ['NAME'], adminlist: ['NAME'] })
    t.is(player.isBanned, false)
})

test(tn`If the player is the owner they should not be banned`, t => {
    let player = makePlayer('NAME', { blacklist: ['NAME'] }, {owner: true})
    t.is(player.isBanned, false)
})

test(tn`If the player's ip is on the blacklist they should be banned`, t => {
    let player = makePlayer('NAME', { blacklist: [defaultInfo.ip]})
    t.is(player.isBanned, true)
})

test(tn`If the player's name is not on the blacklist they should not be banned`, t => {
    let player = makePlayer('NAME', { blacklist: ['OTHER']})
    t.is(player.isBanned, false)
})

test(tn`Device IDs should be removed from blacklist entries when checking if a player is banned`, t => {
    let player = makePlayer('NAME', { blacklist: ['NAME \\device_id']})
    t.is(player.isBanned, true)
})

test(tn`Should check lists without case sensitivity`, t => {
    let player = makePlayer('NAME', { blacklist: ['name']})
    t.is(player.isBanned, true)
    player = makePlayer('NAME', { adminlist: ['name']})
    t.is(player.isAdmin, true)
    player = makePlayer('NAME', { modlist: ['name']})
    t.is(player.isMod, true)
    player = makePlayer('NAME', { whitelist: ['name']})
    t.is(player.isWhitelisted, true)
})
