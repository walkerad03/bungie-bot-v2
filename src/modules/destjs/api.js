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
                    logger.logWarn(`Attempt ${attempt + 1} failed for GET request to ${url}. Retrying...`);
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
                    logger.logWarn(`Attempt ${attempt + 1} failed for GET request with headers to ${url}. Retrying...`);
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
                    logger.logWarn(`Attempt ${attempt + 1} failed for POST request to ${url}. Retrying...`);
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
                    logger.logWarn(`Attempt ${attempt + 1} failed for POST request to ${url}. Retrying...`);
                    await new Promise(res => setTimeout(res, this.timeout_delay_ms));
                }
            }
        } catch (error) {
            logger.logError(`Could not get GlobalName for ${display_name}: ${error}`);
            return null;
        }
    }

    async getPGCR(activity_id) {
        logger.logInfo(`Getting PGCR for activity ${activity_id}`);
        try {
            for (let attempt = 0; attempt < this.max_attempts; attempt++) {
                try {
                    return await this._getRequest(
                        `${DESTINY2_URL}Stats/PostGameCarnageReport/${activity_id}`
                    );
                } catch (error) {
                    if (attempt === this.max_attempts - 1) throw error;
                    logger.logWarn(`Attempt ${attempt + 1} failed for getPGCR(${activity_id}). Retrying...`);
                    await new Promise(res => setTimeout(res, this.timeout_delay_ms));
                }
            }
        } catch (error) {
            logger.logError(`Could not run getPGCR for ${activity_id}: ${error}`);
            return null;
        }
    }

    async getCharacter(membership_type, membership_id, character_id, components = []) {
        logger.logInfo(`Running getCharacter`);
        try {
            for (let attempt = 0; attempt < this.max_attempts; attempt++) {
                try {
                    const component_str = components.join(',');
                    return await this._getRequest(
                        `${DESTINY2_URL}${membership_type}/Profile/${membership_id}/Character/${character_id}/?components=${component_str}`
                    );
                } catch (error) {
                    if (attempt === this.max_attempts - 1) throw error;
                    logger.logWarn(`Attempt ${attempt + 1} failed for getCharacter(). Retrying...`);
                    await new Promise(res => setTimeout(res, this.timeout_delay_ms));
                }
            }
        } catch (error) {
            logger.logError(`Could not run getCharacter: ${error}`);
            return null;
        }
    }
    
    async getProfile(membership_type, membership_id, components = []) {
        logger.logInfo(`Running getProfile for ${membership_id}`);
        try {
            for (let attempt = 0; attempt < this.max_attempts; attempt++) {
                try {
                    const component_str = components.join(',');
                    return await this._getRequest(
                        `${DESTINY2_URL}${membership_type}/Profile/${membership_id}/?components=${component_str}`
                    );
                } catch (error) {
                    if (attempt === this.max_attempts - 1) throw error;
                    logger.logWarn(`Attempt ${attempt + 1} failed for getProfile(). Retrying...`);
                    await new Promise(res => setTimeout(res, this.timeout_delay_ms));
                }
            }
        } catch (error) {
            logger.logError(`Could not run getProfile for member ${membership_id}: ${error}`);
            return null;
        }
    }

    async getActivityHistory(membership_type, membership_id, character_id, page, mode, count) {
        logger.logInfo(`Running getActivityHistory for member ${membership_id} character ${character_id}`);
        try {
            for (let attempt = 0; attempt < this.max_attempts; attempt++) {
                try {
                    return await this._getRequest(
                        `${DESTINY2_URL}${membership_type}/Account/${membership_id}/Character/${character_id}/Stats/Activities/?page=${page}&mode=${mode}&count=${count}`,
                    );
                } catch (error) {
                    if (attempt === this.max_attempts - 1) throw error;
                    logger.logWarn(`Attempt ${attempt + 1} failed for getActivityHistory(). Retrying...`);
                    await new Promise(res => setTimeout(res, this.timeout_delay_ms));
                }
            }
        } catch (error) {
            logger.logError(`Could not run getActivityHistory for member ${membership_id} character ${character_id}: ${error}`);
            return null;
        }
    }

    async GetHistoricalStatsForAccount(membership_type, membership_id) {
        logger.logInfo(`Running getHistoricalStatsForAccount for member ${membership_id}`);
        try {
            for (let attempt = 0; attempt < this.max_attempts; attempt++) {
                try {
                    return await this._getRequest(
                        `${DESTINY2_URL}${membership_type}/Account/${membership_id}/Stats/`,
                    );
                } catch (error) {
                    if (attempt === this.max_attempts - 1) throw error;
                    logger.logWarn(`Attempt ${attempt + 1} failed for getHistoricalStatsForAccount(). Retrying...`);
                    await new Promise(res => setTimeout(res, this.timeout_delay_ms));
                }
            }
        } catch (error) {
            logger.logError(`Could not get historical stats for member ${membership_id}`, error);
            return null;
        }
    }

    async GetActivityDefinition(director_activity_hash) {
        logger.logInfo(`Running GetActivityDefinition for hash ${director_activity_hash}`);
        try {
            for (let attempt = 0; attempt < this.max_attempts; attempt++) {
                try {
                    return await this._getRequest(
                        `${DESTINY2_URL}Manifest/DestinyActivityDefinition/${director_activity_hash}`
                    );
                } catch (error) {
                    if (attempt === this.max_attempts - 1) throw error;
                    logger.logWarn(`Attempt ${attempt + 1} failed for getActivityDefinition(). Retrying...`);
                    await new Promise(res => setTimeout(res, this.timeout_delay_ms));
                }
            }
        } catch (error) {
            logger.logError(`Could not get activity definition for hash ${director_activity_hash}`, error);
            return null;
        }
    }

    async getAggregateActivityStats(membership_type, membership_id, character_id) {
        logger.logInfo(`Running getAggregateActivityStats for member ${membership_id}, character ${character_id}`);
        try {
            for (let attempt = 0; attempt < this.max_attempts; attempt++) {
                try {
                    return await this._getRequest(
                        `${DESTINY2_URL}${membership_type}/Account/${membership_id}/Character/${character_id}/Stats/AggregateActivityStats/`
                    );
                } catch (error) {
                    if (attempt === this.max_attempts - 1) throw error;
                    logger.logWarn(`Attempt ${attempt + 1} failed for getAggregateActivityStats(). Retrying...`);
                    await new Promise(res => setTimeout(res, this.timeout_delay_ms));
                }
            }
        } catch (error) {
            logger.logError(`Failed to get aggregate activity stats for member ${membership_id} character ${character_id}`, error);
            return null;
        }
    }

    async getMembershipsForCurrentUser(oauth_access_token) {
        logger.logInfo(`Running getMembershipsForCurrentUser with token ${oauth_access_token}`);
        try {
            for (let attempt = 0; attempt < this.max_attempts; attempt++) {
                try {
                    const headers = {
                        'Authorization': `Bearer ${oauth_access_token}`,
                        'X-API-Key': this.api_key
                    };
            
                    return await this._getReqWithHeaders(`${USER_URL}GetMembershipsForCurrentUser/`, headers);
                } catch (error) {
                    if (attempt === this.max_attempts - 1) throw error;
                    logger.logWarn(`Attempt ${attempt + 1} failed for getMembershipsForCurrentUser(). Retrying...`);
                    await new Promise(res => setTimeout(res, this.timeout_delay_ms));
                }
            }
        } catch (error) {
            logger.logError(`Failed to get memberships for user with OAuth token ${oauth_access_token}`, error);
            return null;
        }
    }
}

module.exports = API;