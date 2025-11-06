# Migration Runbook & Acceptance Checklist

Complete execution guide for Kajabi → WordPress migration with AEO optimization.

## Prerequisites

### ✅ Pre-Migration Checklist

- [ ] WordPress installed with HTTPS enabled
- [ ] Application password generated (Users → Profile → Application Passwords)
- [ ] All required plugins installed (see WORDPRESS_SETUP.md)
- [ ] WP Rocket or LiteSpeed Cache configured
- [ ] Polylang configured (if bilingual required)
- [ ] Redirection plugin installed
- [ ] Code Snippets configured with head-snippets.html
- [ ] `.env` file created with credentials
- [ ] Dependencies installed (`npm install`)

### ✅ Environment Variables

Verify `.env` file contains:

```env
WP_BASE_URL=https://your-wordpress-site.com
WP_USER=admin
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
KAJABI_BASE_URL=https://your-kajabi-site.com
PLAUSIBLE_DOMAIN=your-domain.com
INDEXNOW_KEY=pmc-indexnow-key
```

**Test WordPress API access:**
```bash
curl -u admin:xxxx\ xxxx\ xxxx\ xxxx\ xxxx\ xxxx \
  https://your-wordpress-site.com/wp-json/wp/v2/pages
```
Should return JSON (not 401 error).

---

## Execution Order

Run scripts in this exact order. Each step depends on the previous step's output.

### Step 1: Crawl Kajabi Site

```bash
npm run crawl
```

**What it does:**
- Recursively crawls entire Kajabi site starting from `KAJABI_BASE_URL`
- Follows all internal links automatically
- Extracts page titles and body HTML
- Creates `out/kajabi_raw.json`

**Verify output:**
```bash
cat out/kajabi_raw.json | jq '.[0]'
```

**Expected result:**
```json
{
  "source_url": "https://kajabi-site.com/page",
  "title": "Page Title",
  "body_html": "<h1>Page Title</h1><p>Content...</p>"
}
```

**Troubleshooting:**
- **"Connection timeout"**: Increase timeout in script (line 12: `timeout: 20000` → `60000`)
- **"Empty pages"**: Kajabi site may use JS rendering. Check if `<main>` or `<body>` contains content.
- **"403 Forbidden"**: Add User-Agent header to axios request

**Success criteria:**
- ✅ `out/kajabi_raw.json` exists
- ✅ File contains all expected pages (check count)
- ✅ Each entry has `source_url`, `title`, `body_html`

---

### Step 2: Map Information Architecture

```bash
npm run map
```

**What it does:**
- Reads `out/kajabi_raw.json`
- Maps legacy URLs to WordPress structure
- Smart routing:
  - `/blog/*` → `/resources/{slug}` (posts)
  - Contact/book → `/contact` (page)
  - Case studies → `/case-studies/{slug}` (pages)
  - Speaking → `/speaking` (page)
  - Default → `/{slug}` (pages)
- Creates `out/content_map.json`

**Verify output:**
```bash
cat out/content_map.json | jq '.[0]'
```

**Expected result:**
```json
{
  "source_url": "https://kajabi-site.com/blog/my-post",
  "title": "My Post",
  "body_html": "<p>Content...</p>",
  "target_url": "/resources/my-post",
  "type": "post",
  "status": "to_migrate"
}
```

**Review mapping:**
```bash
cat out/content_map.json | jq -r '.[] | "\(.source_url) → \(.target_url) (\(.type))"'
```

**Troubleshooting:**
- **Incorrect routing**: Edit `src/02_map_information_arch.ts` → `routeFor()` function
- **Slug conflicts**: Check for duplicate `target_url` values

**Success criteria:**
- ✅ `out/content_map.json` exists
- ✅ All `target_url` values are unique
- ✅ Routing matches business requirements
- ✅ Blog posts mapped to `type: "post"`, others to `type: "page"`

---

### Step 3: Optimize & Upload Media

```bash
npm run media
```

**What it does:**
- Reads `out/kajabi_raw.json`
- Extracts all `<img>` tags from HTML
- Downloads images to `tmp/media/`
- Converts to AVIF (quality 55) and WebP (quality 72)
- Uploads to WordPress Media Library
- Replaces legacy URLs with WordPress CDN URLs
- Creates `out/kajabi_media_inlined.json`

