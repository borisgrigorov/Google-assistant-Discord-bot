const { rejects } = require("assert");
const { writeFileSync } = require("fs");
const { OAuth2Client } = require("google-auth-library");
const { resolve } = require("path");
const User = require("./config/user");

const getAuthorizationCode = (oAuth2Client) =>
    new Promise((resolve) => {
        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: "https://www.googleapis.com/auth/assistant-sdk-prototype",
        });
        resolve(authorizeUrl);
        return;
    });

const getRefreshToken = async (oAuth2Client, code) => {
    return new Promise(async (resolve, reject) => {
        const { tokens } = await oAuth2Client.getToken(code);
        resolve(tokens.refresh_token);
        return;
    });
};

const saveToken = async (code, uid, name) => {
    return new Promise(async (resolve, reject) => {
        const {
            installed: { client_id, client_secret },
        } = require("./config/client_secret.json");
        const oAuth2Client = new OAuth2Client(
            client_id,
            client_secret,
            "urn:ietf:wg:oauth:2.0:oob"
        );
        var refresh_token = await getRefreshToken(oAuth2Client, code);
        var user = await User.findOne({uid: uid});
        if(user != null){
          user.token = refresh_token;
          user.waiting = false;
          user.username = name;
          await user.save();
        }
        resolve(true);
        return;
    });
};

const getCredentials = async (uid) => {
    var dUser = await User.findOne({ uid: uid });

    if (dUser == null) {
        var newUser = new User({
            uid: uid,
            waiting: true,
            token: "",
        });
        await newUser.save();
        const {
            installed: { client_id, client_secret },
        } = require("./config/client_secret.json");
        const oAuth2Client = new OAuth2Client(
            client_id,
            client_secret,
            "urn:ietf:wg:oauth:2.0:oob"
        );
        const refresh_token_url = await getAuthorizationCode(oAuth2Client);
        return {
            token: null,
            url: refresh_token_url,
        };
    }
    else if(dUser.waiting == true){
        return {
            token: null,
            url: refresh_token_url,
        };
    } else {
        const {
            installed: { client_id, client_secret },
        } = require("./config/client_secret.json");
        const refresh_token = dUser.token;
        const credentials = {
            type: "authorized_user",
            client_id: client_id,
            client_secret: client_secret,
            refresh_token: refresh_token,
        };
        return {
            token: credentials,
            url: null,
        };
    }
};

module.exports = getCredentials;
module.exports.saveToken = saveToken;
