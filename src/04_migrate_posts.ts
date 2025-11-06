import fs from "node:fs";
import { upsert } from "./lib/wp.js";
import { normalizeLegacyHtml } from "./lib/html_normalize.js";

const map = JSON.parse(fs.readFileSync("out/content_map.json","utf8"));
const bodies = JSON.parse(fs.readFileSync("out/kajabi_media_inlined.json","utf8"));
const byUrl = new Map(bodies.map((b:any)=>[b.source_url,b]));

(async ()=>{
  const redirects:{legacy_url:string,new_url:string,status:number}[] = [];

  for(const row of map){
    const body = byUrl.get(row.source_url)?.body_html || "";
    const clean = normalizeLegacyHtml(body);
    const slug = row.target_url.replace(/^\//,"");
    const created = await upsert(row.type==="post"?"posts":"pages", {
      title: row.title, content: clean, status: "draft", slug
    }).catch(e=>{ console.error("Create failed", row.target_url, e?.response?.data || e.message); });

    if(created?.id){
      redirects.push({ legacy_url: row.source_url, new_url: `${process.env.WP_BASE_URL}${row.target_url}`, status:301 });
    }
  }

  const csv = ["legacy_url,new_url,status", ...redirects.map(r=>`${r.legacy_url},${r.new_url},${r.status}`)].join("\n");
  fs.writeFileSync("out/redirects.csv", csv);
})();
