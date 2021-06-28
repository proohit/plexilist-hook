class PlexWebHookEvent {
  event;
  Account;
  Metadata;
  librarySectionTitle;
  type;
  constructor(json) {
    const body = JSON.parse(json);
    const { event, Account, Metadata } = body;
    this.Account = Account;
    this.Metadata = Metadata;
    this.event = event;
  }
}

module.exports = PlexWebHookEvent;
