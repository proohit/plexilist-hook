const Koa = require('koa');
const fs = require('fs');
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

router.get('/anilist-callback', (ctx) => {
  ctx.body = fs.createReadStream('redirect.html');
  ctx.type = 'html';
  ctx.res.statusCode = 200;
});

router.post('/anilist-callback', (ctx) => {
  const { plexName, access_token } = ctx.request.body;
  ctx.response.status = 400;
  ctx.response.type = 'text/plain';
  ctx.response.body = 'Unknown error occured';
  if (!access_token) {
    ctx.response.body =
      'Missing access token. Visit https://anilist.co/api/v2/oauth/authorize?client_id={clientID}&response_type=token to get a token';
    return;
  }
  if (!plexName) {
    ctx.response.body = 'Missing plex name.';
    return;
  }
  const config = JSON.parse(fs.readFileSync('config.json'));
  const newUser = { plexName, anilistToken: access_token };
  let newUsers = [...config['anilistUsers']];
  if (newUsers.find((user) => user.plexName === plexName)) {
    newUsers = newUsers.filter((user) => user.plexName !== plexName);
    newUsers.push(newUser);
    ctx.response.status = 201;
    ctx.response.body = 'Your user has been updated';
  } else {
    newUsers.push(newUser);
    ctx.response.status = 201;
    ctx.response.body = 'You have been added to the plexilist hook';
  }
  config['anilistUsers'] = newUsers;
  fs.writeFileSync('config.json', JSON.stringify(config));
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
