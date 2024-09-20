const axios = require('axios');
const Logger = require('../logger');

const DESTINY2_URL = 'https://www.bungie.net/Platform/Destiny2/'
const USER_URL = 'https://www.bungie.net/Platform/User/'
const GROUP_URL = 'https://www.bungie.net/Platform/GroupV2/'

var logger = new Logger();

class API {
    constructor(api_key) {
        this.api_key = api_key
    }

    async _getRequest(url) {
        const HEADERS = {'X-API-KEY': this.api_key};
        try {
            const response = await axios.get(url, {headers: HEADERS});
            return response;
        } catch (error) {
            logger.logError(`Could not send GET request to bungie API.`, error);
            throw error;
        }
    }

    async _getReqWithHeaders(url, headers) {
        try {
            const response = await axios.get(url, {headers: headers});
            return response;
        } catch (error) {
            logger.logError(`Could not send GET request to bungie API.`, error);
            throw error;
        }
    }

    async _postRequest(url, data) {
        const HEADERS = {'X-API-KEY': this.api_key};
        try {
            const response = await axios.post(url, data, {headers: HEADERS});
            return response;
        } catch (error) {
            logger.logError("Could not send POST request to bungie API.", error);
            throw error;
        }
    }

    async postGlobalName(display_name, page) {
        logger.logInfo(`Sending GlobalName POST Request for ${display_name} page ${page}`);
        const json_data = {'displayNamePrefix': display_name};
        return await this._postRequest(
            `${USER_URL}Search/GlobalName/${page}/`,json_data
        )
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