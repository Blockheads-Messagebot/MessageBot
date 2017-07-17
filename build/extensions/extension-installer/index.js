"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bot_1 = require("../../bot");
var fs = require("fs");
//Install other extensions that haven't been already.
var extList = [];
var writeExtFile = "//Imports all extensions.\n";
fs.readFileSync("./build/extensionList.js", "utf8").split("\n").forEach(function (line) {
    if (line.startsWith("[")) {
        extList = JSON.parse(line.substring(0, line.length - 1));
    }
});
fs.readdirSync("./src/extensions").forEach(function (folder) {
    if (folder.endsWith("ui") || extList.indexOf(folder) != -1) {
        return; //this extension is only run during the node bot. So it's ok to cancel out ui extensions.
    }
    extList.push(folder);
});
writeExtFile += JSON.stringify(extList) + ";\n";
try {
    for (var extList_1 = __values(extList), extList_1_1 = extList_1.next(); !extList_1_1.done; extList_1_1 = extList_1.next()) {
        var extension = extList_1_1.value;
        writeExtFile += 'require("./extensions/' + extension + '");\n';
    }
}
catch (e_1_1) { e_1 = { error: e_1_1 }; }
finally {
    try {
        if (extList_1_1 && !extList_1_1.done && (_a = extList_1.return)) _a.call(extList_1);
    }
    finally { if (e_1) throw e_1.error; }
}
fs.writeFileSync("./build/extensionList.js", writeExtFile, "utf8");
bot_1.MessageBot.registerExtension("extension-installer", function (ex) {
    if (!ex.isNode) {
        throw new Error("This extension can only be used in the node version of the bot.");
    }
});
var e_1, _a;
