import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import crypto from "crypto";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "max-age=0",
  "Sec-Ch-Ua": '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

// Cache
let _cache: { data: any; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 300 * 1000; // 5 minutes

function uniqueId(title: string, source: string) {
  return crypto.createHash("md5").update(`${source}${title}`).digest("hex").slice(0, 10);
}

function resolveImg(src: string | undefined, base: string) {
  if (!src) return "";
  if (src.startsWith("//")) return "https:" + src;
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) {
    const url = new URL(base);
    return `${url.protocol}//${url.host}${src}`;
  }
  return src;
}

// Scrapers
async function scrapeBBC() {
  try {
    const { data } = await axios.get("https://www.bbc.com/news", { 
      headers: { ...HEADERS, "Referer": "https://www.google.com/" }, 
      timeout: 10000 
    });
    const $ = cheerio.load(data);
    const articles: any[] = [];
    const seen = new Set();

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (!/^\/news\/articles\/|^\/news\/world|^\/news\/uk|^\/news\/business/.test(href)) return;
      
      const url = href.startsWith("/") ? "https://www.bbc.com" + href : href;
      const h3 = $(el).find("h3, h2, p").first();
      const title = (h3.text() || $(el).text()).trim();

      if (!title || title.length < 15 || seen.has(title)) return;
      seen.add(title);

      let img = $(el).find("img").attr("src") || $(el).parent().find("img").attr("src") || "";
      img = resolveImg(img, "https://www.bbc.com");

      articles.push({
        id: uniqueId(title, "BBC"),
        title,
        description: "",
        image: img,
        url,
        source: "BBC News",
        country: "🇬🇧 UK",
        color: "#BB1919",
      });

      if (articles.length >= 6) return false;
    });
    return articles;
  } catch (e) {
    console.error("BBC Scrape Failed", e);
    return [];
  }
}

async function scrapeAPNews() {
  try {
    const { data } = await axios.get("https://apnews.com/hub/world-news", { 
      headers: HEADERS, 
      timeout: 10000 
    });
    const $ = cheerio.load(data);
    const articles: any[] = [];
    const seen = new Set();

    $("div[class*='PageList-items-item'], .FeedCard, .Card").each((_, el) => {
      const a = $(el).find("a").first();
      const href = a.attr("href") || "";
      if (!href || href.length < 10) return;

      const url = href.startsWith("http") ? href : "https://apnews.com" + href;
      const h3 = $(el).find("h1, h2, h3, span[class*='title']").first();
      const title = h3.text().trim();

      if (!title || title.length < 15 || seen.has(title)) return;
      seen.add(title);

      let img = $(el).find("img").attr("src") || "";
      img = resolveImg(img, "https://apnews.com");

      articles.push({
        id: uniqueId(title, "AP"),
        title,
        description: $(el).find("p").first().text().trim().slice(0, 150),
        image: img,
        url,
        source: "AP News",
        country: "🌐 Global",
        color: "#ff322e",
      });

      if (articles.length >= 6) return false;
    });
    return articles;
  } catch (e) {
    console.error("AP News Scrape Failed", e instanceof Error ? e.message : e);
    return [];
  }
}

