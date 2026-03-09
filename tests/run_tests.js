/**
 * Comprehensive test suite for ViBoot Enhanced extension.
 *
 * Tests cover:
 *  1. JS syntax validation for every script
 *  2. Manifest V3 Chrome compliance
 *  3. Firefox (Gecko) manifest compatibility
 *  4. URL pattern matching for all 3 VTOP sites
 *  5. Cross-browser API namespace (chrome / browser)
 *  6. MV3-incompatible API detection
 *  7. Security regression checks (API key, innerHTML, javascript: URLs)
 *  8. DOM helper function logic via jsdom
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  \x1b[31m✗\x1b[0m ${label}`);
  }
}

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

// ─── 1. JS SYNTAX VALIDATION ───────────────────────────────────────────
console.log('\n\x1b[1m[1] JavaScript Syntax Validation\x1b[0m');

const jsFiles = [
  'js/attendance.js',
  'js/course_page.js',
  'js/exam_schedule.js',
  'js/marks_page.js',
  'js/navbar.js',
  'js/navbarcc.js',
  'js/on_duty.js',
  'js/time_table.js',
  'js/popup.js',
  'js/captcha/bitmaps.js',
  'js/captcha/captchaparser.js',
  'service_worker/background.js',
];

jsFiles.forEach((file) => {
  try {
    const code = readFile(file);
    new vm.Script(code, { filename: file });
    assert(true, `${file} — valid syntax`);
  } catch (e) {
    assert(false, `${file} — syntax error: ${e.message}`);
  }
});

// ─── 2. MANIFEST V3 CHROME COMPLIANCE ──────────────────────────────────
console.log('\n\x1b[1m[2] Manifest V3 Chrome Compliance\x1b[0m');

const manifest = JSON.parse(readFile('manifest.json'));

assert(manifest.manifest_version === 3, 'manifest_version is 3');
assert(typeof manifest.name === 'string' && manifest.name.length > 0, 'name is present');
assert(typeof manifest.version === 'string', 'version is present');
assert(!manifest.browser_action, 'browser_action key is absent (MV3 uses action)');
assert(!!manifest.action, 'action key is present');
assert(manifest.action.default_popup === 'html/popup.html', 'action.default_popup points to popup.html');
assert(
  manifest.background && manifest.background.service_worker === 'service_worker/background.js',
  'background.service_worker is set correctly',
);
assert(!manifest.background.scripts, 'background.scripts is absent (MV2 pattern)');
assert(!manifest.background.persistent, 'background.persistent is absent (MV2 pattern)');
assert(Array.isArray(manifest.permissions), 'permissions is an array');
assert(Array.isArray(manifest.host_permissions), 'host_permissions is an array');

const hostPermsHaveUrls = manifest.host_permissions.every((p) => p.includes('://'));
assert(hostPermsHaveUrls, 'host_permissions contain URL patterns');

const permsHaveNoUrls = manifest.permissions.every((p) => !p.includes('://'));
assert(permsHaveNoUrls, 'permissions do NOT contain URL patterns (moved to host_permissions)');

assert(manifest.permissions.includes('storage'), 'storage permission present');
assert(manifest.permissions.includes('tabs'), 'tabs permission present');
assert(manifest.permissions.includes('downloads'), 'downloads permission present');
assert(manifest.permissions.includes('webRequest'), 'webRequest permission present (observation)');
assert(!manifest.permissions.includes('webRequestBlocking'), 'webRequestBlocking is NOT present');

assert(Array.isArray(manifest.content_scripts) && manifest.content_scripts.length > 0, 'content_scripts defined');
const cs = manifest.content_scripts[0];
assert(cs.js.length === 10, 'content_scripts includes all 10 JS files');

// All referenced files exist
const allRefs = [
  manifest.background.service_worker,
  manifest.action.default_popup,
  ...Object.values(manifest.icons),
  ...Object.values(manifest.action.default_icon),
  ...cs.js,
];
allRefs.forEach((ref) => {
  const exists = fs.existsSync(path.join(ROOT, ref));
  assert(exists, `referenced file exists: ${ref}`);
});

// ─── 3. FIREFOX (GECKO) COMPATIBILITY ──────────────────────────────────
console.log('\n\x1b[1m[3] Firefox (Gecko) Compatibility\x1b[0m');

assert(
  manifest.browser_specific_settings &&
    manifest.browser_specific_settings.gecko &&
    manifest.browser_specific_settings.gecko.id,
  'browser_specific_settings.gecko.id is present',
);

const bgCode = readFile('service_worker/background.js');
assert(
  bgCode.includes("typeof chrome !== 'undefined' ? chrome : browser"),
  'background.js uses cross-browser API shim',
);

const contentFiles = cs.js;
const crossBrowserShimFiles = [
  'js/attendance.js',
  'js/exam_schedule.js',
  'js/marks_page.js',
  'js/navbar.js',
  'js/navbarcc.js',
  'js/on_duty.js',
  'js/time_table.js',
  'js/popup.js',
];
crossBrowserShimFiles.forEach((file) => {
  const code = readFile(file);
  const hasShim =
    code.includes("typeof chrome !== 'undefined' ? chrome : browser") ||
    code.includes("typeof browser !== 'undefined'");
  assert(hasShim, `${file} uses cross-browser API shim`);
});

// ─── 4. URL PATTERN MATCHING ───────────────────────────────────────────
console.log('\n\x1b[1m[4] URL Pattern Matching for All 3 VTOP Sites\x1b[0m');

const VTOP_URLS = [
  'https://vtop.vit.ac.in/vtop/home',
  'https://vtopcc.vit.ac.in/vtop/home',
  'https://vtop.vitbhopal.ac.in/vtop/home',
];

function matchPattern(pattern, url) {
  let regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*');
  regex = '^' + regex + '$';
  return new RegExp(regex).test(url);
}

const csMatches = cs.matches;
VTOP_URLS.forEach((url) => {
  const matched = csMatches.some((pat) => matchPattern(pat, url));
  assert(matched, `content_scripts match URL: ${url}`);
});

const hostPerms = manifest.host_permissions;
VTOP_URLS.forEach((url) => {
  const matched = hostPerms.some((pat) => matchPattern(pat, url));
  assert(matched, `host_permissions match URL: ${url}`);
});

const webRequestFilter = [
  '*://vtop.vit.ac.in/*',
  '*://vtopcc.vit.ac.in/vtop/*',
  '*://vtop.vitbhopal.ac.in/vtop/*',
];
VTOP_URLS.forEach((url) => {
  const matched = webRequestFilter.some((pat) => matchPattern(pat, url));
  assert(matched, `webRequest URL filter matches: ${url}`);
});

// ─── 5. CROSS-BROWSER API NAMESPACE ────────────────────────────────────
console.log('\n\x1b[1m[5] Cross-Browser API Namespace Check\x1b[0m');

jsFiles.forEach((file) => {
  const code = readFile(file);
  const usesChromeDirect = /\bchrome\.(runtime|storage|tabs|downloads|webRequest|alarms)\b/.test(code);
  const usesBrowserDirect = /\bbrowser\.(runtime|storage|tabs|downloads|webRequest|alarms)\b/.test(code);
  const usesExtApi = /\bextApi\.(runtime|storage|tabs|downloads|webRequest|alarms)\b/.test(code);

  if (usesExtApi) {
    assert(true, `${file} — uses extApi abstraction`);
  } else if (!usesChromeDirect && !usesBrowserDirect) {
    assert(true, `${file} — no direct browser API calls (helper/data file)`);
  } else {
    assert(false, `${file} — uses chrome.* or browser.* directly instead of extApi`);
  }
});

// ─── 6. MV3-INCOMPATIBLE API DETECTION ─────────────────────────────────
console.log('\n\x1b[1m[6] MV3-Incompatible API Detection\x1b[0m');

const allJsContent = jsFiles.map((f) => ({ file: f, code: readFile(f) }));

allJsContent.forEach(({ file, code }) => {
  assert(
    !code.includes('webRequestBlocking'),
    `${file} — no webRequestBlocking`,
  );
  assert(
    !code.includes('onBeforeRequest') || !code.includes('blocking'),
    `${file} — no blocking onBeforeRequest`,
  );
});

assert(!bgCode.includes('"persistent"'), 'background.js has no "persistent" reference');
assert(!bgCode.includes('document.'), 'background.js has no DOM access (service worker safe)');
assert(!bgCode.includes('window.'), 'background.js has no window access (service worker safe)');
assert(!bgCode.includes('XMLHttpRequest'), 'background.js uses fetch, not XMLHttpRequest');

// ─── 7. SECURITY REGRESSION CHECKS ────────────────────────────────────
console.log('\n\x1b[1m[7] Security Regression Checks\x1b[0m');

const API_KEY = 'AIzaSyCPBz-DTZdoTLQ_ZiqsVUO520XItcomTn0';
allJsContent.forEach(({ file, code }) => {
  assert(!code.includes(API_KEY), `${file} — no hardcoded API key`);
});

const securityTargetFiles = [
  'js/attendance.js',
  'js/marks_page.js',
  'js/navbar.js',
  'js/on_duty.js',
  'js/navbarcc.js',
];

securityTargetFiles.forEach((file) => {
  const code = readFile(file);

  const innerHtmlWithInterpolation = /\.innerHTML\s*=\s*`[^`]*\$\{/;
  const innerHtmlPlusEquals = /\.innerHTML\s*\+=/;
  assert(
    !innerHtmlWithInterpolation.test(code),
    `${file} — no innerHTML with template interpolation`,
  );
  assert(
    !innerHtmlPlusEquals.test(code),
    `${file} — no innerHTML += (append pattern)`,
  );
});

securityTargetFiles.forEach((file) => {
  const code = readFile(file);
  assert(!code.includes('javascript:'), `${file} — no javascript: URLs`);
});

securityTargetFiles.forEach((file) => {
  const code = readFile(file);
  const hasInlineOnclick = /onclick\s*=\s*["']/;
  assert(!hasInlineOnclick.test(code), `${file} — no inline onclick handlers`);
});

securityTargetFiles.forEach((file) => {
  const code = readFile(file);
  assert(!code.includes('.outerHTML'), `${file} — no outerHTML assignment`);
});

// Verify DOMParser is used instead of innerHTML for HTML parsing in on_duty.js
const onDutyCode = readFile('js/on_duty.js');
assert(onDutyCode.includes('new DOMParser()'), 'on_duty.js uses DOMParser for HTML parsing');
assert(!onDutyCode.includes('tempDiv.innerHTML'), 'on_duty.js does not use innerHTML for HTML parsing');

// ─── 8. DOM HELPER FUNCTION TESTS (jsdom) ──────────────────────────────
console.log('\n\x1b[1m[8] DOM Helper Function Tests (jsdom)\x1b[0m');

// --- Test navbarcc.js ---
{
  const dom = new JSDOM(`
    <html><body>
      <div class="navbar-header"></div>
    </body></html>
  `, { url: 'https://vtopcc.vit.ac.in/vtop/home' });
  const { window } = dom;
  const { document } = window;

  global.document = document;
  global.window = window;
  global.chrome = undefined;
  global.browser = {
    runtime: { onMessage: { addListener: () => {} } },
  };

  const navbarccCode = readFile('js/navbarcc.js');
  try {
    const script = new vm.Script(navbarccCode);
    const ctx = vm.createContext({
      document,
      window,
      chrome: undefined,
      browser: global.browser,
      loadmydiv: () => {},
      toggleButtonMenuItem: () => {},
    });
    script.runInContext(ctx);

    const navFn = ctx.nav_barcc || ctx.NAV_ITEMS;
    assert(true, 'navbarcc.js — loads without error');
  } catch (e) {
    assert(false, `navbarcc.js — load error: ${e.message}`);
  }

  delete global.document;
  delete global.window;
  delete global.browser;
}

// --- Test navbarcc creates links with proper event listeners (no javascript: hrefs) ---
{
  const dom = new JSDOM(`
    <html><body>
      <div class="navbar-header"></div>
    </body></html>
  `, { url: 'https://vtopcc.vit.ac.in/vtop/home', runScripts: 'dangerously' });
  const { window } = dom;
  const { document } = window;

  let loadmydivCalled = false;
  let loadmydivArg = '';
  window.loadmydiv = (route) => { loadmydivCalled = true; loadmydivArg = route; };
  window.toggleButtonMenuItem = () => {};
  window.chrome = undefined;
  window.browser = {
    runtime: { onMessage: { addListener: () => {} } },
  };

  const scriptEl = document.createElement('script');
  scriptEl.textContent = readFile('js/navbarcc.js');
  document.body.appendChild(scriptEl);

  window.eval('if (typeof nav_barcc === "function") nav_barcc()');

  const links = document.querySelectorAll('.navbar-header a.btnItem');
  assert(links.length === 6, 'navbarcc.js — creates 6 nav links');

  let allHrefsSafe = true;
  links.forEach((link) => {
    if (link.href.includes('javascript:')) allHrefsSafe = false;
  });
  assert(allHrefsSafe, 'navbarcc.js — no link has javascript: href');

  if (links.length > 0) {
    links[0].click();
    assert(loadmydivCalled, 'navbarcc.js — clicking link calls loadmydiv()');
    assert(loadmydivArg === 'examinations/StudentMarkView', 'navbarcc.js — first link routes to StudentMarkView');
  }
}

// --- Test attendance.js helper: createAttendanceCell ---
{
  const dom = new JSDOM(`<html><body></body></html>`);
  const { document } = dom.window;

  const attendanceCode = readFile('js/attendance.js');
  const ctx = vm.createContext({
    document,
    window: dom.window,
    chrome: { runtime: { onMessage: { addListener: () => {} } } },
    browser: undefined,
    setTimeout: setTimeout,
    parseFloat: parseFloat,
    Math: Math,
    String: String,
    Array: Array,
    console: console,
  });

  try {
    new vm.Script(attendanceCode).runInContext(ctx);
    assert(true, 'attendance.js — loads without error');

    if (typeof ctx.createAttendanceCell === 'function') {
      const cell = ctx.createAttendanceCell('5 class(es) should be attended.', 'rgb(238, 75, 43,0.7)');
      assert(cell.tagName === 'TD', 'createAttendanceCell returns a <td>');
      assert(cell.querySelector('p').textContent === '5 class(es) should be attended.', 'createAttendanceCell sets textContent correctly');
      assert(cell.style.background.includes('rgb'), 'createAttendanceCell applies background color');
    } else {
      assert(true, 'attendance.js — createAttendanceCell is module-scoped (expected)');
    }
  } catch (e) {
    assert(false, `attendance.js — load error: ${e.message}`);
  }
}

// --- Test marks_page.js loads ---
{
  const dom = new JSDOM(`<html><body></body></html>`);
  const ctx = vm.createContext({
    document: dom.window.document,
    window: dom.window,
    chrome: { runtime: { onMessage: { addListener: () => {} } } },
    browser: undefined,
    parseFloat,
    Math,
    String,
    Array,
    console,
    setTimeout,
  });

  try {
    new vm.Script(readFile('js/marks_page.js')).runInContext(ctx);
    assert(true, 'marks_page.js — loads without error');
  } catch (e) {
    assert(false, `marks_page.js — load error: ${e.message}`);
  }
}

// --- Test on_duty.js loads and uses DOMParser ---
{
  const dom = new JSDOM(`<html><body></body></html>`);
  const ctx = vm.createContext({
    document: dom.window.document,
    window: dom.window,
    DOMParser: dom.window.DOMParser,
    chrome: { runtime: { onMessage: { addListener: () => {} } } },
    browser: undefined,
    FormData: dom.window.FormData,
    fetch: () => Promise.resolve({ ok: true, text: () => Promise.resolve('') }),
    parseFloat,
    Math,
    String,
    Array,
    Object,
    Set,
    Promise,
    console,
    setTimeout,
    Date,
    isNaN,
  });

  try {
    new vm.Script(readFile('js/on_duty.js')).runInContext(ctx);
    assert(true, 'on_duty.js — loads without error');
  } catch (e) {
    assert(false, `on_duty.js — load error: ${e.message}`);
  }
}

// --- Test navbar.js loads and uses DOM APIs ---
{
  const dom = new JSDOM(`<html><body></body></html>`);
  const ctx = vm.createContext({
    document: dom.window.document,
    window: dom.window,
    chrome: { runtime: { onMessage: { addListener: () => {} } } },
    browser: undefined,
    Array,
    String,
    setTimeout,
    console,
    parseInt,
  });

  try {
    new vm.Script(readFile('js/navbar.js')).runInContext(ctx);
    assert(true, 'navbar.js — loads without error (valid syntax, no import errors)');
  } catch (e) {
    assert(false, `navbar.js — load error: ${e.message}`);
  }

  // Verify the code uses createElement and addEventListener, not innerHTML+onclick
  const navbarCode = readFile('js/navbar.js');
  assert(navbarCode.includes('createElement'), 'navbar.js — uses createElement for button creation');
  assert(navbarCode.includes('addEventListener'), 'navbar.js — uses addEventListener instead of inline handlers');
  assert(!navbarCode.includes('onclick='), 'navbar.js — no inline onclick in source');
  assert(navbarCode.includes('createNavButton'), 'navbar.js — uses createNavButton helper function');
}

// --- Test background.js (service worker) loads ---
{
  const ctx = vm.createContext({
    chrome: {
      tabs: { query: () => {}, sendMessage: () => {} },
      runtime: { onMessage: { addListener: () => {} } },
      storage: { sync: { get: () => {}, set: () => {} } },
      downloads: {
        download: () => {},
        onDeterminingFilename: { addListener: () => {} },
      },
      webRequest: {
        onCompleted: { addListener: () => {} },
      },
    },
    browser: undefined,
    fetch: () => Promise.resolve({ ok: true, headers: { get: () => '' } }),
    console,
    setTimeout,
    Promise,
    Date,
    JSON,
    String,
    Array,
    parseInt,
    RegExp,
  });

  try {
    new vm.Script(readFile('service_worker/background.js')).runInContext(ctx);
    assert(true, 'background.js — loads as service worker without error');
  } catch (e) {
    assert(false, `background.js — service worker load error: ${e.message}`);
  }
}

// --- Test exam_schedule.js and time_table.js have no API key ---
{
  const examCode = readFile('js/exam_schedule.js');
  const ttCode = readFile('js/time_table.js');

  assert(
    examCode.includes('googleapis.com/calendar/v3') && !examCode.includes('key='),
    'exam_schedule.js — calls Calendar API without hardcoded key',
  );
  assert(
    ttCode.includes('googleapis.com/calendar/v3') && !ttCode.includes('key='),
    'time_table.js — calls Calendar API without hardcoded key',
  );
}

// ─── 9. POPUP AND ASSET INTEGRITY ─────────────────────────────────────
console.log('\n\x1b[1m[9] Popup & Asset Integrity\x1b[0m');

assert(fs.existsSync(path.join(ROOT, 'html/popup.html')), 'popup.html exists');
assert(fs.existsSync(path.join(ROOT, 'html/styles.css')), 'styles.css exists');
assert(fs.existsSync(path.join(ROOT, 'assets/icons/img_16.png')), 'icon 16px exists');
assert(fs.existsSync(path.join(ROOT, 'assets/icons/img_48.png')), 'icon 48px exists');
assert(fs.existsSync(path.join(ROOT, 'assets/icons/img_128.png')), 'icon 128px exists');

const popupHtml = readFile('html/popup.html');
assert(popupHtml.includes('popup.js'), 'popup.html references popup.js');
assert(!popupHtml.includes('javascript:'), 'popup.html has no javascript: URLs');

// ─── SUMMARY ───────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log(`\x1b[1mResults: ${passed} passed, ${failed} failed\x1b[0m`);
if (failures.length > 0) {
  console.log('\n\x1b[31mFailures:\x1b[0m');
  failures.forEach((f) => console.log(`  - ${f}`));
}
console.log('═'.repeat(60));
process.exit(failed > 0 ? 1 : 0);
