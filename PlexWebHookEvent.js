class PlexWebHookEvent {
  event;
  Account;
  Metadata;
  librarySectionTitle;
  type;
  rating;
  constructor(json) {
    const body = JSON.parse(json);
    const { event, Account, Metadata, rating } = body;
    this.Account = Account;
    this.Metadata = Metadata;
    this.event = event;
    this.rating = rating;
  }
}

module.exports = PlexWebHookEvent;
