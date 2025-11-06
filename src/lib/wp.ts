import axios from "axios";
import FormData from "form-data";
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

export const wp = axios.create({
  baseURL: `${process.env.WP_BASE_URL}/wp-json`,
  auth: { username: process.env.WP_USER!, password: process.env.WP_APP_PASSWORD! }
});

export async function upsert(type:"pages"|"posts", payload:{title:string; content:string; status?:"draft"|"publish"; slug?:string;}){
  const res = await wp.post(`/wp/v2/${type}`, payload);
  return res.data;
}

export async function update(type:"pages"|"posts", id:number, payload:any){
  const res = await wp.post(`/wp/v2/${type}/${id}`, payload);
  return res.data;
}

export async function uploadMedia(filePath:string, alt:string){
  const fd = new FormData();
  const filename = path.basename(filePath);
  fd.append("file", fs.createReadStream(filePath), filename);
  const res = await wp.post("/wp/v2/media", fd, {
    headers: { ...fd.getHeaders(), "Content-Disposition": `attachment; filename="${filename}"` },
    params: { alt_text: alt }
  });
  return res.data; // { id, source_url, ... }
}
