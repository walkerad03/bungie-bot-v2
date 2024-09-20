const express = require('express');
const config = require('../../../config.json');
const querystring = require('querystring');
const axios = require('axios');

const Logger = require('../logger');

var logger = new Logger();

class OAuthServer {
    constructor(port = 3000, tokenCallback) {
        this.app = express();
        this.port = port;
        this.server = null;
        this.clientId = config.oauth_client_id;

        this.app.get('/auth/callback', (req, res) => this.handleAuthCallback(req, res));
        this.tokenCallback = tokenCallback;
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            logger.logInfo(`OAuth Server running at http://localhost:${this.port}.`);
        })
    }

    getAuthUrl(state) {
        const url = `https://www.bungie.net/en/OAuth/Authorize?client_id=${this.clientId}&response_type=code&state=${state}`;
        return url;
    }

    async getOAuthTokenFromCode(code) {
        const tokenUrl = `https://www.bungie.net/platform/app/oauth/token/`;
        const body = querystring.stringify({
            grant_type: "authorization_code",
            code: code,
            client_id: this.clientId,
        });

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        const response = await axios.post(tokenUrl, body, { headers });
        return response.data;
    }

    async handleAuthCallback(req, res) {
        const authCode = req.query.code;
        const state = req.query.state;

        if (!authCode) {
            return res.status(400).send('Authorization code missing');
        }
        logger.logInfo(`OAuth Code: ${authCode}, State: ${state}`);

        try {
            const tokenRes = await this.getOAuthTokenFromCode(authCode);
            const token = tokenRes.access_token;

            logger.logInfo(`Got access token: ${token}`);

            this.tokenCallback(token);
        } catch (error) {
            logger.logError(`Couldn't exchange auth code "${authCode}" for token.`);
            res.status(500).send('Error exchanging authorization code for token');
        }

        res.send(`You can close this page!`);
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                logger.logInfo("OAuth server stopped.");
            })
        } else {
            logger.logWarn("OAuth server stop was triggered while server was not running.");
        }
    }
}

module.exports = OAuthServer;