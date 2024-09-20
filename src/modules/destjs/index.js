const API = require("./api");
const Logger = require("../logger");

var logger = new Logger();

class DestJS {
    constructor(api_key) {
        this.api = new API(api_key);
    }

    async getMembershipDetailsFromAccessToken(token) {
        const res = await this.api.getMembershipsForCurrentUser(token);

        const primary_membership_id = res.data.Response.primaryMembershipId;
        const memberships = res.data.Response.destinyMemberships;

        for (const mem of memberships) {
            if (mem.membershipId != primary_membership_id) {
                continue;
            }

            return [{
                membershipId: mem.membershipId,
                membershipType: mem.membershipType
            }];
        }
    }

    async getMembershipDetailsFromBungieID(bungie_id) {
        const [bungieGlobalDisplayName, bungieGlobalDisplayNameCode] = bungie_id.split('#');
        let page = 0;

        try {
            while (true) {
                let res = await this.api.postGlobalName(bungieGlobalDisplayName, page);
    
                const searchResults = res.data.Response.searchResults;
                
                if (searchResults.length == 0) {
                    logger.logWarn(`No results found for ${bungie_id}. Skipping.`);
                    return [{membershipId: null, membershipType: null}];
                }
    
                for (const item of searchResults) {
                    for (const membership of item.destinyMemberships) {
                        const code_to_check = membership.bungieGlobalDisplayNameCode;
                        if (parseInt(bungieGlobalDisplayNameCode, 10) == parseInt(code_to_check, 10)) {
                            return [{
                                membershipId: membership.membershipId,
                                membershipType: membership.membershipType
                            }]
                        }
                    }
                }
    
                if (!res.data.Response.hasMore) {
                    logger.logWarn(`No more pages found for ${bungie_id}. Skipping.`);
                    return [{membershipId: null, membershipType: null}];
                }
    
                page += 1;
            }
        } catch (error) {
            logger.logError("Failed to search for membership details", error);
            return [{membershipId: null, membershipType: null}];
        }
    }

    /**
     * returns the time since a player was online.
     * @param {string} membership_type membership type identifier
     * @param {string} membership_id unique membership hash
     * @returns time since the user was online in days
     */
    async getTimeSinceOnline(membership_type, membership_id) {
        const res = await this.api.getProfile(membership_type, membership_id, [100]);
        
        const last_played = new Date(res.data.Response.profile.data.dateLastPlayed);
        const now = new Date();

        const diff_ms = now - last_played;
        const diff_day = diff_ms / 86400000

        return diff_day;
    }

    async getCharacters(membership_type, membership_id) {
        const res = await this.api.GetHistoricalStatsForAccount(membership_type, membership_id);
        const historical_stats = res.data.Response;

        let characters = [];
        for (const char of historical_stats.characters) {
            characters.push(char.characterId);
        }

        return characters;
    }

    async getTeamScorchedStats(membership_type, membership_id) {
        const characters = await this.getCharacters(membership_type, membership_id);

        let results = [];
        let total_kills_assists = 0;
        let total_time_played = 0;
        let total_deaths = 0;
        let most_kills_per_game = 0;

        for (const character_id of characters) {
            const res = await this.api.getActivityHistory(membership_type, membership_id, character_id, 0, 62, 250);

            if (!('activities' in res.data.Response)) {
                break;
            }

            for (let i = 0; i < res.data.Response.activities.length; i++) {
                const activity = res.data.Response.activities[i];

                total_kills_assists += activity.values.opponentsDefeated.basic.value;
                total_time_played += activity.values.timePlayedSeconds.basic.value;
                total_deaths += activity.values.deaths.basic.value;

                if (most_kills_per_game < activity.values.opponentsDefeated.basic.value) {
                    most_kills_per_game = activity.values.opponentsDefeated.basic.value;
                }
            }
        }

        results.total_kills_assists = total_kills_assists;
        results.total_time_played = total_time_played;
        results.total_deaths = total_deaths;
        results.most_kills_per_game = most_kills_per_game;

        return results;
    }

