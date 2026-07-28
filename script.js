const feeds = [
  {
    name: "Colorado Public Radio",
    url: "https://www.cpr.org/feed/"
  },
  {
    name: "Denver Post",
    url: "https://www.denverpost.com/feed/"
  },
  {
    name: "Grand Junction Daily Sentinel",
    url: "https://www.gjsentinel.com/rss/"
  },
  {
    name: "Colorado Springs Gazette",
    url: "https://gazette.com/rss/"
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

    data.items.slice(0, 5).forEach(item => {
      html += `
        <div class="headline">
          <a href="${item.link}" target="_blank">
            ${item.title}
          </a>
        </div>
      `;
    });

    container.innerHTML += html;

  } catch (error) {
    container.innerHTML += `
      <h2>${feed.name}</h2>
      <p>Feed unavailable</p>
    `;
  }
}

feeds.forEach(loadFeed);
