import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

const url = process.env.WP_BASE_URL!;
const BUDGETS = { lcp: 1800, cls: 0.1, inp: 200 };

(async ()=>{
  const chrome = await launch({ chromeFlags: ['--headless'] });
  const result = await lighthouse(url, { port: chrome.port, throttling: { rttMs:150, throughputKbps:1600, cpuSlowdownMultiplier:4 }});
  const a = result.lhr.audits;
  const lcp = a['largest-contentful-paint'].numericValue;
  const cls = a['cumulative-layout-shift'].numericValue;
  const inp = a['experimental-interaction-to-next-paint']?.numericValue || 0;
  console.log({ lcp, cls, inp });
  if(lcp>BUDGETS.lcp || cls>BUDGETS.cls || inp>BUDGETS.inp) throw new Error("Performance budget failed");
  process.exit(0);
})();
