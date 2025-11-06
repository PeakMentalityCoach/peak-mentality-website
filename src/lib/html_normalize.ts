import * as cheerio from "cheerio";

export function normalizeLegacyHtml(html:string){
  const $ = cheerio.load(html || "");
  $("script, style, noscript").remove();
  $('[style]').removeAttr('style');

  // Single H1 rule
  const h1s = $("h1"); h1s.slice(1).each((_,el)=>$(el).replaceWith(`<h2>${$(el).text()}</h2>`));

  // External link hygiene
  $("a[href]").each((_,a)=>{
    const href = $(a).attr("href")!;
    if(/^https?:\/\//.test(href)) $(a).attr("rel","noopener").attr("target","_blank");
  });

  // Remove empty typography
  $("p, h1, h2, h3, li").each((_,el)=>{ if(!$(el).text().trim()) $(el).remove(); });

  return $.html();
}
