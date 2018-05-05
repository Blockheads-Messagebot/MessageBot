import { WorldLists } from 'blockheads-api-interface'
import { Player } from './player'

const addToList = (list: string[], element: string) => !list.includes(element) && list.push(element)
const removeFromList = (list: string[], element: string) => {
  const index = list.indexOf(element)
  if (index == -1) return
  list.splice(index, 1)
}
const removeFromLists = (lists: string[][], element: string) => lists.forEach(list => removeFromList(list, element))

export function updateLists(lists: WorldLists, player: Player, message: string): void {
  if (!player.isAdmin) return
  message = message.toLocaleUpperCase()
  const target = message.replace(/^\/\w+? /, '')

  if (message.startsWith('/ADMIN ')) {
    addToList(lists.adminlist, target)
    removeFromList(lists.blacklist, target)
  }
  else if (message.startsWith('/UNADMIN ')) {
    removeFromList(lists.adminlist, target)
  }
  else if (message.startsWith('/MOD ')) {
    addToList(lists.modlist, target)
    removeFromList(lists.blacklist, target)
  }
  else if (message.startsWith('/UNMOD ')) {
    removeFromList(lists.modlist, target)
  }
  else if (message.startsWith('/BAN ')) {
    removeFromLists([lists.adminlist, lists.whitelist, lists.modlist], target)
    addToList(lists.blacklist, target)
  }
  else if (message.startsWith('/UNBAN ')) {
    removeFromList(lists.blacklist, target)
  }
  else if (message.startsWith('/WHITELIST ')) {
    removeFromList(lists.blacklist, target)
    addToList(lists.whitelist, target)
  }
  else if (message.startsWith('/UNWHITELIST ')) {
    removeFromList(lists.whitelist, target)
  }
}
