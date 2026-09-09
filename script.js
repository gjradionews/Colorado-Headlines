function googleNewsSearch(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
}

function googleNewsSite(site) {
  return googleNewsSearch(`site:${site}`);
}

const feeds = [
  // Statewide
  { name: "Colorado Public Radio", region: "Statewide", url: "https://www.cpr.org/feed/", fallback: googleNewsSite("cpr.org") },
  { name: "The Colorado Sun", region: "Statewide", url: "https://coloradosun.com/feed/", fallback: googleNewsSite("coloradosun.com") },
  { name: "Colorado Newsline", region: "Statewide", url: googleNewsSearch("site:coloradonewsline.com Colorado"), fallback: googleNewsSite("coloradonewsline.com") },
  { name: "Colorado Politics", region: "Statewide", url: googleNewsSearch("site:coloradopolitics.com Colorado politics"), fallback: googleNewsSite("coloradopolitics.com") },

  // Front Range
  { name: "FOX31 Denver (KDVR)", region: "Front Range", url: "https://kdvr.com/feed/", fallback: googleNewsSite("kdvr.com") },
  { name: "9NEWS", region: "Front Range", url: googleNewsSearch("site:9news.com Colorado"), fallback: googleNewsSite("9news.com") },
  { name: "Denver7", region: "Front Range", url: "https://www.denver7.com/news/local-news.rss", fallback: googleNewsSite("denver7.com") },
  { name: "CBS Colorado", region: "Front Range", url: "https://www.cbsnews.com/colorado/latest/rss/main", fallback: googleNewsSite("cbsnews.com/colorado") },
  { name: "Denver Post", region: "Front Range", url: googleNewsSearch("site:denverpost.com Colorado"), fallback: googleNewsSite("denverpost.com") },

  // Western Slope
  { name: "KREX5 / WesternSlopeNow", region: "Western Slope", url: "https://www.westernslopenow.com/feed/", fallback: googleNewsSite("westernslopenow.com") },
  { name: "Grand Junction Daily Sentinel", region: "Western Slope", url: googleNewsSearch("site:gjsentinel.com Colorado"), fallback: googleNewsSearch("site:gjsentinel.com (Colorado OR Grand Junction OR Mesa County OR Western Slope)") },
  { name: "The Business Times — Grand Junction", region: "Western Slope", url: "https://thebusinesstimes.com/feed/", fallback: googleNewsSite("thebusinesstimes.com") },
  { name: "Glenwood Springs Post Independent", region: "Western Slope", url: "https://www.postindependent.com/feed/", fallback: googleNewsSite("postindependent.com") },
  { name: "Durango Herald", region: "Western Slope", url: "https://www.durangoherald.com/feeds/all", fallback: googleNewsSite("durangoherald.com") },
  { name: "The Journal — Cortez", region: "Western Slope", url: "https://www.the-journal.com/feeds/all", fallback: googleNewsSite("the-journal.com") },
  { name: "Montrose Daily Press", region: "Western Slope", url: googleNewsSearch("site:montrosepress.com Montrose Colorado"), fallback: googleNewsSite("montrosepress.com") },

  // Mountains
  { name: "Aspen Daily News", region: "Mountains", url: googleNewsSearch("site:aspendailynews.com Aspen Colorado"), fallback: googleNewsSite("aspendailynews.com") },
  { name: "Vail Daily", region: "Mountains", url: "https://www.vaildaily.com/feed/", fallback: googleNewsSite("vaildaily.com") },
  { name: "Summit Daily", region: "Mountains", url: "https://www.summitdaily.com/feed/", fallback: googleNewsSite("summitdaily.com") },
  { name: "Sky-Hi News", region: "Mountains", url: "https://www.skyhinews.com/feed/", fallback: googleNewsSite("skyhinews.com") }
];

const regionOrder = ["Statewide", "Front Range", "Western Slope", "Mountains"];
const regionIds = {
  "Statewide": "statewide",
  "Front Range": "front-range",
  "Western Slope": "western-slope",
  "Mountains": "mountains"
};

const MAX_PER_SOURCE = 5;
const RSS_PROXY = "https://api.rss2json.com/v1/api.json?rss_url=";

function escapeHtml(value = "") {
  return value.replace(/[&<>'\"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '\"': "&quot;"
  }[char]));
}

function safeUrl(value = "") {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

function storyDate(item) {
  const raw = item.pubDate || item.isoDate || item.published || item.date || "";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatStoryDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  }).format(date);
}

async function fetchFeedUrl(url) {
  const response = await fetch(`${RSS_PROXY}${encodeURIComponent(url)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.status && data.status !== "ok") throw new Error(data.message || "Feed unavailable");
  if (!Array.isArray(data.items) || data.items.length === 0) throw new Error("No items returned");
  return data.items;
}

async function loadFeed(feed) {
  let items = [];
  let usedFallback = false;

  try {
    items = await fetchFeedUrl(feed.url);
  } catch (primaryError) {
    console.warn(`Primary feed failed for ${feed.name}:`, primaryError);
    if (feed.fallback) {
      try {
        items = await fetchFeedUrl(feed.fallback);
        usedFallback = true;
      } catch (fallbackError) {
        console.warn(`Fallback feed failed for ${feed.name}:`, fallbackError);
      }
    }
  }

  if (!items.length) {
    return { ...feed, items: [], error: true, usedFallback: false };
  }

  const stories = items
    .map(item => ({
      title: (item.title || "Untitled story").trim(),
      link: item.link || item.guid || "#",
      date: storyDate(item)
    }))
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

  const seen = new Set();
  const unique = stories.filter(item => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { ...feed, items: unique.slice(0, MAX_PER_SOURCE), error: false, usedFallback };
}

function renderSource(source) {
  const stories = source.items.length
    ? `<ul class="headline-list">${source.items.map(item => `
        <li>
          <a href="${safeUrl(item.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
          ${item.date ? `<div class="story-time">${escapeHtml(formatStoryDate(item.date))}</div>` : ""}
        </li>`).join("")}</ul>`
    : `<div class="status">${source.error ? "Headlines temporarily unavailable." : "No recent headlines found."}</div>`;

  return `
    <section class="source-group">
      <h3 class="source-name">${escapeHtml(source.name)}</h3>
      ${stories}
    </section>`;
}

function render(allSources) {
  const container = document.getElementById("headlines");
  container.classList.remove("loading");

  container.innerHTML = regionOrder.map(region => {
    const sources = allSources.filter(source => source.region === region);
    if (!sources.length) return "";
    return `
      <section class="region" id="${regionIds[region]}">
        <h2 class="region-title">${escapeHtml(region)}</h2>
        ${sources.map(renderSource).join("")}
      </section>`;
  }).join("");
}

async function refresh() {
  const results = await Promise.all(feeds.map(loadFeed));
  render(results);
  document.getElementById("date").textContent = new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
  }).format(new Date());
}

refresh();
setInterval(refresh, 10 * 60 * 1000);