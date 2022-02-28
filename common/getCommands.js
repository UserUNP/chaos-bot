require('dotenv').config();;
const controller = require('mysql');
const sha256 = require('crypto-js').SHA256

async function getCommands(profile) {
	return new Promise(async(resolve, reject) => {
		const db = eval(process.env.DB_CONNECT);
		db.connect((err) => {
			if(err) {db.end();return reject(err)}
			db.query('SELECT commands.id,commands.name,command_actions.type,command_actions.context,commands.owner_name,commands.owner_hash FROM commands JOIN command_actions ON commands.id=command_actions.id', (err, results) => {
				if(err) {db.end();return reject(err)}
				let commands = [];
				if(!profile) {
					results.forEach(result => {
						if(!commands.find(c => c.name === result.name)) {
							commands.push({
								id: result.id,
								name: result.name,
								owner_name: result.owner_name,
								owner_hash: result.owner_hash,
								actions: [{
									type: result.type,
									context: result.context
								}]
							});
						} else {
							commands.find(c => c.name === result.name).actions.push({
								type: result.type,
								context: result.context
							});
						}
					});
				} else {
					const hash = `${sha256(`${profile.id}+${profile.email}`).toString()}@${sha256(`${profile.accessToken}`).toString()}`;
					results.forEach(result => {
						if(!commands.find(c => c.name === result.name) && result.owner_hash === hash) {
							commands.push({
								id: result.id,
								name: result.name,
								owner_name: result.owner_name,
								owner_hash: result.owner_hash,
								actions: [{
									type: result.type,
									context: result.context
								}]
							});
						} else if(result.owner_hash === hash) {
							commands.find(c => c.name === result.name).actions.push({
								type: result.type,
								context: result.context
							});
						}
					});
				}
				resolve(commands);
				db.end();
			});
		});
	});
}

module.exports = getCommands;