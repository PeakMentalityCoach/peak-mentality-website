import axios from "axios";
import * as cheerio from "cheerio";
import fs from "node:fs";
import "dotenv/config";

const START = process.env.KAJABI_BASE_URL!;
const seen = new Set<string>();
const rows:any[] = [];

async function crawl(url:string){
  if(seen.has(url) || !url.startsWith(START)) return;
  seen.add(url);
  const { data } = await axios.get(url, { timeout: 20000 });
  const $ = cheerio.load(data);
  const title = $("title").first().text().trim() || "Untitled";
  const body = $("main").html() || $("body").html() || "";
  rows.push({ source_url:url, title, body_html: body });

  $("a[href]").each((_,a)=>{
    const href = $(a).attr("href") || "";
    const abs = /^https?:\/\//.test(href) ? href : href.startsWith("/") ? START.replace(/\/$/,"")+href : "";
    if(abs && abs.startsWith(START)) crawl(abs).catch(()=>{});
  });
}

(async ()=>{
  await crawl(START);
  fs.mkdirSync("out", { recursive:true });
  fs.writeFileSync("out/kajabi_raw.json", JSON.stringify(rows, null, 2));
  console.log(`Crawled ${rows.length} pages`);
})();