async function scrapeAlJazeera() {
  try {
    const { data } = await axios.get("https://www.aljazeera.com", { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(data);
    const articles: any[] = [];
    const seen = new Set();

    $("article, .article-card, .card").each((_, el) => {
      const a = $(el).find("a[href]").first();
      const href = a.attr("href") || "";
      if (!href.startsWith("/")) return;

      const url = "https://www.aljazeera.com" + href;
      const h_tag = $(el).find("h2, h3, h4").first();
      const title = (h_tag.text() || a.text()).trim();

      if (!title || title.length < 15 || seen.has(title)) return;
      seen.add(title);

      const desc = $(el).find("p").first().text().trim();
      let img = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";
      img = resolveImg(img, "https://www.aljazeera.com");

      articles.push({
        id: uniqueId(title, "AJ"),
        title,
        description: desc.slice(0, 200),
        image: img,
        url,
        source: "Al Jazeera",
        country: "🇶🇦 Qatar",
        color: "#1A7A4A",
      });

      if (articles.length >= 6) return false;
    });
    return articles;
  } catch (e) {
    console.error("Al Jazeera Scrape Failed", e);
    return [];
  }
}

async function scrapeTheHindu() {
  try {
    const { data } = await axios.get("https://www.thehindu.com", { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(data);
    const articles: any[] = [];
    const seen = new Set();

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (!href.includes("thehindu.com/news") && !href.startsWith("/news")) return;

      const url = href.startsWith("http") ? href : "https://www.thehindu.com" + href;
      const title = $(el).text().trim();

      if (!title || title.length < 15 || seen.has(title)) return;
      seen.add(title);

      let img = $(el).find("img").attr("src") || $(el).parent().find("img").attr("src") || "";
      img = resolveImg(img, "https://www.thehindu.com");

      articles.push({
        id: uniqueId(title, "Hindu"),
        title,
        description: "",
        image: img,
        url,
        source: "The Hindu",
        country: "🇮🇳 India",
        color: "#1B3A6B",
      });

      if (articles.length >= 6) return false;
    });
    return articles;
  } catch (e) {
    console.error("The Hindu Scrape Failed", e);
    return [];
  }
}

async function scrapeDW() {
  try {
    const { data } = await axios.get("https://www.dw.com/en/top-stories/s-9097", { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(data);
    const articles: any[] = [];
    const seen = new Set();

    $("div[data-item-id]").each((_, el) => {
      const a = $(el).find("a").first();
      const href = a.attr("href") || "";
      if (!href) return;

      const url = href.startsWith("http") ? href : "https://www.dw.com" + href;
      const title = $(el).find("h2, h3").first().text().trim();

      if (!title || title.length < 15 || seen.has(title)) return;
      seen.add(title);

      let img = $(el).find("img").attr("src") || "";
      img = resolveImg(img, "https://www.dw.com");

      articles.push({
        id: uniqueId(title, "DW"),
        title,
        description: "",
        image: img,
        url,
        source: "DW News",
        country: "🇩🇪 Germany",
        color: "#007CCC",
      });

      if (articles.length >= 6) return false;
    });
    return articles;
  } catch (e) {
    console.error("DW News Scrape Failed", e);
    return [];
  }
}

async function scrapeSCMP() {
  try {
    const { data } = await axios.get("https://www.scmp.com/news/world", { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(data);
    const articles: any[] = [];
    const seen = new Set();

    $("a[data-qa='ContentCard-Title'], .content-card__title a").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (!href) return;

      const url = href.startsWith("http") ? href : "https://www.scmp.com" + href;
      const title = $(el).text().trim();

      if (!title || title.length < 15 || seen.has(title)) return;
      seen.add(title);

      let img = $(el).closest("div").find("img").attr("src") || "";
      img = resolveImg(img, "https://www.scmp.com");

      articles.push({
        id: uniqueId(title, "SCMP"),
        title,
        description: "",
        image: img,
        url,
        source: "SCMP",
        country: "🇭🇰 Hong Kong",
        color: "#C8102E",
      });

      if (articles.length >= 6) return false;
    });
    return articles;
  } catch (e) {
    console.error("SCMP Scrape Failed", e);
    return [];
  }
}

async function scrapeGuardian() {
  try {
    const { data } = await axios.get("https://www.theguardian.com/world", { 
      headers: { ...HEADERS, "Referer": "https://www.google.com/" }, 
      timeout: 10000 
    });
    const $ = cheerio.load(data);
    const articles: any[] = [];
    const seen = new Set();

    $("a[data-link-name='article']").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (!href.startsWith("https://www.theguardian.com/world/")) return;

      const title = $(el).text().trim();
      if (!title || title.length < 20 || seen.has(title)) return;
      seen.add(title);

      let img = $(el).closest("div").find("img").attr("src") || "";
      img = resolveImg(img, "https://www.theguardian.com");

      articles.push({
        id: uniqueId(title, "Guardian"),
        title,
        description: "",
        image: img,
        url: href,
        source: "The Guardian",
        country: "🇬🇧 UK/Global",
        color: "#052962",
      });

      if (articles.length >= 6) return false;
    });
    return articles;
  } catch (e) {
    console.error("Guardian Scrape Failed", e instanceof Error ? e.message : e);
    return [];
  }
}

async function scrapeNPR() {
  try {
    const { data } = await axios.get("https://www.npr.org/sections/world/", { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(data);
    const articles: any[] = [];
    const seen = new Set();

    $("article.item").each((_, el) => {
      const a = $(el).find("h2.title a").first();
      const href = a.attr("href") || "";
      if (!href) return;

      const title = a.text().trim();
      if (!title || title.length < 15 || seen.has(title)) return;
      seen.add(title);

      let img = $(el).find("img").attr("src") || "";
      img = resolveImg(img, "https://www.npr.org");

      articles.push({
        id: uniqueId(title, "NPR"),
        title,
        description: $(el).find("p.teaser").text().trim(),
        image: img,
        url: href,
        source: "NPR",
        country: "🇺🇸 USA",
        color: "#24558D",
      });

      if (articles.length >= 6) return false;
    });
    return articles;
  } catch (e) {
    console.error("NPR Scrape Failed", e);
    return [];
  }
}


async function getNews() {
  const now = Date.now();
  if (_cache.data && now - _cache.ts < CACHE_TTL) {
    return _cache.data;
  }

  console.log("Scraping news...");
  const results = await Promise.allSettled([
    scrapeBBC(),
    scrapeAPNews(),
    scrapeAlJazeera(),
    scrapeTheHindu(),
    scrapeDW(),
    scrapeSCMP(),
    scrapeGuardian(),
    scrapeNPR(),
  ]);

  const allArticles = results
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  const data = {
    articles: allArticles,
    fetched_at: new Date().toISOString(),
    total: allArticles.length,
  };

  _cache = { data, ts: now };
  return data;
}

// API Routes
app.get("/api/news", async (req, res) => {
  try {
    const data = await getNews();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

app.post("/api/refresh", async (req, res) => {
  _cache = { data: null, ts: 0 };
  try {
    const data = await getNews();
    res.json({ status: "refreshed", total: data.total });
  } catch (error) {
    res.status(500).json({ error: "Failed to refresh news" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
