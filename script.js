const feeds = [
  {
    name: "Colorado Public Radio",
    url: "https://www.cpr.org/feed/"
  },
  {
    name: "9NEWS Colorado",
    url: "https://www.9news.com/feeds/syndication/rss/news"
  },
  {
    name: "Colorado Politics",
    url: "https://www.coloradopolitics.com/search/?f=rss"
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

    let html = `<h2>${feed.name}</h2>`;

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
      html += "<p>No headlines found</p>";
    }

    container.innerHTML += html;

  } catch (error) {
    container.innerHTML += `
      <h2>${feed.name}</h2>
      <p>Feed unavailable</p>
    `;
  }
}

feeds.forEach(loadFeed);
