const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const SOURCE_SITEMAP = path.join(BUILD_DIR, 'sitemap.xml');
const REACT_UTILITIES_DIR = path.join(__dirname, '..', 'src', 'pages', 'utilities');

const CANONICAL_ORIGIN = 'https://cadautoscript.com';

const SECTION_RULES = [
  {name: 'utilities', prefix: '/utilities/'},
  {name: 'mini-games', prefix: '/mini-games/'},
  {name: 'docs', prefix: '/docs/'},
  {name: 'blog', prefix: '/blog'},
];

function getReactUtilitySlugs() {
  if (!fs.existsSync(REACT_UTILITIES_DIR)) return new Set();
  return new Set(
    fs
      .readdirSync(REACT_UTILITIES_DIR)
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => f.replace(/\.tsx$/, '')),
  );
}

function isExcludedUrl(url, reactSlugs) {
  const parsed = new URL(url);

  // Exclude any non-canonical origin (http, www).
  if (parsed.origin !== CANONICAL_ORIGIN) return true;

  const pathname = parsed.pathname.replace(/\/$/, '');

  // Exclude /docs/utilities/{slug} when a React page exists at /utilities/{slug}/
  // (those are duplicates with canonical pointing to the React page).
  const docsUtilMatch = pathname.match(/^\/docs\/utilities\/([^/]+)$/);
  if (docsUtilMatch && reactSlugs.has(docsUtilMatch[1])) return true;

  // Exclude legacy /games/* if it ever leaks into the sitemap.
  if (pathname === '/games' || pathname.startsWith('/games/')) return true;

  return false;
}

function readSourceSitemap() {
  if (!fs.existsSync(SOURCE_SITEMAP)) {
    throw new Error('Missing build/sitemap.xml. Run `npm run build` first.');
  }
  return fs.readFileSync(SOURCE_SITEMAP, 'utf8');
}

function extractUrls(xml) {
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return matches.map((match) => match[1]);
}

function shouldKeepUrlAsIs(url) {
  const pathname = new URL(url).pathname;
  if (pathname === '/' || pathname.endsWith('/')) {
    return true;
  }
  const lastSegment = pathname.split('/').pop() || '';
  return lastSegment.includes('.');
}

function ensureTrailingSlash(url) {
  if (shouldKeepUrlAsIs(url)) {
    return url;
  }
  const parsed = new URL(url);
  parsed.pathname = `${parsed.pathname}/`;
  return parsed.toString();
}

function normalizeSitemapXml(xml, reactSlugs) {
  // Drop excluded <url> blocks entirely; normalize remaining URLs.
  return xml.replace(/<url>[\s\S]*?<\/url>\s*/g, (block) => {
    const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
    if (!locMatch) return block;
    const url = locMatch[1];
    if (isExcludedUrl(url, reactSlugs)) {
      return '';
    }
    const normalized = ensureTrailingSlash(url);
    return block.replace(/<loc>[^<]+<\/loc>/, `<loc>${normalized}</loc>`);
  });
}

function getOrigin(urls) {
  const first = urls[0];
  if (!first) {
    throw new Error('No URLs found in sitemap.xml.');
  }
  return new URL(first).origin;
}

function groupUrls(urls, reactSlugs) {
  const groups = new Map();
  SECTION_RULES.forEach((rule) => groups.set(rule.name, []));
  groups.set('main', []);

  urls.forEach((url) => {
    if (isExcludedUrl(url, reactSlugs)) return;
    const normalized = ensureTrailingSlash(url);
    const pathname = new URL(url).pathname;
    const rule = SECTION_RULES.find((item) => pathname.startsWith(item.prefix));
    if (rule) {
      groups.get(rule.name).push(normalized);
    } else {
      groups.get('main').push(normalized);
    }
  });

  return groups;
}

function buildUrlset(urls) {
  const entries = urls
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${entries}\n` +
    '</urlset>\n'
  );
}

function buildSitemapIndex(origin, sitemapNames, lastmod) {
  const entries = sitemapNames
    .map((name) => {
      const loc = `${origin}/sitemap-${name}.xml`;
      return `  <sitemap><loc>${loc}</loc><lastmod>${lastmod}</lastmod></sitemap>`;
    })
    .join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${entries}\n` +
    '</sitemapindex>\n'
  );
}

function buildRobotsTxt(origin) {
  return (
    'User-agent: *\n' +
    'Allow: /\n' +
    'Disallow: /admin/\n' +
    // Localized copies of the admin SPA (e.g. /ru/admin/) exist too.
    'Disallow: /*/admin/\n' +
    `Sitemap: ${origin}/sitemap-index.xml\n` +
    `Sitemap: ${origin}/sitemap.xml\n`
  );
}

function writeSitemaps(groups, origin) {
  const sitemapNames = [];

  for (const [name, urls] of groups.entries()) {
    if (urls.length === 0) {
      continue;
    }
    const filename = `sitemap-${name}.xml`;
    const target = path.join(BUILD_DIR, filename);
    fs.writeFileSync(target, buildUrlset(urls));
    sitemapNames.push(name);
  }

  const indexPath = path.join(BUILD_DIR, 'sitemap-index.xml');
  const lastmod = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(indexPath, buildSitemapIndex(origin, sitemapNames, lastmod));
}

function assertSitemapIntegrity(urls) {
  const errors = [];
  for (const url of urls) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      errors.push(`invalid URL: ${url}`);
      continue;
    }
    if (parsed.protocol !== 'https:') errors.push(`non-https URL in sitemap: ${url}`);
    if (parsed.host !== 'cadautoscript.com') errors.push(`non-canonical host in sitemap: ${url}`);
    const isFile = (parsed.pathname.split('/').pop() || '').includes('.');
    if (!isFile && parsed.pathname !== '/' && !parsed.pathname.endsWith('/')) {
      errors.push(`missing trailing slash in sitemap: ${url}`);
    }
  }
  if (errors.length) {
    console.error('Sitemap integrity check FAILED:');
    errors.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }
}

function main() {
  const reactSlugs = getReactUtilitySlugs();
  const xml = readSourceSitemap();
  const normalizedXml = normalizeSitemapXml(xml, reactSlugs);
  fs.writeFileSync(SOURCE_SITEMAP, normalizedXml);
  const urls = extractUrls(normalizedXml);
  assertSitemapIntegrity(urls);
  const origin = getOrigin(urls);
  const groups = groupUrls(urls, reactSlugs);
  writeSitemaps(groups, origin);
  fs.writeFileSync(path.join(BUILD_DIR, 'robots.txt'), buildRobotsTxt(origin));
  console.log(`Section sitemaps generated in build/. (${urls.length} canonical URLs)`);
}

main();
