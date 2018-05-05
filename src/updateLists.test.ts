import * as test from 'tape'

import { updateLists } from './updateLists'
import { WorldLists } from 'blockheads-api-interface'
import { Player } from './player'

function getLists(): WorldLists {
  return {
    adminlist: ['ADMIN'],
    modlist: ['MOD'],
    whitelist: ['GOOD'],
    blacklist: ['BAD']
  }
}

function getPlayer(name: string, lists: WorldLists, owner = false): Player {
  return new Player(name, { ip: '', ips: [], joins: 0, owner }, lists)
}

test('Ignores commands from non-admins', t => {
  const lists = getLists()
  updateLists(lists, getPlayer('MOD', lists), '/admin MOD')
  t.false(lists.adminlist.includes('MOD'))
  t.end()
})

test('Handles /admin', t => {
  const lists = getLists()
  updateLists(lists, getPlayer('ADMIN', lists), '/admin admin2')
  t.true(lists.adminlist.includes('ADMIN2'))
  t.end()
})

test('Handles /unadmin', t => {
  const lists = getLists()
  updateLists(lists, getPlayer('ADMIN', lists), '/unadmin admin')
  t.false(lists.adminlist.includes('ADMIN'))
  t.end()
})

test('Handles /mod', t => {
  const lists = getLists()
  updateLists(lists, getPlayer('ADMIN', lists), '/mod mod2')
  t.true(lists.modlist.includes('MOD2'))
  t.end()
})

test('Handles /unmod', t => {
  const lists = getLists()
  updateLists(lists, getPlayer('ADMIN', lists), '/unmod mod')
  t.false(lists.modlist.includes('MOD'))
  t.end()
})

test('Handles /ban', t => {
  const lists = getLists()
  updateLists(lists, getPlayer('ADMIN', lists), '/ban someone')
  t.true(lists.blacklist.includes('SOMEONE'))
  t.end()
})


test('/ban removes from other lists', t => {
  const lists = getLists()
  const admin = getPlayer('ADMIN', lists)

  updateLists(lists, admin, '/ban MOD')
  updateLists(lists, admin, '/ban GOOD')
  updateLists(lists, admin, '/ban ADMIN')
  t.deepEqual(lists.adminlist, [])
  t.deepEqual(lists.modlist, [])
  t.deepEqual(lists.whitelist, [])
  t.end()
})

test('Handles /unban', t => {
  const lists = getLists()
  updateLists(lists, getPlayer('ADMIN', lists), '/unban bad')
  t.false(lists.blacklist.includes('BAD'))
  t.end()
})

test('Handles /whitelist', t => {
  const lists = getLists()
  updateLists(lists, getPlayer('ADMIN', lists), '/whitelist bad')
  t.false(lists.blacklist.includes('BAD'))
  t.true(lists.whitelist.includes('BAD'))
  t.end()
})

test('Handles /unwhitelist', t => {
  const lists = getLists()
  updateLists(lists, getPlayer('ADMIN', lists), '/unwhitelist good')
  t.false(lists.whitelist.includes('GOOD'))
  t.end()
})

test('Ignores non-commands', t => {
  const lists = getLists()
  updateLists(lists, getPlayer('ADMIN', lists), 'Some chat')
  t.deepEqual(lists, getLists())
  t.end()
})
