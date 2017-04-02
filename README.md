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
0. Edit the config in `./src/bot/config.ts`
0. Run: `npm start:cloud` or `npm start:mac`.

##### Importing configs
If you are moving a bot from the browser, you can import your config by placing the entire text from backing up the bot in a file named `import.json` in the `./src/bot` directory. Not yet implemented.

# Development
To run tests:
`npm run test`

To build:
`npm run build`

To build docs:
`npm run docs`
