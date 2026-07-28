const feeds = [
  {
    name: "Colorado Public Radio",
    region: "Statewide",
    url: "https://www.cpr.org/feed/"
  },
  {
  name: "Grand Junction News",
  region: "Western Slope",
  url: "https://news.google.com/rss/search?q=Grand+Junction+Colorado+news"
},
 {
  name: "Colorado Politics",
  region: "Front Range",
  url: "https://www.coloradopolitics.com/rss/"
}
];

const container = document.getElementById("headlines");

document.getElementById("date").textContent =
  new Date().toLocaleString();

async function loadFeed(feed) {
  let html = `
    <h3>${feed.region}</h3>
    <h2>${feed.name}</h2>
    <p>Loading...</p>
  `;

  container.innerHTML += html;

  try {
    const response = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=" +
      encodeURIComponent(feed.url)
    );

    const data = await response.json();
    console.log(data);

    if (!data.items || data.items.length === 0) {
      return;
    }

    let output = `
      <h3>${feed.region}</h3>
      <h2>${feed.name}</h2>
    `;

    data.items.slice(0,5).forEach(item => {
      output += `
        <p>
          <a href="${item.link}" target="_blank">
          ${item.title}
          </a>
        </p>
      `;
    });

    container.innerHTML += output;

  } catch (error) {
    container.innerHTML += `
      <p>Feed unavailable</p>
    `;
  }
}

feeds.forEach(loadFeed);
