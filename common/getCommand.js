const getCommands = require("./getCommands");

async function getCommand(nameOrId) {
	return new Promise((resolve, reject) => {
		getCommands().then(commands => {
			let res;
			if(typeof nameOrId === "string") res = commands.find(c => c.name === nameOrId);
			else res = commands.find(c => c.id === nameOrId);
			
			if(!res) return reject("Command not found");
			else resolve(res);
		}).catch(err => reject(err));
	});
}

module.exports = getCommand;