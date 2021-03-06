'use strict';

const request = require('request-promise');
const logger = require('./logger').getLogger();

const oauthEndpoint = 'https://id.twitch.tv/oauth2',
    helixEndpoint = 'https://api.twitch.tv/helix';

/**
 * Twitch API
 * @constructor
 * @param {object} config The configuration object to access the API.
 * @param {string} config.clientId The client id to be used to access the API.
 * @param {string} config.clientSecret The secret to be used to access the API that requires login. If this is not provided, the restricted methods will thrown an error.
 * @param {object} config.logger The logger object.
 */
function TwitchApi(config) {
    this.config = config || {};
    this.accessToken = null;
    this.logger = config.logger || logger;
}

/**
 * Check if the stream is live.
 * @return {bool} True if the stream is live and false otherwise.
 */
TwitchApi.prototype.isLive = async function(channel) {
    try {
        let data = await this.api.getStreams({
            user_login: channel
        });
        return data.length > 0;
    } catch (err) {
        throw err;
    }
};

/**
 * Validate the access token to make sure it is still valid.
 * @param {string} token The token to be validated
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/authentication/#validating-requests
 */
TwitchApi.prototype.validateAccessToken = async function(token) {
    try {
        var response = await request({
            url: `${oauthEndpoint}/validate`,
            method: 'GET',
            headers: {
                Authorization: 'OAuth ' + token
            }
        });

        return JSON.parse(response);
    } catch (err) {
        throw err;
    }
};

/**
 * Gets a Twitch game information by game ID or name. For a query to be valid, name and/or id must be specified.
 * This method requires no authentication.
 *
 * @param {object} options The parameters to the api call. The parameter object is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-games
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-games
 */
TwitchApi.prototype.getGames = async function(options) {
    try {
        return await _performGetRequest.call(this, 
            'https://api.twitch.tv/helix/games',
            options
        );
    } catch (err) {
        throw err;
    }
};

/**
 * Gets information about active streams. Streams are returned sorted by number of current viewers, in descending order. Across multiple pages of results, there may be duplicate or missing streams, as viewers join and leave streams.
 * This method requires no authentication.
 *
 * @param {object} options The parameters to the api call. The parameter object is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-streams
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-streams
 */
TwitchApi.prototype.getStreams = async function(options) {
    try {
        return await _performGetRequest.call(this, 
            'https://api.twitch.tv/helix/streams',
            options
        );
    } catch (err) {
        throw err;
    }
};

/**
 * Gets metadata information about active streams playing Overwatch or Hearthstone. Streams are sorted by number of current viewers, in descending order. Across multiple pages of results, there may be duplicate or missing streams, as viewers join and leave streams.
 *
 * @param {object} options The parameters to the api call. The parameter object is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-streams-metadata
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-streams-metadata
 */
TwitchApi.prototype.getStreamsMetadata = async function(options) {
    try {
        return await _performGetRequest.call(this, 
            'https://api.twitch.tv/helix/streams/metadata',
            options,
        );
    } catch (err) {
        throw err;
    }
};

/**
 * Gets information about one or more specified Twitch users. Users are identified by optional user IDs and/or login name. If neither a user ID nor a login name is specified, the user is looked up by Bearer token.
 *
 * @todo add optional scope
 *
 * @param {object} options The parameters to the api call. The parameter object is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-users
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-users
 */
TwitchApi.prototype.getUsers = async function(options) {
    try {
        return await _performGetRequest.call(this, 
            'https://api.twitch.tv/helix/users',
            options
        );
    } catch (err) {
        throw err;
    }
};

/**
 * Gets information on follow relationships between two Twitch users. Information returned is sorted in order, most recent follow first. This can return information like "who is lirik following," "who is following lirik,” or “is user X following user Y.”
 * This method requires no authentication.
 *
 * @param {object} options The parameters to the api call. The parameter object is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-users-follows
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-users-follows
 */
TwitchApi.prototype.getUsersFollows = async function(options) {
    try {
        return await _performGetRequest.call(this, 
            'https://api.twitch.tv/helix/users/follows',
            options
        );
    } catch (err) {
        throw err;
    }
};

/**
 * Gets video information by video ID (one or more), user ID (one only), or game ID (one only).
 * This method requires no authentication.
 *
 * @param {object} options The parameters to the api call. The parameter object is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-videos
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-videos
 */
TwitchApi.prototype.getVideos = async function(options) {
    try {
        return await _performGetRequest.call(this, 
            'https://api.twitch.tv/helix/videos',
            options
        );
    } catch (err) {
        throw err;
    }
};

/**
 * Updates the description of the authenticated user.
 * This method requires authentication.
 *
 * @param {string} description The description to be added to the channel.
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-videos
 */