**Monitor progress:**
```bash
tail -f out/media.log  # if logging added
```

**Verify output:**
```bash
cat out/kajabi_media_inlined.json | jq '.[0].body_html' | grep -o 'https://.*wp-content/uploads'
```

**Expected result:**
- Image URLs changed from Kajabi to WordPress
- Example: `https://your-site.com/wp-content/uploads/2024/01/image.avif`

**Troubleshooting:**
- **"Sharp install failed"**: Run `npm install --build-from-source sharp`
- **"Upload failed"**: Check WP media upload limits (Settings → Media)
- **"Out of memory"**: Process images in batches (modify script)

**Success criteria:**
- ✅ `out/kajabi_media_inlined.json` exists
- ✅ `tmp/media/` contains AVIF/WebP files
- ✅ WordPress Media Library has new uploads
- ✅ HTML contains WordPress URLs (not Kajabi URLs)

---

### Step 4: Migrate Content

```bash
npm run migrate
```

**What it does:**
- Reads `out/content_map.json` and `out/kajabi_media_inlined.json`
- Normalizes HTML:
  - Removes inline styles, scripts, empty elements
  - Enforces single H1 rule
  - Adds `rel="noopener"` to external links
- Creates WordPress posts/pages as **drafts**
- Generates `out/redirects.csv`

**Monitor progress:**
```bash
# In another terminal
watch -n 2 'curl -u admin:password https://site.com/wp-json/wp/v2/pages | jq length'
```

**Verify WordPress content:**
1. WordPress Admin → Pages → All Pages
2. Should see new drafts with clean titles
3. Open one → Check content is clean HTML

**Check redirects.csv:**
```bash
cat out/redirects.csv
```

**Expected format:**
```csv
legacy_url,new_url,status
https://kajabi-site.com/old-page,https://wp-site.com/new-page,301
```

**Troubleshooting:**
- **"Create failed" errors**: Check console output for API errors
- **"Invalid slug"**: Slugify may create conflicts (add uniqueness check)
- **"Content too large"**: WordPress has 64KB limit for `post_content` (increase via php.ini)

**Success criteria:**
- ✅ All pages/posts created in WordPress (as drafts)
- ✅ HTML is clean (no inline styles, single H1)
- ✅ `out/redirects.csv` contains all mappings
- ✅ No "Create failed" errors in console

---

### Step 5: Localize with Polylang (Optional)

**Skip if:** Polylang not installed OR English-only launch

```bash
npm run localize
```

**What it does:**
- Fetches all draft pages from WordPress
- Creates Norwegian (NO) duplicates
- Sets language: `lang: "no"`
- Gracefully fails if Polylang not installed (no-op)

**Verify translations:**
1. WordPress Admin → Pages → All Pages
2. Look for language flags next to pages
3. Should see EN/NO linked pairs

**Troubleshooting:**
- **No translations created**: Verify Polylang is active and EN/NO languages configured
- **"API error"**: Polylang may not expose `lang` parameter in REST API (check version)

**Success criteria:**
- ✅ Norwegian pages created (if Polylang installed)
- ✅ Pages linked as translation pairs
- ✅ Script completes without errors (or gracefully skips)

---

### Step 6: Generate Redirects

```bash
npm run redirects
```

**What it does:**
- Reads `out/redirects.csv`
- Converts to Apache `.htaccess` format
- Creates `out/redirects.htaccess`

**Verify output:**
```bash
cat out/redirects.htaccess
```

**Expected format:**
```apache
Redirect 301 /old-page https://wp-site.com/new-page
Redirect 301 /blog/post https://wp-site.com/resources/post
```

**Deploy redirects:**
See WORDPRESS_SETUP.md → "Deploy Redirects" section

**Success criteria:**
- ✅ `out/redirects.htaccess` exists
- ✅ All legacy URLs mapped with 301 status
- ✅ Redirects deployed (via plugin or .htaccess)

---

### Step 7: AEO Enhancement

```bash
npm run aeo
```

