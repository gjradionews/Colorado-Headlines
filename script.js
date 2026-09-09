function googleNewsSearch(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
}

function googleNewsSite(site) {
  return googleNewsSearch(`site:${site}`);
}

const coloradoTerms = [
  "colorado","grand junction","mesa county","western slope","denver","aurora","colorado springs","pueblo",
  "montrose","delta","aspen","glenwood","rifle","parachute","palisade","fruita","durango","cortez","telluride",
  "ouray","ridgway","vail","eagle","summit county","pitkin county","garfield county","gunnison","steamboat",
  "boulder","fort collins","loveland","greeley","lakewood","arvada","thornton","castle rock","jefferson county",
  "mesa","rockies","broncos","avalanche","nuggets","buffaloes","csu","cu boulder","state capitol","polis"
];

const feeds = [
  { name: "KREX5 / WesternSlopeNow", region: "Western Slope", urls: ["https://www.westernslopenow.com/feed/", googleNewsSite("westernslopenow.com")] },
  {
    name: "Grand Junction Daily Sentinel",
    region: "Western Slope",
    urls: [
      "https://www.gjsentinel.com/search/?f=rss&t=article&l=50&s=start_time&sd=desc&q=Grand%20Junction",
      "https://www.gjsentinel.com/search/?f=rss&t=article&l=50&s=start_time&sd=desc&q=Mesa%20County",
      "https://www.gjsentinel.com/search/?f=rss&t=article&l=50&s=start_time&sd=desc&q=Western%20Slope",
      "https://www.gjsentinel.com/search/?f=rss&t=article&l=50&s=start_time&sd=desc&q=Colorado"
    ],
    includeTerms: coloradoTerms
  },
  { name: "The Business Times — Grand Junction", region: "Western Slope", urls: ["https://thebusinesstimes.com/feed/", googleNewsSite("thebusinesstimes.com")] },
  { name: "Glenwood Springs Post Independent", region: "Western Slope", urls: ["https://www.postindependent.com/feed/", googleNewsSite("postindependent.com")] },
  { name: "Durango Herald", region: "Western Slope", urls: ["https://www.durangoherald.com/feeds/all", googleNewsSite("durangoherald.com")] },
  { name: "The Journal — Cortez", region: "Western Slope", urls: ["https://www.the-journal.com/feeds/all", googleNewsSite("the-journal.com")] },
  { name: "Montrose Daily Press", region: "Western Slope", urls: [googleNewsSearch("site:montrosepress.com Montrose Colorado"), googleNewsSite("montrosepress.com")] },

  { name: "Colorado Public Radio", region: "Statewide", urls: ["https://www.cpr.org/feed/", googleNewsSite("cpr.org")] },
  { name: "The Colorado Sun", region: "Statewide", urls: ["https://coloradosun.com/feed/", googleNewsSite("coloradosun.com")] },
  { name: "Colorado Newsline", region: "Statewide", urls: [googleNewsSearch("site:coloradonewsline.com Colorado"), googleNewsSite("coloradonewsline.com")] },
  { name: "Colorado Politics", region: "Statewide", urls: [googleNewsSearch("site:coloradopolitics.com Colorado politics"), googleNewsSite("coloradopolitics.com")] },

  { name: "FOX31 Denver (KDVR)", region: "Front Range", urls: ["https://kdvr.com/feed/", googleNewsSite("kdvr.com")] },
  { name: "9NEWS", region: "Front Range", urls: [googleNewsSearch("site:9news.com Colorado"), googleNewsSite("9news.com")] },
  { name: "Denver7", region: "Front Range", urls: ["https://www.denver7.com/news/local-news.rss", googleNewsSite("denver7.com")] },
  { name: "CBS Colorado", region: "Front Range", urls: ["https://www.cbsnews.com/colorado/latest/rss/main", googleNewsSite("cbsnews.com/colorado")] },
  {
    name: "Denver Post",
    region: "Front Range",
    urls: [
      "https://www.denverpost.com/feed/",
      "https://www.denverpost.com/news/feed/",
      "https://www.denverpost.com/news/colorado/feed/",
      googleNewsSearch("site:denverpost.com Colorado")
    ]
  },

  { name: "Aspen Daily News", region: "Mountains", urls: [googleNewsSearch("site:aspendailynews.com Aspen Colorado"), googleNewsSite("aspendailynews.com")] },
  { name: "Vail Daily", region: "Mountains", urls: ["https://www.vaildaily.com/feed/", googleNewsSite("vaildaily.com")] },
  { name: "Summit Daily", region: "Mountains", urls: ["https://www.summitdaily.com/feed/", googleNewsSite("summitdaily.com")] },
  { name: "Sky-Hi News", region: "Mountains", urls: ["https://www.skyhinews.com/feed/", googleNewsSite("skyhinews.com")] }
];

