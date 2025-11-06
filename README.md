# Peak Mentality Coaching - WordPress Migration & AEO Stack

Kajabi → WordPress + Elementor Pro migration toolkit with Answer Engine Optimization (AEO) for AI crawlers.

## Stack

- **WordPress + Elementor Pro** - Content as clean HTML in `post_content`
- **Polylang** (optional) - EN/NO bilingual support (gracefully skips if not installed)
- **Plausible Analytics** - Privacy-first analytics
- **WP Rocket / LiteSpeed Cache** - Performance optimization
- **Code Snippets** - Inject analytics + A/B testing JS/CSS

## Performance Targets

- **JavaScript**: <200KB per route
- **CSS**: <150KB per route
- **LCP**: ≤1800ms
- **CLS**: ≤0.1
- **INP**: ≤200ms

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your credentials:
```env
WP_BASE_URL=https://your-wordpress-site.com
WP_USER=admin
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
KAJABI_BASE_URL=https://your-kajabi-site.com
PLAUSIBLE_DOMAIN=your-domain.com
INDEXNOW_KEY=pmc-indexnow-key
```

### Generate WordPress Application Password

1. Go to WordPress Admin → Users → Profile
2. Scroll to "Application Passwords"
3. Create new application password named "Migration Script"
4. Copy the generated password (format: `xxxx xxxx xxxx xxxx xxxx xxxx`)

## Migration Pipeline

Run scripts in order:

### 1. Crawl Kajabi Site
```bash
npm run crawl
```
- Recursively crawls entire Kajabi site
- Extracts titles and body HTML
- Outputs: `out/kajabi_raw.json`

### 2. Map Information Architecture
```bash
npm run map
```
- Maps legacy URLs to WordPress structure
- Smart routing:
  - `/blog/*` → `/resources/{slug}` (posts)
  - Contact/book → `/contact` (page)
  - Case studies → `/case-studies/{slug}` (pages)
  - Speaking → `/speaking` (page)
- Outputs: `out/content_map.json`

### 3. Optimize & Upload Media
```bash
npm run media
```
- Downloads all images from crawled HTML
- Converts to AVIF (quality 55) + WebP (quality 72) fallback
- Uploads to WordPress Media Library
- Replaces URLs in HTML
- Outputs: `out/kajabi_media_inlined.json`

### 4. Migrate Content
```bash
npm run migrate
```
- Creates WordPress posts/pages (as drafts)
- Normalizes HTML:
  - Single H1 rule
  - External link hygiene (`rel="noopener"`)
  - Removes inline styles and empty elements
- Generates redirect mapping
- Outputs: `out/redirects.csv`

### 5. Create Norwegian Translations (Optional)
```bash
npm run localize
```
- Creates Norwegian (NO) duplicates of draft pages
- Gracefully skips if Polylang not installed
- No-op if plugin missing

### 6. Generate Apache Redirects
```bash
npm run redirects
```
- Converts `redirects.csv` to `.htaccess` format
- Outputs: `out/redirects.htaccess`

### 7. AEO Enhancement (Answer Engine Optimization)
```bash
npm run aeo
```
- Adds JSON-LD structured data:
  - Organization schema
  - WebSite with SearchAction
  - WebPage/Article per page
  - FAQPage/QAPage when applicable
  - BreadcrumbList navigation
- Extracts Q&As from H3 + P patterns
- Creates `/answers` hub page (AEO gold for AI crawlers)
- Adds AI-consumable summaries and TL;DR blocks

### 8. Performance Testing
```bash
npm run perf
```
- Runs Lighthouse CI with performance budgets
- Simulated 4G (150ms RTT, 1600 Kbps, 4x CPU)
- Fails if budgets exceeded

### 9. Ping IndexNow
```bash
npm run indexnow
```
- Generates IndexNow key file
- Pings Bing + partners (Yandex, Seznam, etc.)
- Fast indexing for up to 1000 URLs

## WordPress Setup

### Required Plugins

1. **Elementor Pro** (premium)
2. **WP Rocket** or **LiteSpeed Cache**
3. **Code Snippets** (free)
4. **Polylang** (optional, free/pro)

### Deploy robots.txt

1. Copy `robots.txt` to WordPress root (or edit via Yoast/Rank Math)
2. Update sitemap URL to your domain
3. Explicitly allows AI bots:
   - GPTBot (OpenAI/ChatGPT)
   - CCBot (Common Crawl/Claude)
   - PerplexityBot (Perplexity AI)

### Deploy Head Snippets

1. Install **Code Snippets** plugin
2. Create new snippet (HTML type)
3. Copy content from `head-snippets.html`
4. Replace `%PLAUSIBLE_DOMAIN%` with your actual domain
5. Set to run on: "Front-end only"
6. Activate snippet

