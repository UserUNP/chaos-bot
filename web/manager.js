const sha256 = require('crypto-js').SHA256;
const controller = require('mysql');
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
	return new Promise(async (resolve, reject) => {
		const ifexists = await getCommand(commandData.command).catch(()=>{});
		if(ifexists) return reject("Command already exists");
		const hash = `${sha256(`${profile.id}+${profile.email}`).toString()}@${sha256(profile.accessToken).toString()}`;
		
		getCommands().then(_commands => {
			const db = eval(process.env.DB_CONNECT);
			db.connect(() => {
				db.query(`INSERT INTO commands(name,owner_name,owner_hash) VALUES(?,?,?)`, [commandData.command, `${profile.username}#${profile.discriminator}`, hash], (err) => {
					if(err) {db.end();return reject(err)}
					commandData.actions.forEach(action => {
						db.query(`SELECT id FROM commands WHERE name=?`, [commandData.command], (err, results) => {
							if(err) {
								db.query(`DELETE FROM commands WHERE name=?`, [commandData.command], (_err) => {});
								db.end();return reject(err)
							}
							db.query(`INSERT INTO command_actions(id,type,context) VALUES(?,?,?)`, [results[0].id, action.type, action.context], (err) => {
								if(err) {
									db.query(`DELETE FROM commands WHERE name=?`, [commandData.command], (_err) => {});
									db.end();return reject(err)
								}
							});
						});
					});
				});
			});
			resolve();
		}).catch(err => reject(err));
	});
}

async function updateCommand(profile, origin, commandData) {
	return new Promise(async (resolve, reject) => {
		const ifexists = await getCommand(origin).catch(()=>{});
		if(!ifexists) return reject("Command does not exist");
		const hash = `${sha256(`${profile.id}+${profile.email}`).toString()}@${sha256(profile.accessToken).toString()}`;
		if(ifexists.owner_hash != hash) return reject("You do not own this command");

		getCommands().then(_commands => {
			const db = eval(process.env.DB_CONNECT);
			db.connect(() => {
				db.query(`UPDATE commands SET name=? WHERE id=?`, [commandData.command, ifexists.id], (err) => {
					if(err) {db.end();return reject(err)}
					db.query(`DELETE FROM command_actions WHERE id=?`, [ifexists.id], (err) => {
						if(err) {db.end();return reject(err)}
						commandData.actions.forEach(action => {
							db.query(`SELECT id FROM commands WHERE name=?`, [commandData.command], (err, results) => {
								if(err) {
									db.query(`DELETE FROM commands WHERE name=?`, [commandData.command], (_err) => {});
									db.end();return reject(err)
								}
								db.query(`INSERT INTO command_actions(id,type,context) VALUES(?,?,?)`, [results[0].id, action.type, action.context], (err) => {
									if(err) {
										db.query(`DELET FROM commands WHERE name=?`, [commandData.command], (_err) => {});
										db.end();return reject(err);
									}
								});
							});
						});
					});
				});
			});
			resolve();
		}).catch(err => reject(err));
	});
}

async function deleteCommand(profile, command) {
	return new Promise(async (resolve, reject) => {
		const ifexists = await getCommand(command).catch(()=>{});
		if(!ifexists) return reject("Command does not exist");
		const hash = `${sha256(`${profile.id}+${profile.email}`).toString()}@${sha256(profile.accessToken).toString()}`;
		if(ifexists.owner_hash != hash) return reject("You do not own this command");

		getCommands().then(_commands => {
			const db = eval(process.env.DB_CONNECT);
			db.connect(() => {
				db.query(`DELETE FROM commands WHERE name=?`, [command], (err) => {
					if(err) {db.end();return reject(err)}
					db.query(`DELETE FROM command_actions WHERE id=?`, [ifexists.id], (err) => {
						if(err) {db.end();return reject(err)}
					});
				});
			});
			resolve();
		}).catch(err => reject(err));
	});
}

module.exports = {registerCommand, updateCommand, getCommand, getCommands, deleteCommand, actiontypes, cmdpattern};