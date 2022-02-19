const { ungzip } = require("pako");
const sha256 = require('crypto-js').SHA256;
const fs = require('fs');

function getCommands(profile) {
	const db = JSON.parse(ungzip(fs.readFileSync(`${__dirname}/../commands.gz`), { to: 'string' }));
	if(!profile) return db;

	if(typeof profile === "string") {
		if(!db[profile]) return [];
		return db[profile];
	}
	const hash = `${sha256(`${profile.username}+${profile.email}`).toString()}@${sha256(profile.accessToken).toString()}`;
	if(db[hash]) return db[hash];
	
	return [];
}

module.exports = getCommands;