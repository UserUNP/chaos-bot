const { gzip, ungzip } = require('pako');
const sha256 = require('crypto-js').SHA256;
const fs = require('fs');

const cmdpattern = /^[a-zA-Z0-9_\-~\$\!]+$/i;
const actiontypes = new RegExp([
	"message",
	"dm",
	"react",
	"embed",
	"edit",
	"delete",
].join("|"));

function registerCommand(profile, commandData) {
	const hash = sha256(`${profile.accessToken}@${profile.username}+${profile.email}`).toString();
	if(getCommand(commandData.command)) throw new Error(`Command "${commandData.command}" already exists`);
	
	commandData.by = {username:profile.username, discriminator:profile.discriminator};
	const db = getCommands();
	if(db[hash]) db[hash].push(commandData);
	else db[hash] = [commandData];
	
	fs.writeFileSync(`${__dirname}/../commands.gz`, gzip(JSON.stringify(db)));
}

function getCommand(commandName) {
	const db = getCommands()
	let cmd;
	Object.keys(db).forEach(hash => {
		db[hash].forEach(command => {
			if(command.command === commandName) cmd=command;
		});
	});
	return cmd;
}

function getCommands(profile) {
	const db = JSON.parse(ungzip(fs.readFileSync(`${__dirname}/../commands.gz`), { to: 'string' }));
	if(!profile) return db;
	if(typeof profile === "string") {if(db[profile]){return db[profile]}}
	else {
		const hash = sha256(`${profile.accessToken}@${profile.username}+${profile.email}`).toString();
		if(db[hash]) return db[hash];
	}
	return [];
}

module.exports = {registerCommand, getCommand, getCommands, actiontypes, cmdpattern};