import fs from "node:fs";
const csv = fs.readFileSync("out/redirects.csv","utf8").trim().split("\n").slice(1).map(l=>l.split(","));
const apache = csv.map(([from,to])=>`Redirect 301 ${new URL(from).pathname} ${to}`).join("\n");
fs.writeFileSync("out/redirects.htaccess", apache);
