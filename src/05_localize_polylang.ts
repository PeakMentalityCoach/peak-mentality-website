import { wp } from "./lib/wp.js";

(async ()=>{
  try{
    const pages = (await wp.get("/wp/v2/pages", { params:{ per_page:100, status:"draft" } })).data;
    for(const p of pages){
      await wp.post("/wp/v2/pages", {
        title: p.title.rendered, content: p.content.rendered, status: "draft", slug: p.slug, lang: "no"
      }).catch(()=>{});
    }
  }catch(e){}
})();
