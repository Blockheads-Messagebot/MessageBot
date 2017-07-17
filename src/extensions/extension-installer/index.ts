import { MessageBot } from '../../bot';
import * as fs from "fs";

//Install other extensions that haven't been already.
var extList = <string[]>[];
var writeExtFile = "//Imports all extensions.\n";
fs.readFileSync("./build/extensionList.js","utf8").split("\n").forEach(function(line){
  if (line.startsWith("[")) {
    extList = JSON.parse(line.substring(0,line.length-1));
  }
});
fs.readdirSync("./src/extensions").forEach(function(folder){
  if (folder.endsWith("ui") || extList.indexOf(folder) != -1) {
    return; //this extension is only run during the node bot. So it's ok to cancel out ui extensions.
  }
  extList.push(folder);
});

writeExtFile += JSON.stringify(extList) + ";\n";
for (var extension of extList) {
  writeExtFile += 'require("./extensions/'+extension+'");\n';
}

fs.writeFileSync("./build/extensionList.js",writeExtFile,"utf8");

MessageBot.registerExtension("extension-installer",function(ex){
  if (!ex.isNode) {
    throw new Error("This extension can only be used in the node version of the bot.");
  }

});
