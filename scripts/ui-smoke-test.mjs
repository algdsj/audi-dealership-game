import assert from 'node:assert/strict';
import { stat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT_URL = process.env.UI_SMOKE_URL || 'http://localhost:6188/';
const DIST_DIR = path.resolve('dist');
const MAX_ENTRY_CHUNK_BYTES = 500 * 1024;

const keyLazyChunkNames = [
  'StoreBlueprintTab',
  'InboxModal',
  'SaveLoadModals',
  'OrderConfigModal',
  'FinancialReportsTab',
  'StaffManagementTab',
  'OperatingEventsTab',
  'CustomerCenterTab',
  'SalesOpportunityTab',
  'MarketTab',
];

const fetchText = async (url) => {
  const response = await fetch(url);
  assert.equal(response.ok, true, `${url} responded ${response.status}`);
  return response.text();
};

const fetchHead = async (url) => {
  const response = await fetch(url, { method: 'HEAD' });
  assert.equal(response.ok, true, `${url} HEAD responded ${response.status}`);
  return response;
};

const absolutize = (assetPath) => new URL(assetPath, ROOT_URL).toString();

const extractAssetPaths = (html) => {
  const paths = new Set();
  for (const match of html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)="([^"]+)"/g)) {
    const assetPath = match[1];
    if (assetPath.startsWith('http') || assetPath.startsWith('data:')) continue;
    paths.add(assetPath);
  }
  return [...paths];
};

const getDistFiles = async () => {
  const assetsDir = path.join(DIST_DIR, 'assets');
  const files = await readdir(assetsDir);
  return files.map(file => path.join(assetsDir, file));
};

const findEntryChunk = async () => {
  const files = await getDistFiles();
  const jsFiles = files.filter(file => path.basename(file).startsWith('index-') && file.endsWith('.js'));
  assert.ok(jsFiles.length >= 1, 'dist entry chunk is missing');
  const stats = await Promise.all(jsFiles.map(async file => ({ file, size: (await stat(file)).size })));
  return stats.sort((a, b) => b.size - a.size)[0];
};

async function testServedPage() {
  const html = await fetchText(ROOT_URL);
  assert.match(html, /<div id="root"><\/div>/, 'root mount node missing');
  assert.match(html, /奥迪4S店经营模拟|Audi|script/i, 'page identity marker missing');

  const assetPaths = extractAssetPaths(html);
  assert.ok(assetPaths.length >= 1, 'served page does not reference app assets');

  await Promise.all(assetPaths.map(async assetPath => {
    const response = await fetchHead(absolutize(assetPath));
    const contentType = response.headers.get('content-type') || '';
    assert.ok(
      contentType.includes('javascript')
        || contentType.includes('css')
        || contentType.includes('image')
        || contentType.includes('svg')
        || contentType.includes('html'),
      `${assetPath} has unexpected content-type: ${contentType}`,
    );
  }));
}

async function testBuiltBundleShape() {
  const indexHtml = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8');
  const distFiles = await getDistFiles();
  const distBasenames = distFiles.map(file => path.basename(file));
  const entryChunk = await findEntryChunk();

  assert.match(indexHtml, /type="module"/, 'dist index does not load a module script');
  assert.ok(
    entryChunk.size < MAX_ENTRY_CHUNK_BYTES,
    `entry chunk ${path.basename(entryChunk.file)} is ${(entryChunk.size / 1024).toFixed(1)}KB, expected < 500KB`,
  );

  for (const chunkName of keyLazyChunkNames) {
    assert.ok(
      distBasenames.some(file => file.startsWith(`${chunkName}-`) && file.endsWith('.js')),
      `lazy chunk missing: ${chunkName}`,
    );
  }
}

await testServedPage();
await testBuiltBundleShape();

console.log(`ok - UI smoke passed for ${ROOT_URL}`);
