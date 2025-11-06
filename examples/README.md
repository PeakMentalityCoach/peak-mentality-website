# Example Output Files

Sample outputs showing what each migration script produces. These are examples based on a hypothetical Peak Mentality Coaching Kajabi site.

## File Overview

### 01_kajabi_raw.json
**Produced by:** `npm run crawl` (src/01_crawl_kajabi.ts)

Sample crawled data from Kajabi site. Contains:
- `source_url`: Original Kajabi URL
- `title`: Page title from `<title>` tag
- `body_html`: Extracted HTML from `<main>` or `<body>`

**Real output location:** `out/kajabi_raw.json`

---

### 02_content_map.json
**Produced by:** `npm run map` (src/02_map_information_arch.ts)

URL mapping with WordPress routing. Adds:
- `target_url`: New WordPress URL path
- `type`: "post" or "page"
- `status`: "to_migrate"

**Smart routing examples:**
- `/blog/*` → `/resources/*` (posts)
- `/case-studies` → `/case-studies/*` (pages)
- `/speaking` → `/speaking` (page)
- Contact/book → `/contact` (page)

**Real output location:** `out/content_map.json`

---

### 03_redirects.csv
**Produced by:** `npm run migrate` (src/04_migrate_posts.ts)

CSV file with 301 redirect mappings. Format:
```csv
legacy_url,new_url,status
```

Used for:
- Importing to Redirection plugin
- Generating .htaccess file

**Real output location:** `out/redirects.csv`

---

### 04_redirects.htaccess
**Produced by:** `npm run redirects` (src/06_generate_redirects.ts)

Apache `.htaccess` format with 301 redirects. Ready to:
- Copy into WordPress `.htaccess` (before `# BEGIN WordPress`)
- Deploy to Apache server

**Real output location:** `out/redirects.htaccess`

---

## How to Use These Examples

### 1. View Sample Data Structure
```bash
cat examples/01_kajabi_raw.json | jq '.[0]'
```

### 2. See URL Mapping Logic
```bash
cat examples/02_content_map.json | jq -r '.[] | "\(.source_url) → \(.target_url) (\(.type))"'
```

**Output:**
```
https://kajabi-site.com/ → / (page)
https://kajabi-site.com/about → /about (page)
https://kajabi-site.com/blog/5-ways-to-improve-focus → /resources/5-ways-to-improve-focus-for-high-performers (post)
```

### 3. Check Redirects
```bash
cat examples/03_redirects.csv
```

### 4. Preview .htaccess Rules
```bash
cat examples/04_redirects.htaccess
```

---

## Real Migration Output

When you run the actual migration, outputs will be in `out/` directory:

```
out/
├── kajabi_raw.json              # Step 1: npm run crawl
├── content_map.json             # Step 2: npm run map
├── kajabi_media_inlined.json    # Step 3: npm run media
├── redirects.csv                # Step 4: npm run migrate
├── redirects.htaccess           # Step 5: npm run redirects
└── pmc-indexnow-key.txt         # Step 6: npm run indexnow
```

---

## Differences from Examples

**Examples show:**
- 9 pages (simplified for demo)
- Kajabi → WordPress URL mappings
- Clean structure for learning

**Real output will have:**
- All crawled pages (could be 50-500+)
- Media URLs replaced with WordPress CDN URLs
- More complex routing based on actual site structure
- Additional metadata (dates, authors, etc.)

---

## Testing with Examples

You can use these examples to understand the migration flow without running scripts:

### Simulate URL Mapping
```bash
# Show before/after URLs
jq -r '.[] | "\(.source_url) → https://peakmentality.com\(.target_url)"' examples/02_content_map.json
```

### Count Pages vs Posts
```bash
# Count pages
jq '[.[] | select(.type == "page")] | length' examples/02_content_map.json

# Count posts
jq '[.[] | select(.type == "post")] | length' examples/02_content_map.json
```

### Verify Redirect Status Codes
```bash
# All should be 301
jq -r '.[] | "\(.status)"' examples/02_content_map.json | sort | uniq -c
```

---

## Next Steps

Once you understand the example outputs:

1. **Run actual migration** → Follow [RUNBOOK.md](../RUNBOOK.md)
2. **Review outputs** → Check `out/` directory after each script
3. **Verify in WordPress** → Check Pages/Posts in admin
4. **Deploy redirects** → Use CSV or .htaccess

**Visual preview:** See [DEMO_PREVIEW.md](../DEMO_PREVIEW.md) for what the final website looks like.
