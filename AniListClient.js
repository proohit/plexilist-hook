const fetch = require('node-fetch');

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
      return [data, null];
    } catch (error) {
      return [
        null,
        {
          error,
          message: `Couldn't update list entry media for context ${{
            ...variables,
          }}`,
          timestamp: new Date().toISOString(),
        },
      ];
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
      return [data.Media, null];
    } catch (error) {
      return [
        null,
        {
          error,
          message: `Couldn't query media for id ${id}`,
          timestamp: new Date().toISOString(),
        },
      ];
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
    if (!json.data && json.errors) {
      throw json.errors;
    }
    return json.data;
  }
}

module.exports = AnilistClient;