**Includes:**
- Plausible Analytics
- A/B testing (3 variants: A/B/C)
- CTA click tracking
- Reduced motion accessibility

### Deploy IndexNow Key

1. Run `npm run indexnow` to generate key file
2. Upload `out/pmc-indexnow-key.txt` to WordPress root via FTP/File Manager
3. Verify accessible at: `https://your-domain.com/pmc-indexnow-key.txt`

### Deploy Redirects

1. Open `out/redirects.htaccess`
2. Copy all redirect rules
3. Add to WordPress `.htaccess` file (before `# BEGIN WordPress`)
4. Or use **Redirection** plugin (import CSV)

## AEO Features

### JSON-LD Structured Data

- **Organization**: Company info, logo, social profiles
- **WebSite**: Site-wide search action
- **Article/WebPage**: Per-page metadata with breadcrumbs
- **FAQPage**: Auto-generated from H3 questions + P answers
- **QAPage**: `/answers` hub with aggregated Q&As

### AI Crawler Optimization

- AI-consumable summaries (`<meta name="ai-summary">`)
- TL;DR blocks on homepage
- Citation-ready Q&As with source links
- Clean semantic HTML (single H1, proper heading hierarchy)
- Explicit bot permissions in robots.txt

### /answers Hub

Auto-generated page consolidating all Q&As from site content:
- Up to 50 unique questions
- Cited sources with backlinks
- QAPage schema for AI engines
- Perfect for ChatGPT/Perplexity/Bing Chat citations

## Performance Optimization

### Lighthouse CI Budgets

Script enforces strict performance budgets:
- **LCP** (Largest Contentful Paint): ≤1800ms
- **CLS** (Cumulative Layout Shift): ≤0.1
- **INP** (Interaction to Next Paint): ≤200ms

### Media Optimization

- AVIF primary (55% quality, ~40% smaller than WebP)
- WebP fallback (72% quality)
- All images uploaded to WordPress CDN
- Lazy loading via Elementor/WP Rocket

### Cache Strategy

**WP Rocket:**
- Page caching enabled
- GZIP compression
- Minify HTML/CSS/JS
- Defer JS loading
- Remove query strings

**LiteSpeed Cache:**
- Object cache (Redis/Memcached)
- Image optimization (WebP/AVIF)
- Critical CSS generation
- ESI for dynamic blocks

## A/B Testing

Minimal localStorage-based A/B testing (3 variants):

**Variant A**: "Unlock elite focus"
**Variant B**: "High-performance coaching that ships results"
**Variant C**: "Think clearer. Execute faster. Win more."

Tracks CTA clicks with Plausible custom events:
```html
<button data-cta-primary="book-consult">Book a Consult</button>
```

View results in Plausible: Events → "CTA Click" → Breakdown by variant

## Output Files

```
out/
├── kajabi_raw.json              # Crawled pages
├── content_map.json             # URL mapping + content types
├── kajabi_media_inlined.json    # HTML with WordPress media URLs
├── redirects.csv                # Legacy → new URL mappings
├── redirects.htaccess            # Apache redirect rules
└── pmc-indexnow-key.txt         # IndexNow verification key

tmp/
└── media/                        # Downloaded images (AVIF/WebP)
```

## Troubleshooting

### "401 Unauthorized" Error

- Verify WordPress Application Password is correct
- Check username matches WordPress admin username
- Ensure REST API is enabled (Settings → Permalinks → Save)

### "Connection refused" or Timeout

- Check `WP_BASE_URL` has no trailing slash
- Verify WordPress site is accessible
- Increase timeout in scripts (default: 20s)

### Polylang Not Working

- Install Polylang plugin first
- Configure EN/NO languages in WordPress Admin
- Run `npm run localize` after migration

### Images Not Converting

- Install Sharp dependencies: `npm install sharp --save`
- Check write permissions on `tmp/media/` directory
- Verify source images are valid (PNG/JPG/WebP)

### IndexNow Not Pinging

- Ensure key file is accessible at root
- Check `INDEXNOW_KEY` matches filename
- Verify URLs use HTTPS (IndexNow requirement)

### Performance Budget Failing

- Run `npm run perf` to see actual metrics
- Check WP Rocket/LiteSpeed Cache is active
- Review Elementor widget bloat (disable unused widgets)
- Audit third-party scripts in head-snippets.html

## Next Steps

1. Review draft posts/pages in WordPress Admin
2. Customize with Elementor Pro
3. Add hero images and CTAs
4. Publish content
5. Deploy redirects
6. Run AEO enhancement
7. Test performance
8. Ping IndexNow

## License

Private - Peak Mentality Coaching
