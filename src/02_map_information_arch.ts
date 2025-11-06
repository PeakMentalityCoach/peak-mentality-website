import fs from "node:fs";
import slugify from "slugify";

type Row = { source_url:string; title:string; body_html?:string; };

const raw:Row[] = JSON.parse(fs.readFileSync("out/kajabi_raw.json","utf8"));

function routeFor(title:string, url:string){
  const s = slugify(title,{lower:true,strict:true});
  if(url.includes("/blog/")) return `/resources/${s}`;
  if(/contact|book|inquire/.test(title.toLowerCase())) return "/contact";
  if(/case|result|client/.test(title.toLowerCase())) return `/case-studies/${s}`;
  if(/speak|workshop|keynote/.test(title.toLowerCase())) return "/speaking";
  return `/${s}`;
}

const mapped = raw.map(r => ({
  ...r,
  target_url: routeFor(r.title, r.source_url),
  type: r.source_url.includes("/blog/") ? "post" : "page",
  status: "to_migrate"
}));

fs.writeFileSync("out/content_map.json", JSON.stringify(mapped,null,2));
