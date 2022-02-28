const Action = require("./Action");
const Argument = require("./Argument");
const { MessageAttachment } = require("discord.js");

class Command {
	constructor(name, actions, args) {
		this.name = name;
		this.actions = actions;
		//! this.args = args;
	}

	get objectData() {
		return {...this};
	}

	get owner() {
		
	}

	async exec(origin) {
		return new Promise((resolve, reject) => {
			var actIndex = 0;
			if(this.actions.length === 0) return reject({content:"...what??", files:[new MessageAttachment("damn.png")]});
			console.log(`[${origin.author.username+"#"+origin.author.discriminator}: <COMMAND ${this.name}>] Executing command "${this.name}"`);
			this.actions.forEach(action => {
				actIndex++;
				try {action.exec(origin);console.log(`     <ACTION ${action.type.toLowerCase()}> action  \u001b[1;32mpassed ✓\u001b[0m`);}
				catch(e) {origin.reply(`_\`${actIndex}${(actIndex==1)?"st":(actIndex==2)?"nd":(actIndex==3)?"rd":"th"} action failed.\`_ ${e}`);console.log(`     <ACTION ${action.type.toLowerCase()}> action \u001b[1;31mfailed ✖\u001b[0m`);}				
			});
			resolve();
		});
	}

	static parse(data) {
		return new Command(
			data.name,
			data.actions.map(action => new Action(action.type, action.context)),
			//! data.args.map(param => Argument(...))
			);
	}
}

module.exports = Command;