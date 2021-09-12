const Koa = require('koa');
const Router = require('koa-router');
const body = require('koa-body');

const {
  anilistRedirect,
  handleWebhook,
  addNewAnilistUser,
} = require('./requestHandlers');

const app = new Koa();
const router = new Router();

router.use(body({ multipart: true }));

router.post('/webhook', handleWebhook);

router.get('/anilist-callback', anilistRedirect);

router.post('/anilist-callback', addNewAnilistUser);

app.use(router.routes());

app.listen(3000);
