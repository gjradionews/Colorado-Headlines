const feeds = [
  {
    name: "Colorado Public Radio",
    region: "Statewide",
    url: "https://www.cpr.org/feed/"
  },
  {
    name: "Colorado Politics",
    region: "Front Range",
    url: "https://www.coloradopolitics.com/rss/"
  },
  {
    name: "Grand Junction News",
    region: "Western Slope",
    url: "https://news.google.com/rss/search?q=Grand+Junction+Colorado+news"
  },
  {
    name: "Colorado Mountain News",
    region: "Mountains",
    url: "https://news.google.com/rss/search?q=Colorado+mountain+towns+ski+weather+fire"
  }
];

const container = document.getElementById("headlines");

async function loadFeed(feed) {
  try {
    const response = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=" +
      encodeURIComponent(feed.url)
    );

    const data = await response.json();

    let html = `
      <h3>${feed.region}</h3>
      <h2>${feed.name}</h2>
    `;

    if (data.items && data.items.length > 0) {
      data.items.slice(0, 5).forEach(item => {
        html += `
          <p>
            <a href="${item.link}" target="_blank">
              ${item.title}
            </a>
          </p>
        `;
      });
    } else {
      html += "<p>Feed not available</p>";
    }

    container.innerHTML += html;

  } catch (error) {
    container.innerHTML += `
      <h3>${feed.region}</h3>
      <h2>${feed.name}</h2>
      <p>Feed unavailable</p>
    `;
  }
}

feeds.forEach(loadFeed);

document.getElementById("date").textContent =
  new Date().toLocaleString();
