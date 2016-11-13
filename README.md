# Usage
##### Installation
1. Bookmark this page
2. Copy this code:
`javascript:(function(){if (typeof MessageBot === "undefined"){var s=document.createElement('script'); s.src='//blockheadsfans.com/messagebot/bot/load'; s.crossOrigin='anonymous'; document.head.appendChild(s);}})()`
3. Edit the bookmark, look for the URL of this page and change it to the code you copied. Be sure to remove all the previous text!
4. Install complete!

##### Usage
0. Go to http://portal.theblockheads.net
0. Choose the world you want to run the bot on
0. Click the bookmark
0. Configure as you wish. Your messages will automatically be saved for the next time you open the bot.

# Development
##### Guides / Documentation
See the [wiki](https://github.com/Bibliofile/Blockheads-MessageBot/wiki).

##### Available Hooks
Each level is separated by a period (`.`). There should be no spaces in the hook.

- world
    - join (name, ip)
    - leave (name)
    - message (name, message) - non server messages, includes / messages.
    - chat (name, message) - non server messages, does not include / messages.
    - servermessage (message) - server messages, includes / messages
    - serverchat (message) - does not include / messages
    - command (name, command, args) - for example ("BIB", "transfer", "1 BIB2") -- messages from server included. Note that this does **not** include messages where the command starts with a space. That is, `/ test something` will not be caught by this hook.
    - other (message)
    - send (message) - called when a message is sent.
- bot
    - send (message) - update called.
- ui
    - addmessagetopage
    - messageAdded
    - messageDeleted
    - messageChanged
    - prefChanged

- extension (in this case, replace extension with the extension ID that you are listening for)
    - loaded
