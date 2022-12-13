const fetch = require("node-fetch");
const AppError = require("./AppError");

class AnidbAnilistMapping {
  static #BASE_URL = "https://find-my-anime.dtimur.de/api";

  constructor() {
    //   private constructor
  }

  static async getByAniDBId(anidbId) {
    try {
      const res = await fetch(
        `${AnidbAnilistMapping.#BASE_URL}?provider=AniDB&id=${anidbId}`
      );
      const mapping = await res.json();
      if (mapping.error) {
        throw new Error(JSON.stringify(mapping));
      }
      if (Array.isArray(mapping) && mapping.length > 0) {
        return mapping[0];
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