const regionOrder = ["Western Slope", "Statewide", "Front Range", "Mountains"];
const regionIds = { "Western Slope": "western-slope", "Statewide": "statewide", "Front Range": "front-range", "Mountains": "mountains" };
const MAX_PER_SOURCE = 5;
const RSS_PROXY = "https://api.rss2json.com/v1/api.json?rss_url=";
const RAW_PROXY = "https://api.allorigins.win/raw?url=";

function escapeHtml(value = "") {
  return value.replace(/[&<>'\"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'\"':"&quot;"}[char]));
}

function safeUrl(value = "") {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : "#"; }
  catch { return "#"; }
}

function storyDate(item) {
  const raw = item.pubDate || item.isoDate || item.published || item.date || "";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatStoryDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(date);
}

function normalizeItem(item) {
  return {
    title: (item.title || "Untitled story").trim(),
    link: item.link || item.guid || "#",
    date: storyDate(item),
    description: item.description || item.content || item.contentSnippet || ""
  };
}

async function fetchWithRss2Json(url) {
  const response = await fetch(`${RSS_PROXY}${encodeURIComponent(url)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.status && data.status !== "ok") throw new Error(data.message || "Feed unavailable");
  if (!Array.isArray(data.items) || data.items.length === 0) throw new Error("No items returned");
  return data.items.map(normalizeItem);
}

async function fetchWithRawXml(url) {
  const response = await fetch(`${RAW_PROXY}${encodeURIComponent(url)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const xmlText = await response.text();
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");
  const nodes = [...xml.querySelectorAll("item, entry")];
  if (!nodes.length) throw new Error("No XML items returned");
  return nodes.map(node => normalizeItem({
    title: node.querySelector("title")?.textContent || "",
    link: node.querySelector("link")?.getAttribute("href") || node.querySelector("link")?.textContent || "",
    guid: node.querySelector("guid")?.textContent || "",
    pubDate: node.querySelector("pubDate")?.textContent || node.querySelector("published")?.textContent || node.querySelector("updated")?.textContent || "",
    description: node.querySelector("description")?.textContent || node.querySelector("summary")?.textContent || node.querySelector("content")?.textContent || ""
  }));
}

async function fetchFeedUrl(url) {
  try {
    return await fetchWithRss2Json(url);
  } catch (firstError) {
    console.warn("rss2json failed, trying raw XML:", url, firstError);
    return fetchWithRawXml(url);
  }
}

async function loadFeed(feed) {
  const candidates = feed.urls || [];
  const batches = await Promise.all(candidates.map(async url => {
    try { return await fetchFeedUrl(url); }
    catch (error) { console.warn(`Feed failed for ${feed.name}:`, url, error); return []; }
  }));

  let stories = batches.flat();
  if (!stories.length) return { ...feed, items: [], error: true };

  if (feed.includeTerms?.length) {
    stories = stories.filter(item => {
      const text = `${item.title} ${item.description || ""}`.toLowerCase();
      return feed.includeTerms.some(term => text.includes(term));
    });
  }

  stories.sort((a,b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  const seen = new Set();
  const unique = stories.filter(item => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });

  return { ...feed, items: unique.slice(0, MAX_PER_SOURCE), error: unique.length === 0 };
}

function renderSource(source) {
  const stories = source.items.length
    ? `<ul class="headline-list">${source.items.map(item => `<li><a href="${safeUrl(item.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>${item.date ? `<div class="story-time">${escapeHtml(formatStoryDate(item.date))}</div>` : ""}</li>`).join("")}</ul>`
    : `<div class="status">${source.error ? "Headlines temporarily unavailable." : "No recent headlines found."}</div>`;
  return `<section class="source-group" data-region="${escapeHtml(source.region)}"><h3 class="source-name">${escapeHtml(source.name)}</h3>${stories}</section>`;
}

function render(allSources) {
  const container = document.getElementById("headlines");
  container.classList.remove("loading");
  container.innerHTML = regionOrder.map(region => {
    const sources = allSources.filter(source => source.region === region);
    if (!sources.length) return "";
    return `<section class="region" data-region="${escapeHtml(region)}" id="${regionIds[region]}"><div class="region-head"><h2 class="region-title">${escapeHtml(region)}</h2></div>${sources.map(renderSource).join("")}</section>`;
  }).join("");
  applyFilter(document.querySelector('.filter.active')?.dataset.filter || 'all');
}

function applyFilter(filter) {
  document.querySelectorAll('.region').forEach(region => {
    region.classList.toggle('hidden', filter !== 'all' && region.dataset.region !== filter);
  });
}

document.addEventListener('click', event => {
  const button = event.target.closest('.filter');
  if (!button) return;
  document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
  button.classList.add('active');
  applyFilter(button.dataset.filter);
});

async function refresh() {
  const results = await Promise.all(feeds.map(loadFeed));
  render(results);
  document.getElementById("date").textContent = new Intl.DateTimeFormat("en-US", {month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date());
}

refresh();
setInterval(refresh, 10 * 60 * 1000);