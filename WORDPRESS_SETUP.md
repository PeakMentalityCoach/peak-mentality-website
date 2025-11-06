# WordPress Setup Guide

Complete WordPress plugin installation and configuration for the Peak Mentality Coaching migration.

## Required Plugins

### 1. Elementor Pro (Required)
**Purpose:** Visual page builder for content design

**Installation:**
1. Purchase license from [elementor.com/pro](https://elementor.com/pro)
2. Download plugin ZIP
3. WordPress Admin → Plugins → Add New → Upload Plugin
4. Activate and enter license key
5. Go to Elementor → Settings → Features
6. Enable: Landing Pages, Optimized DOM Output, Lazy Load Background Images

**Configuration:**
- Settings → General → Default Colors: Set brand colors
- Settings → Advanced → CSS Print Method: Internal Embedding
- Performance → Lazy Load: Enable
- Performance → Inline Font Icons: Enable

---

### 2. Code Snippets (Required)
**Purpose:** Inject analytics, A/B testing, and custom head tags

**Installation:**
1. WordPress Admin → Plugins → Add New
2. Search "Code Snippets"
3. Install "Code Snippets" by Code Snippets Pro
4. Activate

**Configuration:**
1. Snippets → Add New
2. Title: "Plausible + A/B Testing"
3. Code: Copy content from `head-snippets.html`
4. **Replace `%PLAUSIBLE_DOMAIN%`** with your actual domain (e.g., `peakmentality.com`)
5. Location: Select "Only run in site front-end"
6. Save and Activate

**Verify:**
- View page source, search for `data-ab` attribute on `<html>` tag
- Check browser localStorage for `pmc_ab_v1` key (A/B variant)
- Open DevTools Console: `window.abVariant` should show "A", "B", or "C"

---

### 3. Polylang (Optional - Bilingual EN/NO)
**Purpose:** English/Norwegian language support

**When to Install:**
- Bilingual content is required NOW
- Budget allows for translation costs
- Norwegian market is strategic priority

**Skip if:**
- English-only launch
- Translations coming later (can add anytime)

**Installation (if required):**
1. WordPress Admin → Plugins → Add New
2. Search "Polylang"
3. Install "Polylang" by WP SYNTEX
4. Activate

**Configuration:**
1. Languages → Add New Language
   - Language: English (US)
   - Language code: `en`
   - Set as default
2. Languages → Add New Language
   - Language: Norwegian
   - Language code: `no`
3. Settings → URL modifications: "The language is set from the directory name in pretty permalinks"
   - English: `https://peakmentality.com/en/`
   - Norwegian: `https://peakmentality.com/no/`
4. Settings → Media: Enable "Duplicate media in all languages"

**After Migration:**
Run `npm run localize` to create Norwegian duplicates

---

### 4. Caching & CDN (Required - Choose One)

#### Option A: WP Rocket (Premium - Recommended)
**Best for:** Shared hosting, VPS, most WordPress hosts

**Installation:**
1. Purchase license from [wp-rocket.me](https://wp-rocket.me)
2. Download plugin ZIP
3. WordPress Admin → Plugins → Add New → Upload Plugin
4. Activate and enter license key

**Configuration:**
1. **Cache Tab:**
   - ✅ Enable Caching for Mobile Devices
   - ✅ Enable Caching for Logged-in Users (if no personalization)
   - Cache Lifespan: 24 hours

2. **File Optimization:**
   - ✅ Minify CSS files
   - ✅ Combine CSS files
   - ✅ Minify JavaScript files
   - ✅ Combine JavaScript files (test this - may break some scripts)
   - ✅ Load JS deferred
   - CSS delivery: ✅ Optimize CSS Delivery (Critical CSS)

3. **Media Tab:**
   - ✅ Enable for images
   - ✅ Enable for iframes and videos
   - ✅ LazyLoad CSS background images
   - Image Dimensions: ✅ Add missing image dimensions
   - WebP Compatibility: ✅ Enable WebP caching

4. **Preload:**
   - ✅ Enable Link Preloading
   - ✅ Preload Fonts: Add `/wp-content/themes/your-theme/fonts/*.woff2`
   - Sitemap Preloading: Enter `https://yoursite.com/wp-sitemap.xml`

5. **Advanced Rules:**
   - Never Cache URL(s): `/wp-admin/`, `/cart/`, `/checkout/`
   - Never Cache Cookies: `comment_author_`, `wordpress_logged_in_`
   - Never Cache User Agent: (leave empty unless specific mobile cache needed)

6. **Database:**
   - ✅ Post Cleanup (run weekly)
   - ✅ Comments Cleanup
   - ✅ Transients Cleanup
   - Schedule Automatic Cleanup: Weekly

7. **CDN Tab:**
   - If using Cloudflare: Enable and add Cloudflare API credentials
   - CDN CNAME(s): Add your CDN domain if applicable

**Performance Targets:**
- Should achieve <200KB JS, <150KB CSS with minification + combine

#### Option B: LiteSpeed Cache (Free - Best for LiteSpeed Hosts)
**Best for:** Hosts using LiteSpeed Web Server (check with host)

**Verify LiteSpeed Support:**
1. Contact hosting support: "Does my server run LiteSpeed Web Server?"
2. Or check: `phpinfo()` → Server API should show "LiteSpeed"

**Installation:**
1. WordPress Admin → Plugins → Add New
2. Search "LiteSpeed Cache"
3. Install "LiteSpeed Cache" by LiteSpeed Technologies
4. Activate

**Configuration:**
1. **Cache Tab:**
   - ✅ Enable Cache
   - ✅ Cache Logged-in Users
   - TTL: 604800 (1 week)

2. **CSS Settings:**
   - CSS Minify: ON
   - CSS Combine: ON
   - Generate Critical CSS: ON (auto-generate)

3. **JS Settings:**
   - JS Minify: ON
   - JS Combine: ON (test - may need to exclude scripts)
   - Load JS Deferred: ON

4. **Optimization - Media:**
   - Lazy Load Images: ON
   - WebP Replacement: ON
   - Image Optimization: ON (requires QUIC.cloud account - free tier available)

5. **Optimization - Page Optimization:**
   - HTML Minify: ON
   - DNS Prefetch: Add `https://plausible.io`

6. **Image Optimization (QUIC.cloud):**
   - Create free account at [quic.cloud](https://quic.cloud)
   - Link API key in LiteSpeed Cache settings
   - Optimization: Lossless for PNG, Lossy 82% for JPG
   - ✅ Create WebP versions

**LiteSpeed-Specific Features:**
- Object Cache (if host supports): Turbo charge database queries
- ESI Blocks: Cache dynamic widgets separately
- Crawler: Pre-cache all pages via sitemap

---

### 5. Image Optimization (Optional but Recommended)

#### Option A: ShortPixel (Recommended)
**Installation:**
1. WordPress Admin → Plugins → Add New
2. Search "ShortPixel Image Optimizer"
3. Install and Activate
4. Register free account (100 images/month free)

**Configuration:**
- Compression: Lossy (recommended for web)
- ✅ Also create WebP versions
- ✅ Also create AVIF versions (if supported by host)
- Resize large images: Max width 2000px
- ✅ Optimize PDFs
- Backup: Keep originals (for first month, then disable to save space)

**Note:** Migration script already creates AVIF/WebP, so this is for future uploads.

#### Option B: Jetpack Image CDN
**Installation:**
1. WordPress Admin → Plugins → Add New
2. Search "Jetpack"
3. Install and Activate
4. Connect to WordPress.com account (free)

**Configuration:**
- Jetpack → Settings → Performance
- ✅ Enable site accelerator for images
- ✅ Enable lazy loading
- ✅ Serve images from WordPress.com CDN

**Benefit:** Free unlimited image CDN by Automattic

---

### 6. Redirects Management (Required - Choose One)

#### Option A: Redirection Plugin (Recommended)
**Installation:**
1. WordPress Admin → Plugins → Add New
2. Search "Redirection"
3. Install "Redirection" by John Godley
4. Activate

**Configuration:**
1. Tools → Redirection → Setup
2. Complete setup wizard
3. Go to Tools → Redirection → Import/Export
4. Click "Import"
5. Upload `out/redirects.csv`
6. Map columns:
   - Source URL → Column 1 (legacy_url)
   - Target URL → Column 2 (new_url)
   - HTTP code → Column 3 (status)
7. Click "Import"

**Verify:**
1. Test legacy URL in browser (use incognito mode)
2. Should redirect to new URL with 301 status
3. Check DevTools Network tab → Status Code should be "301"

#### Option B: Manual .htaccess (Advanced)
**When to use:** If host has .htaccess access and you prefer Apache redirects

**Installation:**
1. Download `out/redirects.htaccess` from migration output
2. Connect via FTP/SFTP or File Manager
3. Navigate to WordPress root (where `wp-config.php` lives)
4. Open `.htaccess` file
5. **Before** `# BEGIN WordPress`, paste redirect rules from `out/redirects.htaccess`
6. Save file

**Example .htaccess structure:**
```apache
# BEGIN Redirects
Redirect 301 /old-page https://newsite.com/new-page
Redirect 301 /blog/post https://newsite.com/resources/post
# END Redirects

# BEGIN WordPress
<IfModule mod_rewrite.c>
...
```

**Verify same as Option A**

---

### 7. Plausible Analytics (No Plugin Required)
**Already configured via Code Snippets** (see #2 above)

**Verify Installation:**
1. Visit your site
2. Open DevTools → Network tab
3. Filter by "script.js"
4. Should see request to `https://plausible.io/js/script.js`
5. Check Plausible dashboard for live visitors

**Custom Events (Already Configured):**
- **CTA Click**: Fires when clicking `[data-cta-primary]` elements
- **Props**: `id` (CTA identifier), `variant` (A/B test variant)

**View Results:**
1. Plausible Dashboard → Your Domain
2. Custom Events → "CTA Click"
3. Breakdown → Filter by `variant` property (A/B/C)

---

## Post-Installation Checklist

### ✅ Core Setup
- [ ] Elementor Pro activated and licensed
- [ ] Code Snippets installed with head-snippets.html
- [ ] Polylang installed (if bilingual required)
- [ ] WP Rocket OR LiteSpeed Cache installed and configured
- [ ] ShortPixel OR Jetpack Image CDN installed (optional)
- [ ] Redirection plugin installed with CSV imported

### ✅ Performance Settings
- [ ] Permalink structure set to "Post name" (Settings → Permalinks)
- [ ] WP Rocket/LiteSpeed minification enabled
- [ ] Lazy loading enabled for images
- [ ] WebP/AVIF support enabled
- [ ] Critical CSS generated (WP Rocket auto-generates)

### ✅ Cache Exclusions
- [ ] Excluded URLs: `/wp-admin/`, `/cart/`, `/checkout/`, `/my-account/`
- [ ] Excluded cookies: `comment_author_`, `wordpress_logged_in_`

### ✅ Elementor Performance
- [ ] Elementor → Settings → Features → Optimized DOM Output: ON
- [ ] Elementor → Settings → Features → Improved Asset Loading: ON
- [ ] Elementor → Experiments → Flexbox Container: Active (lighter than columns)

### ✅ Analytics & Tracking
- [ ] Plausible script loading in page source
- [ ] A/B variant assigned in browser (check localStorage)
- [ ] CTA click tracking working (test button with `data-cta-primary="test"`)

### ✅ SEO & Indexing
- [ ] `robots.txt` deployed with AI bot allowances
- [ ] `wp-sitemap.xml` accessible at `/wp-sitemap.xml`
- [ ] IndexNow key file uploaded to root (see next section)

---

## Deploy IndexNow Key File

### Step 1: Generate Key File
```bash
npm run indexnow
```
This creates: `out/pmc-indexnow-key.txt`

### Step 2: Upload to Site Root

#### Option A: File Manager (cPanel/Plesk)
1. Login to hosting control panel
2. File Manager → Navigate to `public_html` or `www`
3. Upload `out/pmc-indexnow-key.txt`
4. Rename if needed to match `.env` INDEXNOW_KEY value

#### Option B: FTP/SFTP
1. Connect via FileZilla or Cyberduck
2. Navigate to WordPress root (where `wp-config.php` is)
3. Upload `pmc-indexnow-key.txt`

#### Option C: SSH
```bash
scp out/pmc-indexnow-key.txt user@yourhost.com:/path/to/public_html/
```

### Step 3: Verify Access
Visit: `https://your-domain.com/pmc-indexnow-key.txt`

Should display your key (e.g., `pmc-indexnow-key`)

### Step 4: Ping IndexNow
```bash
npm run indexnow
```
Submits all pages/posts to Bing + partners for instant indexing

---

## Deploy Redirects

### Using Redirection Plugin (Recommended)

1. **Export from migration:**
   ```bash
   npm run redirects
   ```
   Creates: `out/redirects.csv`

2. **Import to WordPress:**
   - Tools → Redirection → Import/Export
   - Click "Import"
   - Upload `out/redirects.csv`
   - Map columns: Source URL (1), Target URL (2), HTTP Code (3)
   - Import

3. **Test redirects:**
   ```bash
   curl -I https://old-kajabi-url.com/page
   # Should return: HTTP/1.1 301 Moved Permanently
   # Location: https://new-wordpress-url.com/page
   ```

### Using .htaccess (Advanced)

1. **Generate .htaccess:**
   ```bash
   npm run redirects
   ```
   Creates: `out/redirects.htaccess`

2. **Deploy to server:**
   - FTP/File Manager → Navigate to WordPress root
   - Edit `.htaccess`
   - **Before** `# BEGIN WordPress`, paste contents of `out/redirects.htaccess`
   - Save

3. **Example structure:**
   ```apache
   # BEGIN Peak Mentality Redirects
   Redirect 301 /old-page https://new-site.com/new-page
   # END Peak Mentality Redirects

   # BEGIN WordPress
   <IfModule mod_rewrite.c>
   ...
   ```

4. **Test same as above**

---

## Polylang Language Setup (If Installed)

### 1. Configure Languages

**WordPress Admin → Languages → Languages**

| Language | Code | Order | Default |
|----------|------|-------|---------|
| English (US) | en | 1 | ✅ Yes |
| Norwegian | no | 2 | No |

### 2. URL Structure

**Settings → URL modifications:**

Select: "The language is set from the directory name in pretty permalinks"

**Result:**
- English: `https://peakmentality.com/en/about`
- Norwegian: `https://peakmentality.com/no/about`

### 3. Media Settings

**Settings → Media:**
- ✅ Duplicate media in all languages
- ✅ Translate media (allows different alt text per language)

### 4. String Translation

**Strings → String translation:**

Translate:
- Site title: "Peak Mentality Coaching" → "Peak Mentality Coaching" (same)
- Tagline: "High-performance coaching" → "Høyprestasjonscoaching"
- Menu items: "About", "Services", "Contact" → "Om oss", "Tjenester", "Kontakt"

### 5. Run Localization Script

```bash
npm run localize
```

**What it does:**
- Fetches all draft pages in English
- Creates Norwegian duplicates
- Marks as drafts for manual translation
- Links as language pairs in Polylang

**After script:**
1. Go to Pages → All Pages
2. You'll see language flags next to each page
3. Click Norwegian flag to edit translation
4. Translate content or hire translator
5. Publish when ready

### 6. Add Language Switcher

**Appearance → Widgets:**
1. Find "Polylang Language Switcher" widget
2. Drag to header or footer widget area
3. Settings:
   - Display as: Dropdown
   - Show flags: Yes
   - Show names: Yes
   - Force link to front page: No

**Or via Elementor:**
1. Edit page with Elementor
2. Search for "Language Switcher" widget
3. Drag to header/footer template
4. Style as needed

---

## robots.txt Deployment

### Option 1: Via Plugin (Yoast/Rank Math)

**Yoast SEO:**
1. SEO → Tools → File Editor
2. Edit `robots.txt`
3. Replace with content from repo `robots.txt`
4. Update sitemap URL to your domain
5. Save

**Rank Math:**
1. Rank Math → General Settings → Edit robots.txt
2. Same as above

### Option 2: Direct File Upload

1. Create `robots.txt` in WordPress root
2. Paste content from repo
3. **Update line:** `Sitemap: https://YOUR-DOMAIN.com/wp-sitemap.xml`
4. Save

### Verify
Visit: `https://your-domain.com/robots.txt`

Should show:
```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /
User-agent: CCBot
Allow: /
User-agent: PerplexityBot
Allow: /

Sitemap: https://your-domain.com/wp-sitemap.xml
```

---

## Verify Sitemap

WordPress 5.5+ includes XML sitemaps by default.

**Access:**
`https://your-domain.com/wp-sitemap.xml`

**Should show:**
- `wp-sitemap-posts-post-1.xml` (blog posts)
- `wp-sitemap-posts-page-1.xml` (pages)
- `wp-sitemap-taxonomies-category-1.xml` (categories)

**If using Yoast/Rank Math:** They override default sitemap.
- Yoast: `/sitemap_index.xml`
- Rank Math: `/sitemap_index.xml`

**Update robots.txt accordingly**

---

## Testing Checklist

### ✅ Caching
- [ ] Visit page → View source → Should see HTML (not loading screen)
- [ ] Check headers: `x-cache: HIT` (WP Rocket) or `x-litespeed-cache: hit` (LiteSpeed)
- [ ] Test cache clear: WP Rocket/LiteSpeed → Clear Cache → Reload page

### ✅ Minification
- [ ] View source → CSS/JS links should have `?ver=hash` or `.min.` in filename
- [ ] CSS file size: <150KB (check Network tab)
- [ ] JS file size: <200KB (check Network tab)

### ✅ Lazy Loading
- [ ] Open DevTools → Network → Disable cache
- [ ] Scroll slowly down page
- [ ] Images should load as they enter viewport (not all at once)

### ✅ WebP/AVIF
- [ ] View image URL in browser
- [ ] Should serve `.avif` or `.webp` (check Content-Type header)
- [ ] Or check: `<img src="image.jpg">` but served as WebP via cache

### ✅ Redirects
- [ ] Visit old Kajabi URL
- [ ] Should redirect to new WordPress URL (301 status)
- [ ] Test multiple URLs from `out/redirects.csv`

### ✅ Plausible
- [ ] Visit site → Plausible dashboard should show "1 current visitor"
- [ ] Click CTA button with `data-cta-primary="test"`
- [ ] Plausible → Custom Events → "CTA Click" should increment

### ✅ A/B Testing
- [ ] Open DevTools → Application → Local Storage
- [ ] Should see `pmc_ab_v1` key with value "A", "B", or "C"
- [ ] Inspect `<html>` tag → `data-ab="A"` attribute
- [ ] Hero headline should vary based on variant

### ✅ IndexNow
- [ ] Verify key file accessible: `https://your-domain.com/pmc-indexnow-key.txt`
- [ ] Run `npm run indexnow`
- [ ] No errors = successful ping
- [ ] Check Bing Webmaster Tools for indexing status (24-48 hours)

### ✅ Polylang (if installed)
- [ ] Language switcher visible in header/footer
- [ ] Switch to Norwegian → URL changes to `/no/`
- [ ] Content shows Norwegian version
- [ ] Pages are linked (click flag icon in admin)

---

## Common Issues & Fixes

### Issue: "White screen" after activating WP Rocket
**Fix:**
1. Deactivate via FTP: Rename `/wp-content/plugins/wp-rocket` → `/wp-rocket-disabled`
2. Reactivate via WordPress Admin
3. WP Rocket → File Optimization → Disable "Combine CSS" and "Combine JS"
4. Test again, re-enable one at a time

### Issue: Elementor pages not loading
**Fix:**
1. Elementor → Tools → Regenerate CSS
2. Clear cache (WP Rocket/LiteSpeed)
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: Plausible not tracking
**Fix:**
1. Check browser ad blocker (disable for your site)
2. View source → Verify `<script defer data-domain="...">` is present
3. Check domain matches exactly (no www. vs www)
4. Plausible → Settings → Verify domain is added

### Issue: Images not lazy loading
**Fix:**
1. Disable lazy load in WP Rocket/LiteSpeed temporarily
2. Let Elementor handle lazy load: Elementor → Settings → Features → Lazy Load: ON
3. Re-enable cache plugin lazy load after testing

### Issue: Redirects not working
**Fix:**
1. Check .htaccess file has redirect rules BEFORE `# BEGIN WordPress`
2. Clear browser cache (redirects are cached)
3. Test in incognito mode
4. Verify Redirection plugin is active
5. Check Apache `mod_rewrite` is enabled (ask host)

### Issue: Polylang translations missing
**Fix:**
1. Run `npm run localize` again
2. Check Pages → All Pages for language flags
3. If missing, manually link: Edit page → Languages metabox → Select linked translation
4. Publish both EN and NO versions

---

## Next Steps

Once all plugins are installed and configured:

1. ✅ Run migration pipeline (see RUNBOOK.md)
2. ✅ Review all draft content in WordPress Admin
3. ✅ Design pages with Elementor Pro
4. ✅ Add hero images, CTAs, and trust elements
5. ✅ Publish content
6. ✅ Deploy redirects
7. ✅ Run AEO enhancement
8. ✅ Test performance
9. ✅ Ping IndexNow
10. ✅ Monitor Plausible analytics

**Ready to migrate!** 🚀
