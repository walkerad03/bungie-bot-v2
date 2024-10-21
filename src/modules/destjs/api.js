const axios = require('axios');
const Logger = require('../logger');

const DESTINY2_URL = 'https://www.bungie.net/Platform/Destiny2/'
const USER_URL = 'https://www.bungie.net/Platform/User/'
const GROUP_URL = 'https://www.bungie.net/Platform/GroupV2/'

var logger = new Logger();

class API {
    constructor(api_key, max_attempts=3, timeout_delay_ms=1000) {
        this.api_key = api_key;
        this.max_attempts = max_attempts;
        this.timeout_delay_ms = timeout_delay_ms;
    }

    async _getRequest(url) {
        const HEADERS = {'X-API-KEY': this.api_key};
        try {
            for (let attempt = 0; attempt < this.max_attempts; attempt++) {
                try {
                    const response = await axios.get(url, {headers: HEADERS});
                    return response;
                } catch (error) {
                    if (attempt === this.max_attempts - 1) throw error;
                    logger.logError(`Attempt ${attempt + 1} failed for GET request to ${url}. Retrying...`);
                    await new Promise(res => setTimeout(res, this.timeout_delay_ms));
                }
            }
        } catch (error) {
            logger.logError(`Could not send GET request to ${url}: ${error}`);
            return null;
        }
    }

    async _getReqWithHeaders(url, headers) {
        try {
            for (let attempt = 0; attempt < this.max_attempts; attempt++) {
                try {
                    const response = await axios.get(url, {headers: headers});
                    return response;
                } catch (error) {
                    if (attempt === this.max_attempts - 1) throw error;
                    logger.logError(`Attempt ${attempt + 1} failed for GET request with headers to ${url}. Retrying...`);
                    await new Promise(res => setTimeout(res, this.timeout_delay_ms));
                }
            }
        } catch (error) {
            logger.logError(`Could not send GET request with headers to ${url}: ${error}`);
            return null;
        }
    }

    async _postRequest(url, data) {
        const HEADERS = {'X-API-KEY': this.api_key};
        try {
            for (let attempt = 0; attempt < this.max_attempts; attempt++) {
                try {
                    const response = await axios.post(url, data, {headers: HEADERS});
                    return response;
                } catch (error) {
                    if (attempt === this.max_attempts - 1) throw error;
                    logger.logError(`Attempt ${attempt + 1} failed for POST request to ${url}. Retrying...`);
                    await new Promise(res => setTimeout(res, this.timeout_delay_ms));
                }
            }
        } catch (error) {
            logger.logError(`Could not send POST request to ${url}: ${error}`);
            return null;
        }
    }

    async postGlobalName(display_name, page) {
        logger.logInfo(`Sending GlobalName POST Request for ${display_name} page ${page}`);
        try {
            for (let attempt = 0; attempt < this.max_attempts; attempt++) {
                try {
                    const json_data = {'displayNamePrefix': display_name};
                    return await this._postRequest(
                        `${USER_URL}Search/GlobalName/${page}/`,json_data
                    );
                } catch (error) {
                    if (attempt === this.max_attempts - 1) throw error;
                    logger.logError(`Attempt ${attempt + 1} failed for POST request to ${url}. Retrying...`);
                    await new Promise(res => setTimeout(res, this.timeout_delay_ms));
                }
            }
        } catch (error) {
            logger.logError(`Could not get GlobalName for ${display_name}: ${error}`);
            return null;
        }
    }

    async getPGCR(activity_id) {
        return await this._getRequest(
            `${DESTINY2_URL}Stats/PostGameCarnageReport/${activity_id}`
        );
    }

    async getCharacter(membership_type, membership_id, character_id, components = []) {
        const component_str = components.join(',');
        return await this._getRequest(
            `${DESTINY2_URL}${membership_type}/Profile/${membership_id}/Character/${character_id}/?components=${component_str}`
        );
    }
    
    async getProfile(membership_type, membership_id, components = []) {
        const component_str = components.join(',');
        return await this._getRequest(
            `${DESTINY2_URL}${membership_type}/Profile/${membership_id}/?components=${component_str}`
        );
    }

    async getActivityHistory(membership_type, membership_id, character_id, page, mode, count) {
        return await this._getRequest(
            `${DESTINY2_URL}${membership_type}/Account/${membership_id}/Character/${character_id}/Stats/Activities/?page=${page}&mode=${mode}&count=${count}`,
        );
    }

    async GetHistoricalStatsForAccount(membership_type, membership_id) {
        return await this._getRequest(
            `${DESTINY2_URL}${membership_type}/Account/${membership_id}/Stats/`,
        );
    }

    async GetActivityDefinition(director_activity_hash) {
        return await this._getRequest(
            `${DESTINY2_URL}Manifest/DestinyActivityDefinition/${director_activity_hash}`
        )
    }

    async getAggregateActivityStats(membership_type, membership_id, character_id) {
        return await this._getRequest(
            `${DESTINY2_URL}${membership_type}/Account/${membership_id}/Character/${character_id}/Stats/AggregateActivityStats/`
        )
    }

    async getMembershipsForCurrentUser(oauth_access_token) {
        const headers = {
            'Authorization': `Bearer ${oauth_access_token}`,
            'X-API-Key': this.api_key
        };

        return await this._getReqWithHeaders(`${USER_URL}GetMembershipsForCurrentUser/`, headers);
    }
}

module.exports = API;