    async getSoloDungeonClears(membership_type, membership_id) {
        const characters = await this.getCharacters(membership_type, membership_id);

        let results = [];

        for (const character_id of characters) {
            let page = 0;

            while (true) {
                const res = await this.api.getActivityHistory(membership_type, membership_id, character_id, page,"dungeon",250);

                if (!('activities' in res.data.Response)) {
                    break;
                }

                for (let i = 0; i < res.data.Response.activities.length; i++) {
                    const activity = res.data.Response.activities[i];

                    const deaths = activity.values.deaths.basic.value;
                    const completed = activity.values.completed.basic.value;
                    const player_count = activity.values.playerCount.basic.value;
                    const period = activity.period;
                    const director_activity_hash = activity.activityDetails.directorActivityHash;
                    
                    if (completed == 1 && player_count == 1) {
                        const activity_definition = await this.api.GetActivityDefinition(director_activity_hash);
                        const pgcr = await this.api.getPGCR(activity.activityDetails.instanceId);

                        if (pgcr.data.Response.activityWasStartedFromBeginning == false) {
                            continue;
                        }

                        results.push({
                            activity_name: activity_definition.data.Response.displayProperties.name,
                            deaths: deaths,
                            director_activity_hash: director_activity_hash,
                            period: period,
                        });
                    }
                }

                page++;
            }
        }

        return results;
    }

    async getLowmanRaidClears(membership_type, membership_id) {
        const characters = await this.getCharacters(membership_type, membership_id);

        let results = [];

        for (const character_id of characters) {
            let page = 0;

            while (true) {
                const res = await this.api.getActivityHistory(membership_type, membership_id, character_id, page, "raid", 250);

                if (!('activities' in res.data.Response) || res.data.Response.activities.length === 0) {
                    break;
                }

                for (let i = 0; i < res.data.Response.activities.length; i++) {
                    const activity = res.data.Response.activities[i];

                    const completed = activity.values.completed.basic.value;

                    const player_count = activity.values.playerCount.basic.value;
                    const period = activity.period;
                    const director_activity_hash = activity.activityDetails.directorActivityHash;
                    
                    if (completed == 1 && player_count <= 3) {
                        const activity_definition = await this.api.GetActivityDefinition(director_activity_hash);
                        const pgcr = await this.api.getPGCR(activity.activityDetails.instanceId);
                        
                        if (pgcr.data.Response.activityWasStartedFromBeginning == false) {
                            continue;
                        }

                        results.push({
                            activity_name: activity_definition.data.Response.displayProperties.name,
                            player_count: player_count,
                            director_activity_hash: director_activity_hash,
                            period: period,
                        });
                    }
                }

                page++;
            }
        }

        return results;
    }

