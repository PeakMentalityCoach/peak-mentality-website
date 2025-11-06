import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { uploadMedia } from "./lib/wp.js";

async function dl(url:string, dest:string){ const r = await axios.get(url,{responseType:"arraybuffer"}); fs.writeFileSync(dest, r.data); }

(async ()=>{
  const docs = JSON.parse(fs.readFileSync("out/kajabi_raw.json","utf8"));
  fs.mkdirSync("tmp/media", { recursive:true });

  for(const d of docs){
    const matches = Array.from(String(d.body_html||"").matchAll(/<img[^>]+src=["']([^"']+)["']/gi));
    for(const m of matches){
      const imgUrl = m[1];
      if(!/^https?:\/\//.test(imgUrl)) continue;
      const base = path.join("tmp/media", path.basename(new URL(imgUrl).pathname) || `img-${Math.random()}.png`);
      try{
        await dl(imgUrl, base);
        const avif = base.replace(/\.\w+$/, ".avif");
        const webp = base.replace(/\.\w+$/, ".webp");
        await sharp(base).avif({quality:55}).toFile(avif);
        await sharp(base).webp({quality:72}).toFile(webp);
        const up = await uploadMedia(avif, d.title).catch(async()=> await uploadMedia(webp, d.title));
        if(up?.source_url){ d.body_html = String(d.body_html).replaceAll(imgUrl, up.source_url); }
      }catch{}
    }
  }
  fs.writeFileSync("out/kajabi_media_inlined.json", JSON.stringify(docs,null,2));
})();
