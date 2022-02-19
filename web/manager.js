const { gzip } = require('pako');
const sha256 = require('crypto-js').SHA256;
const fs = require('fs');
const getCommand = require("../common/getCommand");
const getCommands = require("../common/getCommands");

const cmdpattern = /^[a-zA-Z0-9_\-~\$\!]+$/i;
const actiontypes = new RegExp([
	"message",
	"dm",
	"react",
	"delay",
	"embed",
	"edit",
	"delete",
].join("|"));

async function registerCommand(profile, commandData) {
	if(await getCommand(commandData.command).catch(()=>{})) throw "Command already exists";
	const hash = `${sha256(`${profile.username}+${profile.email}`).toString()}@${sha256(profile.accessToken).toString()}`;
	
	commandData.by = {username:profile.username, discriminator:profile.discriminator};
	commandData.at = new Date();
	const db = getCommands();
	if(db[hash]) db[hash].push(commandData);
	else db[hash] = [commandData];
	
	fs.writeFileSync(`${__dirname}/../commands.gz`, gzip(JSON.stringify(db)));
}

module.exports = {registerCommand, getCommand, getCommands, actiontypes, cmdpattern};