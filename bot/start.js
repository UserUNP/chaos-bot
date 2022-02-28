require('dotenv').config();
const { Client, Intents } = require('discord.js');
const getCommand = require('../common/getCommand');
const getCommands = require('../common/getCommands');
const Action = require('./components/Action');
const Command = require('./components/Command');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});

client.once('ready', () => {
	console.log('Bot is ready');
});

client.on("messageCreate", async (message) => {
	if(message.author.bot) return;
	const cmdname = (message.content.match(new RegExp(`^${process.env.PREFIX}([a-zA-Z0-9_\-~\$\!]*)`))??"")[1];
	if(!cmdname) return;
	const cmddata = await getCommand(cmdname).catch(e => {message.reply(`\`\`\`${e?.message || (e??"`Unknocn error occured.`") }\`\`\``);return;});
	if(!cmddata) return;
	const command = Command.parse(cmddata);
	// new Action("message", `\`\`\`json\n${JSON.stringify(command,null,4)}\`\`\``).exec(message);
	command.exec(message).catch(e => message.reply(`\`\`\`${e?.message || (e??"`Unknocn error occured.`") }\`\`\``));
	
});

function startBot() {
	client.login(process.env.TOKEN);
}

module.exports = startBot;