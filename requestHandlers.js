const fs = require("fs");
const PlexWebHookEvent = require("./PlexWebHookEvent");
const logger = require("./logger");
const { handleScrobble, handleRate } = require("./eventHandlers");
let config = require("./config.json");

async function handleWebhook(ctx) {
  try {
    const webhookEvent = new PlexWebHookEvent(ctx.request.body.payload);
    if (shouldHandleScrobble(webhookEvent)) {
      await handleScrobble(webhookEvent);
    }
    if (shouldHandleRate(webhookEvent)) {
      await handleRate(webhookEvent);
    }
  } catch (error) {
    logger.error(error.toString());
  }
}

function shouldHandleScrobble(event) {
  if (event.event !== "media.scrobble") {
    return false;
  }

  const isEpisode = event.Metadata.type === "episode";
  const isMovie = event.Metadata.type === "movie";
  if (!isEpisode && !isMovie) {
    return false;
  }

  const isFromMovieLibrary =
    event.Metadata.librarySectionTitle === "Anime Movies";
  const isFromSeriesLibrary = event.Metadata.librarySectionTitle === "Anime";

  if (!isFromMovieLibrary && !isFromSeriesLibrary) {
    return false;
  }

  return true;
}

function shouldHandleRate(event) {
  if (event.event !== "media.rate") {
    return false;
  }
  const isFromMovieLibrary =
    event.Metadata.librarySectionTitle === "Anime Movies";
  const isFromSeriesLibrary = event.Metadata.librarySectionTitle === "Anime";

  if (!isFromMovieLibrary && !isFromSeriesLibrary) {
    return false;
  }
  return true;
}

async function anilistRedirect(ctx) {
  ctx.body = fs.createReadStream("redirect.html");
  ctx.type = "html";
  ctx.res.statusCode = 200;
}

async function anilistLogin(ctx) {
  let html = fs.readFileSync("anilist-login.html", { encoding: "utf-8" });
  html = html.replace("{#clientId}", config.clientId);
  ctx.body = html;
  ctx.type = "html";
  ctx.res.statusCode = 200;
}

async function addNewAnilistUser(ctx) {
  const { plexName, access_token } = ctx.request.body;
  ctx.response.status = 400;
  ctx.response.type = "text/plain";
  ctx.response.body = "Unknown error occured";
  if (!access_token) {
    ctx.response.body =
      "Missing access token. Visit https://anilist.co/api/v2/oauth/authorize?client_id={clientID}&response_type=token to get a token";
    return;
  }
  if (!plexName) {
    ctx.response.body = "Missing plex name.";
    return;
  }
  const newUser = { plexName, anilistToken: access_token };
  let newUsers = [...config["anilistUsers"]];
  if (newUsers.find((user) => user.plexName === plexName)) {
    newUsers = newUsers.filter((user) => user.plexName !== plexName);
    newUsers.push(newUser);
    ctx.response.status = 201;
    ctx.response.body = "Your user has been updated";
  } else {
    newUsers.push(newUser);
    ctx.response.status = 201;
    ctx.response.body = "You have been added to the plexilist hook";
  }
  config["anilistUsers"] = newUsers;
  fs.writeFileSync("config.json", JSON.stringify(config));
  delete require.cache[require.resolve("./config.json")];
  config = require("./config.json");
}

module.exports = {
  handleWebhook,
  anilistRedirect,
  anilistLogin,
  addNewAnilistUser,
};
