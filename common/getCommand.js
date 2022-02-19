const getCommands = require("./getCommands");

async function getCommand(commandName) {
	return new Promise((resolve, reject) => {
		const db = getCommands()
		let cmd;
		Object.keys(db).forEach(hash => {
			db[hash].forEach(command => {
				if(command.command === commandName) cmd=command;
			});
		});
		if(!cmd) return reject("Command not found");
		else resolve(cmd);
	});
}

module.exports = getCommand;