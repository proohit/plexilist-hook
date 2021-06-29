const Koa = require('koa');
const Router = require('koa-router');
const body = require('koa-body');
const PlexWebHookEvent = require('./PlexWebHookEvent');
const logger = require('./logger');
const { handleScrobble } = require('./eventHandlers');

const app = new Koa();
const router = new Router();

router.use(body({ multipart: true }));

router.post('/webhook', async (ctx) => {
  try {
    const webhookEvent = new PlexWebHookEvent(ctx.request.body.payload);
    if (!shouldHandle(webhookEvent)) {
      return;
    }
    await handleScrobble(webhookEvent);
  } catch (error) {
    logger.error(error.toString());
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
