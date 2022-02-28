const Argument = require("./Argument");

class Action {
	constructor(type, context) {
		this.type = type;
		this.context = context;
		//! this.params = params;
	}

	get objectData() {
		return {...this};
	}

	exec(origin) {
		try {
			switch (this.type) {
				case "message":
					origin.reply(`${this.context}`);
					break;
				case "dm":
					origin.author.send(`${this.context}`);
					break;
				case "react":
					[...this.context].forEach(emj=>origin.react(`${emj}`));
					break;
				case "delay":
					if(!parseInt(this.context)) throw "Delay value must be a number";
					break; // TODO
				case "embed":
					break; // TODO
				case "edit":
					break; // TODO
				case "delete":
					break; // TODO
				default:
					throw "You've cought an ultra-rare error.\nThe bug has been tracked, traced and reported to the developers.";
			}
		} catch(e) {
			throw `\`\`\`${e?.message || (e??"`Unknown error occured.`") }\`\`\``;
		}
	}
}

module.exports = Action;