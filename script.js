const feeds = [
  {
    name: "Colorado Public Radio",
    region: "Statewide",
    url: "https://www.cpr.org/feed/"
  },
  {
    name: "Colorado Politics",
    region: "Statewide",
    url: "https://www.coloradopolitics.com/search/?f=rss"
  },
  {
    name: "9NEWS Colorado",
    region: "Front Range",
    url: "https://www.9news.com/feeds/syndication/rss/news"
  }
];
feeds.forEach(loadFeed);
