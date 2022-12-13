const AnilistClient = require("./AniListClient");
const AnidbAnilistMapping = require("./AnidbAnilistMapping");
const config = require("./config.json");
const logger = require("./logger");
const AppError = require("./AppError");

async function handleScrobble(plexEvent) {
  const {
    event,
    Account: { title: username },
    Metadata: {
      grandparentTitle: title,
      parentIndex: season,
      index: episode,
      guid,
    },
  } = plexEvent;

  logger.info({ event, username, title, season, episode, guid });
  const anidbId = getAnidbId(guid);
  const user = getUserFromConfig(username);
  const AniList = new AnilistClient(user.anilistToken);
  const mapping = await AnidbAnilistMapping.getByAniDBId(anidbId);
  if (!mapping || !mapping.providerMapping.Anilist) {
    logger.info(`No mapping found for ${title} (${anidbId})`);
    return;
  }
  const anilistId = mapping.providerMapping.Anilist;
  const anime = await AniList.queryMedia(anilistId);
  let status = calculateStatus(episode, anime.episodes);
  if (!status) return;
  const { SaveMediaListEntry: data } = await AniList.saveListMediaEntry(
    anilistId,
    {
      progress: episode,
      status,
    }
  );
  logger.info(
    `Updated Media \"${data.media.title.english}\" to episode ${data.progress} for user ${username}`
  );
}

function getAnidbId(guid) {
  const anidbIdRegExp = RegExp(/anidb-\d{1,}/g);
  const result = anidbIdRegExp.exec(guid);
  if (!result || result.length <= 0) {
    throw new AppError(`Couldn't extract anidb id for guid: ${guid}`);
  }

  return result[0].split("-")[1];
}

function calculateStatus(currentEpisode, maxEpisodes) {
  if (currentEpisode >= maxEpisodes) {
    status = "COMPLETED";
  } else if (currentEpisode < maxEpisodes) {
    status = "CURRENT";
  } else {
    status = null;
  }
  return status;
}

async function handleRate(plexEvent) {
  const {
    event,
    Account: { title: username },
    Metadata: { grandparentTitle: title, guid },
    rating: ratingRaw,
  } = plexEvent;
  const rating = Number(ratingRaw) * 10;
  logger.info({ event, username, title, guid, rating });
  const anidbId = getAnidbId(guid);
  const user = getUserFromConfig(username);
  const AniList = new AnilistClient(user.anilistToken);
  const mapping = await AnidbAnilistMapping.getByAniDBId(anidbId);
  const { anilist: anilistId } = mapping;
  const { SaveMediaListEntry: data } = await AniList.saveRating(
    anilistId,
    rating
  );
  logger.info(
    `User ${username} rated Media \"${data.media.title.english}\" to ${data.score} points`
  );
}

function getUserFromConfig(username) {
  const user = config.anilistUsers.find(
    (userMapping) => userMapping.plexName === username
  );
  if (!user || !user.anilistToken) {
    throw new AppError(`Plex User ${username} has no AniList entry`);
  }
  return user;
}

module.exports = {
  handleScrobble,
  handleRate,
};