    async updateChallengeRoles(discord, member) {
        const dungeonRoleMappings = {
            "Solo Warlord's Ruin: Standard": "Solo Warlords",
            "Solo Ghosts of the Deep: Standard": "Solo GotD",
            "Solo Spire of the Watcher: Standard": "Solo SotW",
            "Solo Duality: Standard": "Solo Duality",
            "Solo Grasp of Avarice: Standard": "Solo GoA",
            "Solo Prophecy": "Solo Prophecy",
            "Solo Pit of Heresy: Standard": "Solo PoH",
            "Solo The Shattered Throne": "Solo Shattered Throne",

            "SF Warlord's Ruin: Standard": "SF Warlords",
            "SF Ghosts of the Deep: Standard": "SF GotD",
            "SF Spire of the Watcher: Standard": "SF SotW",
            "SF Duality: Standard": "SF Duality",
            "SF Grasp of Avarice: Standard": "SF GoA",
            "SF Prophecy": "SF Prophecy",
            "SF Pit of Heresy: Standard": "SF PoH",
            "SF The Shattered Throne": "SF Shattered Throne",
        }

        const raidRoleMappings = {
            "Trio Last Wish": "Trio LW",
            "Trio Garden of Salvation": "Trio GoS",
            "Trio Deep Stone Crypt": "Trio DSC",
            "Duo Deep Stone Crypt": "Duo DSC",
            "Trio Vault of Glass: Standard": "Trio VoG",
            "Trio Vault of Glass: Master": "Trio VoG: Master",
            "Duo Vault of Glass: Standard": "Duo VoG",
            "Duo Vault of Glass: Master": "Duo VoG: Master",
            "Solo Vault of Glass: Standard": "Solo VoG",
            "Solo Vault of Glass: Master": "Solo VoG: Master",
            "Trio Vow of the Disciple: Standard": "Trio VotD",
            "Trio Vow of the Disciple: Master": "Trio VotD: Master",
            "Trio King's Fall: Standard": "Trio KF",
            "Trio King's Fall: Master": "Trio KF: Master",
            "Duo King's Fall: Standard": "Duo KF",
            "Duo King's Fall: Master": "Duo KF: Master",
            "Trio Root of Nightmares: Standard": "Trio RoN",
            "Trio Root of Nightmares: Master": "Trio RoN: Master",
            "Duo Root of Nightmares: Standard": "Duo RoN",
            "Duo Root of Nightmares: Master": "Duo RoN: Master",
            "Solo Root of Nightmares: Standard": "Solo RoN",
            "Solo Root of Nightmares: Master": "Solo RoN: Master",
            "Trio Crota's End: Standard": "Trio CE",
            "Trio Crota's End: Master": "Trio CE: Master",
            "Duo Crota's End: Standard": "Duo CE",
            "Duo Crota's End: Master": "Duo CE: Master",
        }

        const nickname = member.nickname ?? member.user.username;
        const membershipDetails = await this.getMembershipDetailsFromBungieID(nickname);

        
        if (!Array.isArray(membershipDetails) || membershipDetails.length === 0) {
            logger.logWarn(`No membership details found for ${member.nickname}`);
            return;
        }

        const [{ membershipId: membership_id, membershipType: membership_type }] = membershipDetails;
        const days_since_active = await this.getTimeSinceOnline(membership_type, membership_id);

        if (days_since_active < 14) {
            discord.setRole(member, "Active");
        } else {
            discord.removeRole(member, "Active");
        }

        let solo_dungeons = await this.getSoloDungeonClears(membership_type, membership_id);
        const lowman_raids = await this.getLowmanRaidClears(membership_type, membership_id);
        
        lowman_raids.forEach(item => {
            if (item.player_count == 3) {
                item.activity_name = `Trio ${item.activity_name}`;
            } else if (item.player_count == 2) {
                item.activity_name = `Duo ${item.activity_name}`;
            } else if (item.player_count == 1) {
                item.activity_name = `Solo ${item.activity_name}`;
            }
        });

        for (const key in raidRoleMappings) {
            if (raidRoleMappings.hasOwnProperty(key)) {
                const value = raidRoleMappings[key];

                if (lowman_raids.some(item => item.activity_name === key)) {
                    discord.setRole(member, value);
                } else {
                    discord.removeRole(member, value);
                }
            }
        }

        solo_dungeons.forEach(item => {
            if (item.deaths == 0) {
                item.activity_name = `SF ${item.activity_name}`;
            } else {
                item.activity_name = `Solo ${item.activity_name}`;
            }
        });

        solo_dungeons = solo_dungeons.filter(item => {
            if (item.activity_name.startsWith('SF ')) {
                const soloVersion = item.activity_name.replace('Solo ', 'SF ');
                return !solo_dungeons.some(i => i.activity_name === soloVersion);
            }
            return true;
        });

        for (const key in dungeonRoleMappings) {
            if (dungeonRoleMappings.hasOwnProperty(key)) {
                const value = dungeonRoleMappings[key];

                if (solo_dungeons.some(item => item.activity_name === key)) {
                    discord.setRole(member, value);
                } else {
                    discord.removeRole(member, value);
                }
            }
        }
    }
}

module.exports = DestJS;