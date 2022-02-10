const { gzip, ungzip } = require('pako');
const sha256 = require('crypto-js').SHA256;
const fs = require('fs');

function registerCommand(profile, commandData) {
	const hash = sha256(`${profile.username}+${profile.email}`).toString();
	if(getCommand(commandData.command)) return;
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
	const hash = sha256(`${profile.username}+${profile.email}`).toString();
	if(db[hash]) return db[hash];
	return [];
}

function countCommands() {
	const db = getCommands()
	let count = 0;
	Object.keys(db).forEach(hash => {
		count += db[hash].length;
	});
	return count;
}

console.log(getCommand("test"))
module.exports = {registerCommand, getCommand, getCommands};