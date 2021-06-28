const Koa = require('koa');
const Router = require('koa-router');
const body = require('koa-body');
const AnilistClient = require('./AniListClient');
const PlexWebHookEvent = require('./PlexWebHookEvent');
const AnidbAnilistMapping = require('./AnidbAnilistMapping');
const config = require('./config.json');
const logger = require('./logger');

const app = new Koa();
const router = new Router();

router.use(body({ multipart: true }));

router.post('/webhook', async (ctx) => {
  const webhookEvent = new PlexWebHookEvent(ctx.request.body.payload);
  if (!shouldHandle(webhookEvent)) {
    return;
  }

  const {
    event,
    Account: { title: username },
    Metadata: {
      grandparentTitle: title,
      parentIndex: season,
      index: episode,
      guid,
    },
  } = webhookEvent;

  logger.info({ event, username, title, season, episode, guid });
  try {
    const anidbId = getAnidbId(guid);
    const user = config.anilistUsers.find(
      (userMapping) => userMapping.plexName === username
    );
    const AniList = new AnilistClient(user.anilistToken);
    const [mapping, mappingError] = await AnidbAnilistMapping.getByAniDBId(
      anidbId
    );
    if (mappingError) {
      logger.error(mappingError);
      return;
    }
    const { anilist: anilistId } = mapping;
    const [anime, queryError] = await AniList.queryMedia(anilistId);
    if (queryError) {
      logger.error(queryError);
      return;
    }
    let status = calculateStatus(episode, anime.episodes);
    if (!status) return;
    const [, saveListError] = await AniList.saveListMediaEntry(anilistId, {
      progress: episode,
      status,
    });
    if (saveListError) {
      logger.error(saveListError);
    }
  } catch (error) {
    logger.error(error);
  }
});

app.use(router.routes());

app.listen(3000);

function shouldHandle(event) {
  if (event.event !== 'media.scrobble') {
    return false;
  }
  if (event.Metadata.type !== 'episode') {
    return false;
  }
  if (event.Metadata.librarySectionTitle !== 'Anime') {
    return false;
  }
  return true;
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
