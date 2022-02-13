require('dotenv').config();
const path = require('path');
const express = require('express');
const compression = require('compression')
const session = require('express-session')
const { get } = require("axios").default;
const { initOauth, oauth } = require('./login');
const { engine } = require('express-handlebars');
const { getCommands, registerCommand, getCommand, actiontypes, cmdpattern } = require('./cmdmanager');

const app = express();
app.use(compression());
app.use(express.json());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.engine('handlebars', engine({
	defaultLayout: 'main',
	helpers: {
		json: (obj) => JSON.stringify(obj),
		obj: (json) => JSON.parse(json),
		ifeq: function(a, b, opts) {
			if (a == b) return opts.fn(this);
			else return opts.inverse(this);
		},
		ifneq: function(a, b, opts) {
			if (a != b) return opts.fn(this);
			else return opts.inverse(this);
		},
		ifgt: function(a, b, opts) {
			if (a > b) return opts.fn(this);
			else return opts.inverse(this);
		},
		iflt: function(a, b, opts) {
			if (a < b) return opts.fn(this);
			else return opts.inverse(this);
		},
		listcmds: function(commands) {
			var out = ``;
			for(var i = 0; i < Object.keys(commands).length; i++) {
				const hash = Object.keys(commands)[i];
				const cmds = commands[hash];
				cmds.forEach(c => {
					out += `<div class="row">\n`;
					out += `<div class="col"><kbd><span style="color:var(--bs-info); font-size:medium;">${process.env.PREFIX}</span> <strong>${c.command}</strong></kbd></div>\n`
					out += `<div class="col"><span style="color:var(--bs-info) !important; font-size:medium;">${c.actions.length}</span> ${c.actions.length == 1 ? "ACTION" : "ACTIONS"}</div>\n`
					out += `<div class="col"><span>${c.by.username}</span><kdb class="text-muted rounded">#${c.by.discriminator}</kdb></div>`
					out += `</div>\n`;
				});
			}
			return out;
		},
		calc: function(lvalue, operator, rvalue, options) {
			if (arguments.length < 4) {
				options = rvalue;
				rvalue = operator;
				operator = "+";
			}
			lvalue = parseFloat(lvalue);
			rvalue = parseFloat(rvalue);
			return {
				"+": lvalue + rvalue,
				"-": lvalue - rvalue,
				"*": lvalue * rvalue,
				"/": lvalue / rvalue,
				"%": lvalue % rvalue
			}[operator];
		},
		count: function(ctx) {
			if(typeof ctx === 'object') return Object.keys(ctx).length;
			if(typeof ctx === "string") return ctx.length;
			if(typeof ctx === "number") return ctx;
			return 0;	
		},
		countcmds: function(commands) {
			var out = 0;
			for(var i = 0; i < Object.keys(commands).length; i++) {
				const hash = Object.keys(commands)[i];
				const cmds = commands[hash];
				out += cmds.length;
			}
			return out;
		},
		eval: function(code) {
			return eval(code);
		}
	}
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'pages/'));

initOauth(app);

app.get("/", (req, res) => {
	if(req.isAuthenticated()) req.user.commands = getCommands(req.user);
	res.render("home", {
		profile: req.user || {},
		botprefix: process.env.PREFIX,
		commands: getCommands()
	});
});
app.get("/commands/:command?", (req, res) => {
	try {
		if(!req.params.command) {
			const commands = getCommands();
			var ret = [];
			for(var i = 0; i < Object.keys(commands).length; i++) {
				const hash = Object.keys(commands)[i];
				const cmds = commands[hash];
				cmds.forEach(c => ret.push(c));
			}
			res.json(ret);
		} else {
			const command = getCommand(req.params.command);
			if(!command) return res.status(404).json({error:"Command not found", success:false});
			res.json(command);
		}
	} catch(err) {
		console.error(err);
		return res.status(500).sendFile(`${__dirname}/500.jpg`);
	}
});
app.get("/users/:hash?", (req, res) => {
	try {
		if(!req.params.hash) res.json(getCommands());
		else {
			const hash = req.params.hash;
			const user = getCommands(hash);
			if(!user) return res.status(404).json({error:"User not found", success:false});
			res.json(user);
		}
	} catch (err) {
		console.error(err);
		return res.status(500).sendFile(`${__dirname}/500.jpg`);
	}

});
app.post("/commands", (req, res) => {
	if(!req.body.access_token) return res.status(401).json({error:"An access_token is required", success:false});
	else if(!req.body.data) return res.status(400).json({error:"No command data provided", success:false});
	else if(!cmdpattern.test(req.body.data.command.trim())) return res.status(400).json({error:"Invalid command characters", success:false});
	else if(!req.body.data.actions) return res.status(400).json({error:"No actions provided"});
	else if(!req.body.data.actions.every(action => action.context.trim() && action.type.trim() && actiontypes.test(action.type.trim()))) return res.status(400).json({error:"Malformed command actions", success:false});
	get("https://discordapp.com/api/users/@me", {
		headers: {
			Authorization: `Bearer ${req.body.access_token}`
		}
	}).then(({data})=>{
		if(!data.username || !data.email) return res.status(400).json({error:"No idenitify or email scope", success:false});
		if(getCommands(data).length >= 10) return res.status(400).json({error:"You have reached the max number of commands", success:false});
		registerCommand(data, req.body.data);
		console.log(`${data.username} registered command "${req.body.data.command}"  --  ${Date.now()}`);
		res.json({success:true});
	}).catch(err=>res.status(err.response ? err.response.status : 400).json({error:err.message, success:false}));
});

function startServer() {
	app.listen(process.env.PORT || 3500, () => {
		console.log("Started web listening on port 3500");
	});
}

module.exports = startServer;