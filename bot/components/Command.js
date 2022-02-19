const Action = require("./Action");
const Parameter = require("./Parameter");
const { MessageAttachment } = require("discord.js");

class Command {
	constructor(name, actions, parameters) {
		this.command = name;
		this.actions = actions;
		//! this.params = parameters;
	}

	getObjectData() {
		return {...this};
	}

	async exec(origin) {
		return new Promise((resolve, reject) => {
			var actIndex = 0;
			if(this.actions.length === 0) return reject({content:"...what??", files:[new MessageAttachment("damn.png")]});
			console.log(`[${origin.author.username+"#"+origin.author.discriminator}: <COMMAND ${this.command}>] Executing command "${this.command}"`);
			this.actions.forEach(action => {
				actIndex++;
				try {action.exec(origin);console.log(`     <ACTION ${action.type.toLowerCase()}> action  \u001b[1;32mpassed ✓\u001b[0m`,action.getObjectData());}
				catch(e) {origin.reply(`${actIndex}${(actIndex==1)?"st":(actIndex==2)?"nd":(actIndex==3)?"rd":"th"} action failed. ${e}`);console.log(`     <ACTION ${action.type.toLowerCase()}> action \u001b[1;31mfailed ✖\u001b[0m`,action.getObjectData());}				
			});
			resolve();
		});
	}

	static parse(data) {
		return new Command(
			data.command,
			data.actions.map(action => new Action(action.type, action.context)),
			//! data.params.map(param => Parameter(...))
			);
	}
}

module.exports = Command;