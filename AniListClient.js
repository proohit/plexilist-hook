const fetch = require('node-fetch');
const AppError = require('./AppError');

class AnilistClient {
  #accessToken;

  constructor(accessToken) {
    this.#accessToken = accessToken;
  }

  async saveListMediaEntry(id, { progress, status }) {
    const mutation = `mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus) {
      SaveMediaListEntry(mediaId: $mediaId, progress: $progress, status: $status) {
        media {
          title {
            romaji
            english
            native
            userPreferred
          }
        }
        progress
      }
    }`;
    const variables = { mediaId: id, progress, status };
    try {
      const data = await this.fetch(mutation, variables);
      return data;
    } catch (error) {
      throw new AppError(
        `Couldn't update list entry media for context ${JSON.stringify(
          variables
        )}`,
        error
      );
    }
  }

  async queryMedia(id) {
    const query = `query ($id: Int) {
        Media(id: $id, type: ANIME) {
          episodes
        }
      }
      `;
    const variables = { id };
    try {
      const data = await this.fetch(query, variables);
      if (!data.Media || data.errors) {
        throw new Error(JSON.stringify(data));
      }
      return data.Media;
    } catch (error) {
      throw new AppError(`Couldn't query media for id ${id}`, error);
    }
  }

  async fetch(query, variables) {
    const body = {};
    if (query) {
      body.query = query;
    }
    if (query && variables) {
      body.variables = variables;
    }
    const url = 'https://graphql.anilist.co';
    const options = {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.#accessToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    };

    const res = await fetch(url, options);
    const json = await res.json();
    if (!json.data || json?.errors?.length > 0) {
      throw new Error(JSON.stringify(json.errors));
    }
    return json.data;
  }
}

module.exports = AnilistClient;
