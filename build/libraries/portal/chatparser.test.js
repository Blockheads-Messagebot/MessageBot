"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chatparser_1 = require("./chatparser");
var chat_1 = require("../blockheads/types/chat");
var chai_1 = require("chai");
require("mocha");
describe('PortalChatParser#parse', function () {
    var online;
    var parser;
    var worldName = 'WORLD';
    var messages = {
        join1: worldName + " - Player Connected BIB | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz123456",
        join2: worldName + " - Player Connected BIB2 | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz123456",
        leave1: worldName + " - Player Disconnected BIB",
        leave2: worldName + " - Player Disconnected BIB2",
        chat1: "BIB: Hello!",
        chat2: "BIB2: Hello!",
        command1: "BIB: /help",
        command2: "BIB2: /ban test",
        serverchat1: "SERVER: Hello!",
    };
    beforeEach(function () {
        online = [];
        parser = new chatparser_1.PortalChatParser(worldName, online);
    });
    describe('Join events', function () {
        it('Should parse join messages', function () {
            var parsed = parser.parse([messages.join1]);
            chai_1.expect(parsed).to.deep.include({ type: chat_1.ChatType.join, name: 'BIB', ip: '0.0.0.0' });
        });
        it('Should add joining players to the online list', function () {
            parser.parse([messages.join1]);
            chai_1.expect(online).to.contain('BIB');
        });
    });
    describe('Leave events', function () {
        it('Should parse leave messages', function () {
            var parsed = parser.parse([messages.join1, messages.leave1]);
            chai_1.expect(parsed).to.deep.include({ type: chat_1.ChatType.leave, name: 'BIB' });
        });
        it('Should not send leave messages for players who have not joined', function () {
            var parsed = parser.parse([messages.join1, messages.leave2]);
            chai_1.expect(parsed).not.to.deep.include({ type: chat_1.ChatType.leave, name: 'BIB2' });
        });
        it('Should remove players from the online list', function () {
            online.push('BIB');
            parser.parse([messages.leave1]);
            chai_1.expect(online).to.deep.equal([]);
        });
    });
    describe('Command events', function () {
        it('Should return command events for commands', function () {
            var parsed = parser.parse([messages.join1, messages.command1]);
            chai_1.expect(parsed).to.deep.include({ type: chat_1.ChatType.command, name: 'BIB', command: 'help', args: '' });
        });
        it('Should return an args string if the command has args', function () {
            var parsed = parser.parse([messages.join2, messages.command2]);
            chai_1.expect(parsed).to.deep.include({ type: chat_1.ChatType.command, name: 'BIB2', command: 'ban', args: 'test' });
        });
        it('Should not parse regular chat as commands', function () {
            var parsed = parser.parse([messages.chat1]);
            chai_1.expect(parsed.some(function (msg) { return msg.type == chat_1.ChatType.command; }))
                .to.equal(false, 'No command messages should have been found.');
        });
    });
    describe('Message events', function () {
        it('Should return message events for chat', function () {
            var parsed = parser.parse([messages.join1, messages.chat1]);
            chai_1.expect(parsed).to.deep.include({ type: chat_1.ChatType.message, name: 'BIB', message: 'Hello!' });
        });
        it('Should return message events for commands', function () {
            var parsed = parser.parse([messages.join1, messages.command1]);
            chai_1.expect(parsed).to.deep.include({ type: chat_1.ChatType.message, name: 'BIB', message: '/help' });
        });
        it('Should return message events for server chat', function () {
            var parsed = parser.parse([messages.serverchat1]);
            chai_1.expect(parsed).to.deep.include({ type: chat_1.ChatType.message, name: 'SERVER', message: 'Hello!' });
        });
    });
    describe('Other events', function () {
        it('Should be called when the name is empty', function () {
            var parsed = parser.parse(['QWERTYUIOPASDFGHJKLZXCVBNM: Message']);
            chai_1.expect(parsed).to.deep.include({ type: chat_1.ChatType.other, message: 'QWERTYUIOPASDFGHJKLZXCVBNM: Message' });
        });
        it('Should not be called for parsed chat', function () {
            var parsed = parser.parse([messages.join1, messages.chat1, messages.command1, messages.leave1]);
            chai_1.expect(parsed.some(function (msg) { return msg.type == chat_1.ChatType.other; }))
                .to.equal(false, 'No other events should be fired for otherwise parsed messages.');
        });
        it('Should be called when the chat does not match a known pattern', function () {
            var parsed = parser.parse(['PVP is now disabled']);
            chai_1.expect(parsed).to.deep.include({ type: chat_1.ChatType.other, message: 'PVP is now disabled' });
        });
    });
    describe('Username parsing', function () {
        it('Should use the online list', function () {
            online.push('TEST: TEST');
            chai_1.expect(parser.parse(['TEST: TEST: A: Hi'])[0].name)
                .to.equal('TEST: TEST');
        });
        it('Should take the longest possible name if the online list does not contain the player\'s name', function () {
            chai_1.expect(parser.parse(['TEST: TEST: A: Hi']))
                .to.deep.include({ type: chat_1.ChatType.message, name: 'TEST: TEST: A', message: 'Hi' });
        });
    });
});
