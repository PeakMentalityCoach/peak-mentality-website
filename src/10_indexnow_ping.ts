import fs from "node:fs";
import { wp } from "./lib/wp.js";
import axios from "axios";
import "dotenv/config";

(async ()=>{
  // 1) Ensure IndexNow key file (place at site root via WP upload workaround not ideal, but we can ask admin to add)
  const key = process.env.INDEXNOW_KEY!;
  fs.writeFileSync(`out/${key}.txt`, key);

  // 2) Ping IndexNow with recent URLs (published + drafts mapped to final)
  const pages = (await wp.get("/wp/v2/pages", { params:{ per_page:100 } })).data;
  const posts = (await wp.get("/wp/v2/posts", { params:{ per_page:100 } })).data;
  const urls = [...pages, ...posts].map((p:any)=>p.link).filter(Boolean);

  await axios.post("https://api.indexnow.org/IndexNow", {
    host: new URL(process.env.WP_BASE_URL!).host,
    key, keyLocation: `${process.env.WP_BASE_URL}/${key}.txt`,
    urlList: urls.slice(0,1000)
  }).catch(()=>{});
})();
