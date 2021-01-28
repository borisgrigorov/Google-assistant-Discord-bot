const { Assistant, AssistantLanguage } = require("nodejs-assistant");
const credentials = require("./credentials");
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config/config.json");
const db = require("./config/db");
const User = require("./config/user");
const user = require("./config/user");

client.on("ready", () => {
    console.log("Logged in as user " + client.user.tag);
});

client.on("message", async (msg) => {
    if (msg.author != client.user) {
        var u = await User.findOne({ uid: msg.author.id });
        if (msg.channel.type == "dm" && u != null && u.waiting == true) {
            if (/(.{32})/.test(msg.content)) {
                msg.channel.startTyping();
                await credentials.saveToken(
                    msg.content.match(/(.{62})/)[0],
                    msg.author.id,
                    msg.author.username
                );
                await msg.reply("Your token has been saved. Enjoy.");
                msg.channel.stopTyping();
                return;
            }
        }
        if (msg.content.startsWith(">>")) {
            msg.channel.startTyping();
            question = msg.content.replace(">>", "").trim();
            var response = await askAssistant(question, msg.author.id, msg.author.username);
            if (response.ok == true) {
                await msg.channel.send(response.resp);
                msg.channel.stopTyping();
            } else if (response.ok == false && response.setup == false) {
                await msg.reply(response.resp);
                await msg.author.send(
                    "Hello, to setup your account go to " +
                        response.url
                );
                await msg.author.send("Then send me your token. (Without prefix)")
            }
            msg.channel.stopTyping();
        }
    }
});

client.login(config.token);

async function askAssistant(question, id, username) {
    return new Promise(async (resolve, reject) => {
        const creds = await credentials(id, username);
        if (creds.token == null) {
            resolve({
                resp: "Your account is not set up yet, check DM",
                ok: false,
                setup: false,
                url: creds.url,
            });
            return;
        } else {
            console.log("User " + username + " asked: " + question);
            const assistant = new Assistant(creds.token, {
                deviceId: "test device",
                deviceModelId: "test device model",
                locale: AssistantLanguage.ENGLISH,
            });
            const response = await assistant.query(question);
            console.log("Assistant response: ", response.text);
            resolve({
                resp: response.text || "Sorry, but I can not do this.",
                ok: true,
                setup: true,
            });
            return;
        }
    });
}
db();
