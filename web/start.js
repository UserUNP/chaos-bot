const path = require('path');
const express = require('express');
const session = require('express-session')
const { initOauth, oauth } = require('./login');
const { engine } = require('express-handlebars');
const { getCommands, registerCommand, getCommand } = require('./cmdmanager');

const app = express();
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.engine('handlebars', engine({
	defaultLayout: 'main',
	helpers: {
		json: (obj) => JSON.stringify(obj),
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
		count: function(ctx) {
			if(typeof ctx === 'object') return Object.keys(ctx).length;
			if(typeof ctx === "string") return ctx.length;
			return 0;	
		},
		eval: function(code) {
			return eval(code);
		},
	}
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'pages/'));

initOauth(app);

app.get("/", (req, res) => {
	if(req.isAuthenticated()) req.user.commands = getCommands(req.user);
	if(req.isAuthenticated()) registerCommand(req.user, {
		command: "test",
		actions: [
			{
				action: "message",
				message: "Hello World!"
			}
		],
		usage: "test"
	});
	res.render("home", {
		profile: {...req.user},
	});
});
app.get("/commands", (req, res) => {
	res.json(getCommands());
});
app.get("/commands/:command", (req, res) => {
	const command = getCommand(req.params.command);
	if(!command) return res.status(404).json({error:"Command not found"});
	res.json(command);
});

function startServer() {
	app.listen(3500, () => {
		console.log("Started web listening on port 3500");
	});
}

module.exports = startServer;