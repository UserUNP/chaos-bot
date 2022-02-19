const Parameter = require("./Parameter");

class Action {
	constructor(type, context) {
		this.type = type;
		this.context = context;
		//! this.params = params;
	}

	getObjectData() {
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
					// TODO
					break;
				case "embed":
					break; // TODO
				case "edit":
					break; // TODO
				case "delete":
					break; // TODO
				default:
					break;
			}
		} catch(e) {
			throw `\`\`\`${e?.message || (e??"`Unknocn error occured.`") }\`\`\``;
		}
	}
}

module.exports = Action;