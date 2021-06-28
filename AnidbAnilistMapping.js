const fetch = require('node-fetch');

class AnidbAnilistMapping {
  static #BASE_URL = 'https://relations.yuna.moe/api';
  static #IDS_URL = `${this.#BASE_URL}/ids`;

  constructor() {
    //   private constructor
  }

  static async getByAniDBId(anidbId) {
    try {
      const res = await fetch(
        `${AnidbAnilistMapping.#IDS_URL}?source=anidb&id=${anidbId}`
      );
      const mapping = await res.json();
      if (mapping.error) {
        throw mapping;
      }
      return [mapping, null];
    } catch (error) {
      return [
        null,
        {
          error,
          message: `Could not fetch Anidb Mapping for id ${anidbId}`,
          timestamp: new Date().toISOString(),
        },
      ];
    }
  }
}

module.exports = AnidbAnilistMapping;