**What it does:**
- Fetches all draft pages/posts
- Adds JSON-LD structured data:
  - Organization schema (sitewide)
  - WebSite schema with SearchAction
  - WebPage/Article schema per page
  - FAQPage schema (if ≥3 Q&As found)
  - BreadcrumbList navigation
- Extracts Q&As from H3 + P patterns
- Creates `/answers` hub page (QAPage schema)
- Adds AI-consumable summaries and TL;DR blocks

**Verify schema:**
1. Visit WordPress page
2. View source
3. Search for `<script type="application/ld+json">`
4. Should see Organization, WebSite, WebPage/Article, and possibly FAQPage

**Test with Google Rich Results:**
1. Go to [Rich Results Test](https://search.google.com/test/rich-results)
2. Enter page URL
3. Should detect Organization, WebSite, BreadcrumbList

**Verify /answers hub:**
1. Visit: `https://your-site.com/answers`
2. Should see aggregated Q&As
3. View source → Check for QAPage schema

**Troubleshooting:**
- **No Q&As found**: Add H3 questions + P answers to content first
- **Schema errors**: Validate with [Schema.org Validator](https://validator.schema.org/)
- **"/answers not published"**: Check if page was created (may be draft)

**Success criteria:**
- ✅ All pages have JSON-LD schema
- ✅ Home page has Organization + WebSite schema
- ✅ Pages with 3+ Q&As have FAQPage schema
- ✅ `/answers` hub published with QAPage schema
- ✅ AI summaries present in HTML

---

### Step 8: Performance Testing

```bash
npm run perf
```

**What it does:**
- Launches headless Chrome
- Runs Lighthouse on `WP_BASE_URL`
- Simulates 4G (150ms RTT, 1600 Kbps, 4x CPU)
- Checks performance budgets:
  - LCP ≤ 1800ms
  - CLS ≤ 0.1
  - INP ≤ 200ms
- Exits with error if budgets exceeded

**Expected output:**
```bash
{ lcp: 1456, cls: 0.05, inp: 120 }
# All metrics within budget ✅
```

**If budget fails:**
```bash
{ lcp: 2340, cls: 0.15, inp: 280 }
Error: Performance budget failed
```

**Optimization steps:**
1. Enable WP Rocket/LiteSpeed Cache (if not already)
2. Minify CSS/JS
3. Enable lazy loading
4. Preload LCP image:
   ```html
   <link rel="preload" as="image" href="/hero.avif">
   ```
5. Reduce JS bundle size (check Elementor widgets)
6. Use system fonts or preload custom fonts

**Re-test after optimizations:**
```bash
npm run perf
```

**Troubleshooting:**
- **"Chrome not found"**: Install Chrome/Chromium (`apt install chromium-browser`)
- **Timeout**: Increase timeout in script
- **Inconsistent results**: Run 3 times, take median

**Success criteria:**
- ✅ LCP ≤ 1800ms
- ✅ CLS ≤ 0.1
- ✅ INP ≤ 200ms
- ✅ Script exits without error

---

### Step 9: Ping IndexNow

```bash
npm run indexnow
```

**What it does:**
- Generates IndexNow key file: `out/pmc-indexnow-key.txt`
- Fetches all published pages/posts from WordPress
- Pings IndexNow API with up to 1000 URLs
- Submits to Bing + partners (Yandex, Seznam, etc.)

**Deploy key file first:**
1. Upload `out/pmc-indexnow-key.txt` to WordPress root via FTP/File Manager
2. Verify: `https://your-site.com/pmc-indexnow-key.txt` (should display key)

**Expected output:**
```bash
# No output = success
# IndexNow API returns 200 OK
```

**Verify submission:**
1. Bing Webmaster Tools → IndexNow → Submission History
2. Should see recent submission (may take 24-48 hours)

**Troubleshooting:**
- **"Key file not accessible"**: Verify file uploaded to root (not `/wp-content/`)
- **"API error"**: Check URLs use HTTPS (IndexNow requirement)
- **"Rate limit"**: Max 10,000 URLs/day per site

**Success criteria:**
- ✅ Key file accessible at root
- ✅ IndexNow ping sent without errors
- ✅ Bing Webmaster Tools shows submission

---

## Post-Migration Tasks

### 1. Review & Publish Content

**WordPress Admin workflow:**
1. Pages → All Pages → Filter: Drafts
2. For each page:
   - [ ] Review content accuracy
   - [ ] Check images loaded correctly
   - [ ] Verify links work (internal/external)
   - [ ] Edit with Elementor Pro
   - [ ] Add hero image/banner
   - [ ] Add primary CTA button with `data-cta-primary="cta-id"`
   - [ ] Add trust elements (testimonials, logos, stats)
   - [ ] Publish

**Elementor design checklist:**
- [ ] Hero section: Headline → Subheadline → CTA → Image
- [ ] Above-the-fold: <200KB JS, <150KB CSS (check DevTools)
- [ ] LCP image: Preloaded via WP Rocket or `<link rel="preload">`
- [ ] Mobile responsive (test in Elementor mobile view)
- [ ] Accessibility: Color contrast ≥4.5:1, focus states visible

### 2. Deploy Redirects

**Option A: Redirection Plugin**
1. Tools → Redirection → Import/Export
2. Upload `out/redirects.csv`
3. Map columns: Source (1), Target (2), Status (3)
4. Import

**Option B: .htaccess**
1. Edit `.htaccess` in root
2. **Before** `# BEGIN WordPress`, paste `out/redirects.htaccess` content
3. Save

**Test:**
```bash
curl -I https://old-kajabi-url.com/page
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://new-wordpress-url.com/page
```

### 3. Verify robots.txt

**Deploy:**
1. Upload `robots.txt` to root OR
2. Edit via Yoast/Rank Math → Tools → File Editor

**Update sitemap URL:**
```
Sitemap: https://YOUR-DOMAIN.com/wp-sitemap.xml
```

**Verify:**
- Visit: `https://your-domain.com/robots.txt`
- Should allow GPTBot, CCBot, PerplexityBot

### 4. Configure Plausible

**Verify script loading:**
1. View page source
2. Search for `plausible.io/js/script.js`
3. Should have `data-domain="your-domain.com"`

**Test custom events:**
1. Add CTA button: `<button data-cta-primary="hero-cta">Book Now</button>`
2. Click button
3. Plausible Dashboard → Custom Events → "CTA Click"
4. Should show 1 event with props: `id=hero-cta`, `variant=A/B/C`

### 5. Monitor Performance

**Run Lighthouse locally:**
```bash
npm run perf
```

**Or use Lighthouse CI:**
1. [PageSpeed Insights](https://pagespeed.web.dev/)
2. Enter URL
3. Check scores:
   - Performance: ≥90
   - Accessibility: ≥90
   - Best Practices: ≥90
   - SEO: 100

**Key metrics:**
- LCP ≤ 1.8s ✅
- CLS ≤ 0.1 ✅
- INP ≤ 200ms ✅
- FID ≤ 100ms
- TTI ≤ 3.8s

---

## Acceptance Checklist

### ✅ Content Migration

- [ ] All legacy URLs mapped (check `out/content_map.json`)
- [ ] All pages/posts exist in WordPress (drafts or published)
- [ ] Images converted to AVIF/WebP and uploaded
- [ ] HTML normalized (single H1, no inline styles, external link hygiene)
- [ ] Content reviewed for accuracy
- [ ] No broken internal links

### ✅ Page Design (Above-the-Fold)

- [ ] **Headline**: Clear value proposition (H1)
- [ ] **Subheadline**: Supporting text (H2 or P)
- [ ] **Primary CTA**: Prominent button with `data-cta-primary` attribute
- [ ] **Trust cue**: Testimonial, logo, stat, or social proof
- [ ] **All in HTML**: Not JavaScript-rendered (view source to verify)

### ✅ Performance

- [ ] Images in AVIF/WebP format
- [ ] LCP media preloaded by cache/CDN
- [ ] No >200KB resources above the fold
- [ ] JS bundle <200KB per route
- [ ] CSS bundle <150KB per route
- [ ] Lazy loading enabled for below-the-fold images
- [ ] Critical CSS generated (WP Rocket auto-generates)

### ✅ Localization (if Polylang installed)

- [ ] EN/NO parity: All pages have translations
- [ ] Language switcher visible in header/footer
- [ ] URLs use `/en/` and `/no/` structure
- [ ] Strings translated (menus, widgets, CTAs)
- [ ] `hreflang` tags present (Polylang adds automatically)

### ✅ SEO & Indexing

- [ ] `wp-sitemap.xml` live and accessible
- [ ] `robots.txt` allows AI bots (GPTBot, CCBot, PerplexityBot)
- [ ] IndexNow key file present at root
- [ ] IndexNow ping sent successfully
- [ ] Redirects deployed (301 from legacy URLs)
- [ ] No redirect chains (legacy → final, not legacy → interim → final)

### ✅ AEO (Answer Engine Optimization)

- [ ] `/answers` hub published
- [ ] `/answers` has QAPage schema (view source)
- [ ] Per-page JSON-LD present (WebPage/Article)
- [ ] FAQPage schema on pages with 3+ Q&As
- [ ] Sitewide Organization + WebSite schema on Home
- [ ] BreadcrumbList navigation on all pages
- [ ] AI-consumable summaries (`<meta name="ai-summary">`)
- [ ] TL;DR blocks on key pages

### ✅ Performance Budgets

- [ ] **LCP** ≤ 1.8s (Largest Contentful Paint)
- [ ] **CLS** ≤ 0.10 (Cumulative Layout Shift)
- [ ] **INP** ≤ 200ms (Interaction to Next Paint)
- [ ] Lighthouse Performance score ≥90
- [ ] Tested on simulated 4G (150ms RTT, 1600 Kbps)

### ✅ Analytics & Tracking

- [ ] Plausible script loaded (view source)
- [ ] Plausible events firing (test CTA click)
- [ ] A/B variant assigned on `<html>` tag (`data-ab="A/B/C"`)
- [ ] Custom events tracked: "CTA Click" with `id` and `variant` props
- [ ] No Google Analytics or other trackers (privacy-first)

### ✅ Accessibility

- [ ] Color contrast ≥4.5:1 (use Lighthouse or [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/))
- [ ] Focus states visible on interactive elements
- [ ] Reduced motion support (CSS in head-snippets.html)
- [ ] Alt text on all images
- [ ] Semantic HTML (headings in order, landmarks)

---

## Validation & Testing

### 1. Test Redirects

**Automated test:**
```bash
cat out/redirects.csv | tail -n +2 | while IFS=, read legacy new status; do
  echo "Testing: $legacy"
  curl -sI "$legacy" | grep -E "HTTP|Location"
done
```

**Manual test:**
1. Pick 5-10 random legacy URLs
2. Visit in incognito browser
3. Verify redirects to correct new URL
4. Check status is 301 (not 302)

### 2. Test Schema Markup

**Google Rich Results Test:**
1. Visit: [Rich Results Test](https://search.google.com/test/rich-results)
2. Test Home page
3. Should detect:
   - Organization
   - WebSite
   - BreadcrumbList

**Schema.org Validator:**
1. Visit: [Schema.org Validator](https://validator.schema.org/)
2. Test any page
3. Should show no errors (warnings OK)

### 3. Test Performance

**PageSpeed Insights:**
1. Visit: [PageSpeed Insights](https://pagespeed.web.dev/)
2. Enter URL
3. Check scores (Mobile + Desktop)
4. Target: Performance ≥90

**WebPageTest:**
1. Visit: [WebPageTest](https://www.webpagetest.org/)
2. Test from 3G location
3. Check waterfall for bloat

### 4. Test Accessibility

**Lighthouse Accessibility:**
```bash
npm run perf  # Already includes accessibility score
```

**WAVE:**
1. Visit: [WAVE](https://wave.webaim.org/)
2. Enter URL
3. Fix errors (not warnings)

**Keyboard navigation:**
1. Tab through entire page
2. All links/buttons should have visible focus state
3. Skip to content link should work

### 5. Test Plausible

**Live visitors:**
1. Visit site in incognito
2. Plausible dashboard should show "1 current visitor"

**Custom events:**
1. Click CTA with `data-cta-primary="test"`
2. Plausible → Custom Events → "CTA Click"
3. Breakdown → Filter by `id=test` and `variant=A/B/C`

### 6. Test IndexNow

**Verify key file:**
```bash
curl https://your-domain.com/pmc-indexnow-key.txt
# Should return: pmc-indexnow-key
```

**Check Bing Webmaster Tools:**
1. Login: [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. IndexNow → Submission History
3. Should see recent submission (24-48 hour delay)

### 7. Test Polylang (if installed)

**Language switcher:**
1. Visit any page
2. Click language switcher
3. Should change URL to `/no/` and show Norwegian content

**hreflang tags:**
1. View source on any page
2. Search for `hreflang`
3. Should see:
   ```html
   <link rel="alternate" hreflang="en" href="/en/page">
   <link rel="alternate" hreflang="no" href="/no/page">
   ```

---

## Rollback Plan

If critical issues found post-migration:

### Immediate Rollback

1. **Disable redirects:**
   - Redirection plugin: Deactivate
   - .htaccess: Comment out redirect rules

2. **Revert DNS (if already switched):**
   - Point domain back to Kajabi
   - Wait for TTL (usually 5-60 minutes)

3. **Communicate:**
   - Update stakeholders
   - Post maintenance notice if needed

### Fix Forward (Preferred)

1. **Keep redirects active** (users see new site)
2. **Fix issues in WordPress:**
   - Broken pages → Edit and republish
   - Performance → Optimize assets, enable caching
   - Schema errors → Fix JSON-LD
3. **Re-test:**
   - Run acceptance checklist again
   - Verify fixes work

---

## Success Metrics (30-day post-launch)

Track these metrics to measure migration success:

### Traffic & Engagement
- [ ] Organic traffic maintained or increased (Google Analytics/Plausible)
- [ ] Bounce rate ≤ baseline (pre-migration)
- [ ] Average session duration ≥ baseline
- [ ] Pages per session ≥ baseline

### SEO & Indexing
- [ ] All pages indexed in Google (site:your-domain.com)
- [ ] All pages indexed in Bing (site:your-domain.com)
- [ ] Keyword rankings maintained or improved (Google Search Console)
- [ ] Core Web Vitals: All "Good" (Search Console → Experience)

### Conversions
- [ ] CTA click rate (Plausible custom events)
- [ ] Form submissions ≥ baseline
- [ ] Consultation bookings ≥ baseline
- [ ] Email signups ≥ baseline

### Performance
- [ ] LCP ≤ 1.8s (95th percentile in Search Console)
- [ ] CLS ≤ 0.1 (95th percentile)
- [ ] INP ≤ 200ms (95th percentile)
- [ ] Page load time <3s (Plausible or GTmetrix)

### AEO (Answer Engine Optimization)
- [ ] ChatGPT cites your content (test with questions)
- [ ] Perplexity.ai cites your content
- [ ] Bing Chat cites your content
- [ ] `/answers` hub gets organic traffic

---

## Support & Troubleshooting

### Common Post-Migration Issues

**Issue: "Traffic dropped 20%+"**
- Check Search Console for crawl errors
- Verify all redirects are 301 (not 302)
- Check for redirect chains (legacy → interim → final)
- Ensure sitemap submitted to Google/Bing

**Issue: "Conversions dropped"**
- Verify CTAs visible above fold
- Check A/B variants are working (localStorage test)
- Test forms on mobile/desktop
- Review Plausible events (are clicks tracked?)

**Issue: "Page speed regressed"**
- Check cache is active (view headers)
- Verify minification enabled
- Test with cache cleared (WP Rocket/LiteSpeed)
- Review third-party scripts (Plausible only should be minimal)

**Issue: "Pages not indexed"**
- Submit sitemap to Search Console
- Check robots.txt allows Googlebot
- Verify pages are published (not drafts)
- Use URL Inspection tool in Search Console

---

## Next Steps After Acceptance

1. **Monitor analytics daily** (first 2 weeks)
2. **Run weekly performance tests** (`npm run perf`)
3. **Create content calendar** (blog posts, case studies)
4. **Optimize for conversions** (A/B test headlines, CTAs)
5. **Build backlinks** (outreach, guest posts)
6. **Update AEO content** (add more Q&As to `/answers`)
7. **Scale IndexNow pings** (weekly for new content)

**Migration complete! 🚀**
