require('dotenv').config();
const path = require('path');
const express = require('express');
const compression = require('compression')
const session = require('cookie-session')
const { get } = require("axios").default;
const { initOauth, oauth } = require('./login');
const { engine } = require('express-handlebars');
const { getCommands, deleteCommand, updateCommand, registerCommand, getCommand, actiontypes, cmdpattern } = require('./manager');

const app = express();
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.raw());
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
			for(var i = 0; i < commands.length; i++) {
				const cmd = commands[i];
				out += `<div class="row">\n`;
				out += `<div class="col"><kbd><span style="color:var(--bs-info); font-size:medium;">${process.env.PREFIX}</span> <strong>${cmd.name}</strong></kbd></div>\n`
				out += `<div class="col"><span style="color:var(--bs-info) !important; font-size:medium;">${cmd.actions.length}</span> ${cmd.actions.length == 1 ? "ACTION" : "ACTIONS"}</div>\n`
				out += `<div class="col"><span>${`${cmd.owner_name.split(/#/)[0]}`}</span><kdb class="text-muted rounded">#${`${cmd.owner_name.split(/#/)[1]}`}</kdb></div>`
				out += `</div>\n`;
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
			return commands.length;
		},
		eval: function(code) {
			return eval(code);
		}
	}
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'pages/'));

initOauth(app);

app.get("/", async (req, res) => {
	if(req.isAuthenticated()) req.user.commands = await getCommands(req.user).catch(err => res.status(500).send(err));
	res.render("home", {
		profile: req.user || {},
		botprefix: process.env.PREFIX,
		commands: await getCommands().catch(err => res.status(500).send(err))
	});
});
app.get("/commands/:command?", async (req, res) => {
	if(!req.params.command) res.status(301).redirect("/");
	//! TODO: Implement
});
app.get("/users/:hash?", async (req, res) => {
	//! TODO: Implement 
});
app.post("/commands", async (req, res) => {
	if(!req.body) return res.status(401).json({error:"An access_token is required", success:false});
	else if(!req.body.access_token) return res.status(401).json({error:"An access_token is required", success:false});
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
		data.accessToken = req.body.access_token;
		registerCommand(data, req.body.data).then(()=>{
			console.log(`${data.id} registered command "${req.body.data.command}"  --  ${Date.now()}`);
			res.json({success:true});
		}).catch(err=>res.status(400).json({error:err.message||err, success:false}));
	}).catch(err=>res.status(err.response ? err.response.status : 400).json({error:err.message, success:false}));
});
app.patch("/commands/:command", async (req, res) => {
	if(!req.body) return res.status(401).json({error:"An access_token is required", success:false});
	else if(!req.body.access_token) return res.status(401).json({error:"An access_token is required", success:false});
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
		if(!req.params.command) return res.status(400).json({error:"No command provided", success:false});
		data.accessToken = req.body.access_token;
		updateCommand(data, req.params.command, req.body.data).then(()=>{
			console.log(`${data.id} updated command "${req.params.command}"  --  ${Date.now()}`);
			res.json({success:true});
		}).catch(err=>res.status(400).json({error:err.message||err, success:false}));
	}).catch(err=>res.status(err.response ? err.response.status : 400).json({error:err.message, success:false}));
});
app.delete("/commands/:command", async (req, res) => {
	if(!req.body) return res.status(401).json({error:"An access_token is required", success:false});
	else if(!req.body.access_token) return res.status(401).json({error:"An access_token is required", success:false});
	else if(!req.params.command) return res.status(400).json({error:"No command provided", success:false});
	get("https://discordapp.com/api/users/@me", {
		headers: {
			Authorization: `Bearer ${req.body.access_token}`
		}
	}).then(({data})=>{
		if(!data.username || !data.email) return res.status(400).json({error:"No idenitify or email scope", success:false});
		if(!req.params.command) return res.status(400).json({error:"No command provided", success:false});
		data.accessToken = req.body.access_token;
		deleteCommand(data, req.params.command).then(()=>{
			console.log(`${data.id} deleted command "${req.params.command}"  --  ${Date.now()}`);
			res.json({success:true});
		}).catch(err=>res.status(400).json({error:err.message||err, success:false}));
	}).catch(err=>res.status(err.response ? err.response.status : 400).json({error:err.message, success:false}));
});

function startServer() {
	app.listen(process.env.PORT, () => {
		console.log(`Started web listening on port ${process.env.PORT}`);
	});
}

module.exports = startServer;