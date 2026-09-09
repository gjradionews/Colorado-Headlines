const feeds = [
  { name: "Colorado Public Radio", region: "Statewide", url: "https://www.cpr.org/feed/" }
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
  return value.replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
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

async function loadFeed(feed) {
  try {
    const response = await fetch(`${RSS_PROXY}${encodeURIComponent(feed.url)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.status && data.status !== "ok") throw new Error(data.message || "Feed unavailable");

    const items = (data.items || [])
      .map(item => ({
        title: (item.title || "Untitled story").trim(),
        link: item.link || item.guid || "#",
        date: storyDate(item)
      }))
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

    const seen = new Set();
    const unique = items.filter(item => {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return { ...feed, items: unique.slice(0, MAX_PER_SOURCE), error: false };
  } catch (error) {
    console.warn(`Could not load ${feed.name}:`, error);
    return { ...feed, items: [], error: true };
  }
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

    // All headlines from a source are rendered together in one source group.
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
