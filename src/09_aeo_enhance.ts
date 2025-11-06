import fs from "node:fs";
import slugify from "slugify";
import { wp, update } from "./lib/wp.js";
import "dotenv/config";

/** Helper to build JSON-LD chunks */
function orgJson(){
  return {
    "@context":"https://schema.org",
    "@type":"Organization",
    "name":"Peak Mentality Coaching",
    "url": process.env.WP_BASE_URL,
    "logo": `${process.env.WP_BASE_URL}/wp-content/uploads/logo.png`,
    "sameAs":[
      "https://www.linkedin.com/company/peak-mentality",
      "https://x.com/peakmentality"
    ]
  };
}

function websiteJson(){
  return {
    "@context":"https://schema.org",
    "@type":"WebSite",
    "url": process.env.WP_BASE_URL,
    "name":"Peak Mentality Coaching",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${process.env.WP_BASE_URL}/?s={search_term_string}`,
      "query-input":"required name=search_term_string"
    }
  };
}

/** Extract naive Q&As from content (H3 as question, next P as answer) */
function extractQAs(html:string){
  const qs = Array.from(html.matchAll(/<h3[^>]*>(.*?)<\/h3>\s*<p[^>]*>(.*?)<\/p>/gis))
    .map(m=>({q: m[1].replace(/<[^>]+>/g,"").trim(), a: m[2].replace(/<[^>]+>/g,"").trim()}))
    .filter(x=>x.q && x.a);
  return qs.slice(0,12);
}

function faqJson(qas:{q:string,a:string}[]){
  return {
    "@context":"https://schema.org",
    "@type":"FAQPage",
    "mainEntity": qas.map(x=>({
      "@type":"Question",
      "name": x.q,
      "acceptedAnswer": { "@type":"Answer", "text": x.a }
    }))
  };
}

(async ()=>{
  // Pull recent drafts to enhance
  const pages = (await wp.get("/wp/v2/pages", { params:{ per_page:100, status:"draft" } })).data;
  const posts = (await wp.get("/wp/v2/posts", { params:{ per_page:100, status:"draft" } })).data;
  const all = [...pages, ...posts];

  // Sitewide org + website schema (inject once on Home by appending to content)
  const home = all.find((p:any)=>p.slug==="home" || p.slug==="index") || all[0];
  if(home){
    const baseSchemas = [orgJson(), websiteJson()];
    const schemaTag = `<script type="application/ld+json">${JSON.stringify(baseSchemas)}</script>`;
    const tldr = `<aside data-ai-summary="true"><strong>TL;DR:</strong> Peak Mentality Coaching helps high performers and teams think clearer, execute faster, and win more through evidence-based coaching and workshops. Primary CTA: Book a consult.</aside>`;
    await update("pages", home.id, { content: `${tldr}\n${schemaTag}\n${home.content.rendered}` }).catch(()=>{});
  }

  // Per-page WebPage/Article + FAQ if applicable
  for(const p of all){
    const qas = extractQAs(p.content.rendered || "");
    const perPageSchemas:any[] = [{
      "@context":"https://schema.org",
      "@type": p.type==="post" ? "Article" : "WebPage",
      "headline": p.title.rendered,
      "url": p.link,
      "inLanguage": "en",
      "breadcrumb": { "@type":"BreadcrumbList", "itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":process.env.WP_BASE_URL},{"@type":"ListItem","position":2,"name":p.title.rendered,"item":p.link}]}
    }];
    if(qas.length>=3){ perPageSchemas.push(faqJson(qas)); }

    const tag = `<script type="application/ld+json">${JSON.stringify(perPageSchemas)}</script>`;
    const summary = `<meta name="ai-summary" content="${p.title.rendered} — ${qas[0]?.a?.slice(0,140) || 'Executive coaching and workshops to improve focus, execution, and performance.'}">`;
    await update(p.type, p.id, { content: `${summary}\n${tag}\n${p.content.rendered}` }).catch(()=>{});
  }

  // Build /answers hub from aggregated Q&As (AEO gold)
  const qaPool:{q:string,a:string,slug:string}[] = [];
  for(const p of all){
    extractQAs(p.content.rendered || "").forEach(qa=>qaPool.push({ ...qa, slug:p.slug }));
  }
  const unique = Array.from(new Map(qaPool.map(x=>[slugify(x.q,{lower:true,strict:true}), x])).values()).slice(0,50);
  const answersHtml = `
    <h1>Answers</h1>
    <p>Short, cited answers to common questions about Peak Mentality Coaching.</p>
    <ul>${unique.map(x=>`<li><a href="#${slugify(x.q,{lower:true,strict:true})}">${x.q}</a></li>`).join("")}</ul>
    ${unique.map(x=>`<h2 id="${slugify(x.q,{lower:true,strict:true})}">${x.q}</h2><p>${x.a}</p><p><em>Source:</em> <a href="/${x.slug}">/${x.slug}</a></p>`).join("\n")}
    <script type="application/ld+json">${JSON.stringify({
      "@context":"https://schema.org",
      "@type":"QAPage",
      "mainEntity": unique.map(x=>({
        "@type":"Question",
        "name": x.q,
        "acceptedAnswer": { "@type":"Answer", "text": x.a }
      }))
    })}</script>`;
  await wp.post("/wp/v2/pages", { title:"Answers", slug:"answers", status:"publish", content:answersHtml }).catch(()=>{});
})();
