# Usage
##### Installation - Browser
0. Bookmark this page
0. Copy this code:
`javascript:(function(){var s=document.createElement('script'); s.src='//blockheadsfans.com/messagebot/bot/load'; s.crossOrigin='anonymous'; document.head.appendChild(s);})()`
0. Edit the bookmark, look for the URL of this page and change it to the code you copied. Be sure to remove all the previous text!
0. Install complete!

##### Installation - Node
0. Clone the repo, `git clone http://github.com/Bibliofile/Blockheads-MessageBot`
0. Enter the directory, `cd Blockheads-MessageBot`
0. Install dependencies, `npm install --production`
0. Edit the config in `./config/bot.js`, copy the default config into this file from `./config/bot.default.js`
0. Run: `npm run start:cloud` or `npm run start:mac`.

##### Importing configs
If you are moving a bot from the browser, you can import your config by placing the entire text from backing up the bot in a file named `import.json` in the `./config` directory, next run `npm run import` to import your backup.

# Development
### To run tests:
Continually:
`npm run test`
Once:
`npm run gulp -- test`

### To build
The current code will always be linted to check for problems.

Node:
`npm run gulp -- build`
Node + Browser:
`npm run gulp -- browserify`
Node + Browser continually:
`npm run gulp -- watch`
Node + Browser + Docs + run tests:
`npm run gulp -- all`
Docs only:
`npm run gulp -- docs`
