import { Application, Router } from "oak/mod.ts";
import { OAuth2Client } from "oauth2_client/mod.ts";
import { Session } from "oak_sessions/mod.ts";
import * as base64 from "std/encoding/base64.ts";
import * as dotenv from "std/dotenv/mod.ts";
import { getRandomString } from "./utils.ts";


const env = await dotenv.load();

const oauth2Client = new OAuth2Client({
	clientId: env.CHATWORK_OAUTH_CLIENT_ID,
	clientSecret: env.CHATWORK_OAUTH_CLIENT_SECRET,
	redirectUri: "https://ryzensphere.tail28ea5.ts.net/callback",
	tokenUri: "https://oauth.chatwork.com/token",
	authorizationEndpointUri:
		"https://www.chatwork.com/packages/oauth2/login.php",
	defaults: {
		scope: "",
	},
});

type AppState = {
	session: Session;
};

const router = new Router<AppState>();

router.get("/", async (ctx) => {
	// generate state
	const state = getRandomString(10);

	// save state to session
	ctx.state.session.flash("state", state);

	// generate authorization uri
	const { uri } = await oauth2Client.code.getAuthorizationUri({
		disablePkce: true,
		state,
		scope: [
			"rooms.messages:write",
			"users.profile.me:read",
		],
	});

	ctx.response.redirect(uri);
});

router.get("/callback", async (ctx) => {
	// get state from session
	const state = ctx.state.session.get("state");
	if (typeof state !== "string") {
		throw new Error("Invalid state");
	}

	// generate auth header
	const authHeader = `Basic ${base64.encodeBase64(
		`${oauth2Client.config.clientId}:${oauth2Client.config.clientSecret}`,
	)}`;

	const token = await oauth2Client.code.getToken(ctx.request.url, {
		state,
		requestOptions: {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: authHeader,
			},
		},
	});
	
	
});

const app = new Application<AppState>();
app.use(Session.initMiddleware());
app.use(router.allowedMethods(), router.routes());

console.log("Server running on http://localhost:8080");
await app.listen({ port: 8080 });
