const feeds = [
  {
    name: "Colorado Public Radio",
    region: "Statewide",
    url: "https://www.cpr.org/feed/"
  },
  {
    name: "The Daily Sentinel",
    region: "Western Slope",
    url: "https://www.gjsentinel.com/rss/"
  },
  {
    name: "The Denver Post",
    region: "Front Range",
    url: "https://www.denverpost.com/feed/"
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
<h3>${feed.region || "Colorado News"}</h3>
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
    html += "<p>Feed not available — source link coming soon</p>";
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

document.getElementById("date").textContent =
  new Date().toLocaleString();
