const fetch = require('node-fetch');
const AppError = require('./AppError');

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
        throw new Error(JSON.stringify(mapping));
      }
      return mapping;
    } catch (error) {
      throw new AppError(
        `Could not fetch Anidb Mapping for id ${anidbId}`,
        error
      );
    }
  }
}

module.exports = AnidbAnilistMapping;
