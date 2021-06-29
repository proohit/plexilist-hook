const AnilistClient = require('./AniListClient');
const AnidbAnilistMapping = require('./AnidbAnilistMapping');
const config = require('./config.json');
const logger = require('./logger');
const AppError = require('./AppError');

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
  const user = config.anilistUsers.find(
    (userMapping) => userMapping.plexName === username
  );
  if (!user || !user.anilistToken) {
    throw new AppError(`Plex User ${username} has no AniList entry`);
  }
  const AniList = new AnilistClient(user.anilistToken);
  const mapping = await AnidbAnilistMapping.getByAniDBId(anidbId);
  const { anilist: anilistId } = mapping;
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
  return anidbIdRegExp.exec(guid)[0].split('-')[1];
}

function calculateStatus(currentEpisode, maxEpisodes) {
  if (currentEpisode >= maxEpisodes) {
    status = 'COMPLETED';
  } else if (currentEpisode < maxEpisodes) {
    status = 'CURRENT';
  } else {
    status = null;
  }
  return status;
}

module.exports = {
  handleScrobble,
};