TwitchApi.prototype.updateUser = async function(description) {
    try {
        return await _performPutRequest.call(this, 
            'https://api.twitch.tv/helix/users',
            { description }
        );
    } catch (err) {
        throw err;
    }
};

/**
 * Creates a stream marker for the specified user's stream with the given description.
 * This method requires authentication scope `user:edit:broadcast`.
 * 
 * @param {string|number} userId
 * @param {string?} description
 */
TwitchApi.prototype.createStreamMarker = async function(userAccessToken, userId, description) {
    logger.debug('Creating stream marker');
    try {
        return await request({
            uri: `${helixEndpoint}/streams/markers`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userAccessToken}`
            },
            body: {
                user_id: userId, 
                description
            },
            json: true
        });
    } catch (err) {
        throw err;
    }
}

/**
 * Authenticate the current user and get the access token to be used in the private calls.
 * @return The access token.
 */
TwitchApi.prototype.getAccessToken = async function(scopes = ['user:edit', 'user:read:email']) {
    logger.debug('Getting access token from twitch API.');
    try {
        if (!this.accessToken) {
            var response = await request({
                url: `${oauthEndpoint}/token`,
                method: 'POST',
                form: {
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    grant_type: 'client_credentials',
                    scope: scopes.join(' ')
                },
                json: true
            });

            this.accessToken = response.access_token;
        }
        return this.accessToken;
    } catch (err) {
        throw err;
    }
};

TwitchApi.prototype.refreshUserAccessToken = async function(refreshToken) {
    logger.debug('Refreshing access token via twitch API');
    // if (!userAccessToken) {
    //     throw new Error('Refresh token is not specified.');
    // }

    if (!refreshToken) {
        throw new Error('Refresh token is not specified.');
    }

    let response = await request({
        url: `${oauthEndpoint}/token`,
        method: 'POST',
        form: {
            refresh_token: refreshToken,
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            grant_type: 'refresh_token'
        },
        json: true
    });

    return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token
    };
}

/**
 * @private
 * Perform the get request
 * @param {string} url  The request URL.
 * @param {object} qs The query string object with the parameters.
 */
async function _performGetRequest(url, qs) {
    this.logger.debug(
        'Performing GET request to Twitch API to URL: ' +
            url +
            ' with query string: ' +
            JSON.stringify(qs) +
            ' .'
    );
    try {
        let headers = {
            'Client-ID': this.config.clientId
        };
        if (this.accessToken) {
            headers['Authorization'] = 'Bearer ' + this.accessToken;
        }
        var response = await request({
            url: url,
            method: 'GET',
            headers: headers,
            qs: qs,
            json: true
        });

        if (!response || !response.data) {
            return [];
        } else {
            return response.data;
        }
    } catch (err) {
        throw err;
    }
}

/**
 * @private
 * @param {*} url
 */
async function _performPutRequest(url, body) {
    this.logger.debug(
        'Performing PUT request to Twitch API to URL: ' +
            url +
            ' with body: ' +
            JSON.stringify(body) +
            ' .'
    );
    try {
        let headers = {
            'Client-ID': this.config.clientId,
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        if (this.accessToken) {
            headers['Authorization'] = 'Bearer ' + this.accessToken;
        }

        var response = await request({
            url: url,
            method: 'PUT',
            headers: headers,
            body: body,
            json: true
        });

        if (response.data && response.data.length > 0) {
            return null;
        } else {
            return response;
        }
    } catch (err) {
        throw err;
    }
}

/**
 * @private
 * Perform the POST request
 * @param {string} url The request URL
 * @param {string} clientId The clientId of the app
 * @param {object} body The body of the request
 * @param {string} accessToken The access token sent when making the request
 */
async function _performPostRequest(url, clientId, body, accessToken) {
    logger.debug(
        'Performing POST request to Twitch API to URL: ' +
            url +
            ' with body: ' +
            JSON.stringify(body) +
            ' .'
    );
    try {
        let headers = {
            'Client-ID': clientId,
            'Content-Type': 'application/json'
        };
        if (accessToken) {
            headers['Authorization'] = 'Bearer ' + accessToken;
        }

        var response = await request({
            url: url,
            method: 'POST',
            headers: headers,
            body: body,
            json: true
        });

        if (response.data && response.data.length > 0) {
            return null;
        } else {
            return response;
        }
    } catch (err) {
        throw err;
    }
}

/* test code */
if (process.env.NODE_ENV === 'test') {
    TwitchApi.prototype._performGetRequest = _performGetRequest;
    TwitchApi.prototype._performPutRequest = _performPutRequest;
    TwitchApi.prototype._performPostRequest = _performPostRequest;
}
/* end-test code */

module.exports = TwitchApi;
