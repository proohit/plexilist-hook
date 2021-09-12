# plexilist-hook

A WebHook handler for Plex that syncs scrobble (watched anime) and rating events with AniList.

## Config

For authorizing access to the AniList accounts, access tokens are needed.

1. First copy the [configTemplate.json](./configTemplate.json) to `config.json`.
2. Then go to https://anilist.co/settings/developer and create a new app. Choose `{yourUrl}/anilist-callback` as the redirect url.
3. Copy the `ID` and paste it into the `clientId` property in `config.json`
4. Now send `{yourUrl}/anilist-login` to users to add/update their access tokens.
