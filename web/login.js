const passport = require("passport");
const refresh = require('passport-oauth2-refresh');
const { Strategy } = require ("passport-discord");
require('dotenv').config();

passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

const strat = new Strategy({
	clientID: process.env.CLIENT_ID,
	clientSecret: process.env.CLIENT_SECRET,
	callbackURL: process.env.CALLBACK,
	scope: JSON.parse(process.env.SCOPES),
	prompt: "consent"
}, function(accessToken, refreshToken, user, cb) {
	user.refreshToken = refreshToken;
	process.nextTick(() => {
		return cb(null, user);
	});
});

passport.use(strat);
refresh.use(strat);

function initOauth(app) {
	app.use(passport.initialize());
	app.use(passport.session());
	app.get("/login", passport.authenticate("discord", { scope: JSON.parse(process.env.SCOPES), prompt: "consent" }), (req, res) => {});
	app.get("/callback", passport.authenticate("discord", { failureRedirect: "/login" }), (req, res) => {res.redirect("/")});
	app.get("/logout", (req, res) => {req.logout(); res.redirect("/")});
}

function oauth(req, res, next) {
	if (req.isAuthenticated()) return next();
	res.redirect("/login");
}

module.exports = {oauth, initOauth};