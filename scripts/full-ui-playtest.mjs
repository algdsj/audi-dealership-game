import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.UI_SMOKE_URL || 'http://127.0.0.1:6188/';
const CDP_URL = process.env.CDP_URL || 'http://127.0.0.1:9223';
const ARTIFACT_DIR = path.resolve('docs/test-artifacts/full-test-2026-05-16');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getPageTarget() {
  const response = await fetch(`${CDP_URL}/json`);
  assert.equal(response.ok, true, `CDP target list failed: ${response.status}`);
  const targets = await response.json();
  const page = targets.find(target => target.type === 'page') || targets[0];
  assert.ok(page?.webSocketDebuggerUrl, 'No CDP page target available');
  return page;
}

function createCdpClient(wsUrl) {
  const socket = new WebSocket(wsUrl);
  const pending = new Map();
  const events = [];
  let id = 0;

  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (message.method) events.push(message);
  });

  const opened = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  return {
    events,
    async send(method, params = {}) {
      await opened;
      const messageId = ++id;
      socket.send(JSON.stringify({ id: messageId, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(messageId, { resolve, reject });
        setTimeout(() => {
          if (pending.has(messageId)) {
            pending.delete(messageId);
            reject(new Error(`CDP timeout: ${method}`));
          }
        }, 8000);
      });
    },
    close() {
      socket.close();
    },
  };
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  }
  return result.result?.value;
}

async function waitFor(client, expression, description, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const passed = await evaluate(client, expression);
    if (passed) return passed;
    await sleep(150);
  }
  const body = await evaluate(client, `document.body.innerText.replace(/\\s+/g, ' ').trim().slice(0, 1200)`);
  console.error(`debug body for ${description}: ${body}`);
  throw new Error(`Timed out waiting for ${description}`);
}

async function clickText(client, label, options = {}) {
  const selector = options.selector || 'button, [role="button"], a';
  const exact = options.exact ?? false;
  const expression = `(() => {
    const label = ${JSON.stringify(label)};
    const selector = ${JSON.stringify(selector)};
    const exact = ${JSON.stringify(exact)};
    const elements = [...document.querySelectorAll(selector)];
    const target = elements.find(el => {
      const text = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
      const visible = !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      const enabled = !el.disabled && el.getAttribute('aria-disabled') !== 'true';
      return visible && enabled && (exact ? text === label : text.includes(label));
    });
    if (!target) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  })()`;
  assert.equal(await evaluate(client, expression), true, `Clickable text not found: ${label}`);
  await sleep(options.delay || 300);
}

async function closeTransientModals(client) {
  for (const label of ['我知道了', '关闭']) {
    const clicked = await evaluate(client, `(() => {
      const label = ${JSON.stringify(label)};
      const target = [...document.querySelectorAll('button')].find(el => {
        const text = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
        return !el.disabled && text === label && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      });
      if (!target) return false;
      target.click();
      return true;
    })()`);
    if (clicked) await sleep(250);
  }
}

async function screenshot(client, name) {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const result = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  const file = path.join(ARTIFACT_DIR, `${name}.png`);
  await writeFile(file, Buffer.from(result.data, 'base64'));
  return file;
}

async function visibleText(client) {
  return evaluate(client, `document.body.innerText.replace(/\\s+/g, ' ').trim().slice(0, 5000)`);
}

const target = await getPageTarget();
const client = createCdpClient(target.webSocketDebuggerUrl);
const findings = [];
const screenshots = [];

try {
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Log.enable');
  await client.send('Network.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await client.send('Page.navigate', { url: BASE_URL });
  await waitFor(client, 'document.readyState === "complete"', 'page load');
  await evaluate(client, 'localStorage.clear(); sessionStorage.clear(); location.reload(); true');
  await waitFor(client, 'document.body.innerText.includes("开始接任")', 'setup screen');
  client.events.length = 0;
  screenshots.push(await screenshot(client, '01-setup'));

  await clickText(client, '开始接任');
  await waitFor(client, 'document.body.innerText.includes("经营看板") && document.body.innerText.includes("进入下一天")', 'dashboard');
  await closeTransientModals(client);
  screenshots.push(await screenshot(client, '02-dashboard'));

  const tabs = [
    ['首页', '经营看板', false],
    ['门店总览', '门店', true],
    ['事件中心', '事件', true],
    ['销售运营', '展厅定价', false],
    ['厂家订货', '订货', true],
    ['漏斗营销', '营销活动中心', true],
    ['月底冲刺', '冲刺', true],
    ['机会池', '机会池', true],
    ['客户谈判', '客户', true],
    ['客户中心', '客户', true],
    ['利润中心', '总经理办公室', false],
    ['财务', '财务', true],
    ['返利', '返利', true],
    ['汇票', '汇票', true],
    ['组织人事', '人事', false],
    ['设施升级', '设施', true],
    ['市场诊断', '本地市场', false],
    ['CSI满意度', 'CSI', true],
    ['衍生中心', '二手车', false],
    ['售后服务', '售后', true],
    ['金融衍生', '衍生', true],
  ];

  for (const [label, marker, exact] of tabs) {
    await clickText(client, label, { exact });
    await waitFor(client, `document.body.innerText.includes(${JSON.stringify(marker)})`, `${label} marker`);
    await closeTransientModals(client);
  }
  screenshots.push(await screenshot(client, '03-after-tab-sweep'));

  await clickText(client, '销售运营');
  await clickText(client, '厂家订货');
  await clickText(client, '配置并采购车辆');
  await waitFor(client, 'document.body.innerText.includes("确认下单")', 'order modal');
  await clickText(client, '确认下单', { exact: true });
  await closeTransientModals(client);
  await waitFor(client, 'document.body.innerText.includes("在途") || document.body.innerText.includes("待到货") || document.body.innerText.includes("订单")', 'order state');
  screenshots.push(await screenshot(client, '04-order-created'));

  await clickText(client, '存档');
  await waitFor(client, 'document.body.innerText.includes("选择存档槽位")', 'save modal');
  await clickText(client, '保存', { exact: true });
  await closeTransientModals(client);
  await waitFor(client, 'document.body.innerText.includes("经营看板") || document.body.innerText.includes("厂家订货")', 'save closed');

  await clickText(client, '读档');
  await waitFor(client, 'document.body.innerText.includes("选择存档读取")', 'load modal');
  screenshots.push(await screenshot(client, '05-load-modal'));
  await clickText(client, '关闭', { exact: true });

  for (let i = 0; i < 31; i += 1) {
    await closeTransientModals(client);
    const canAdvance = await evaluate(client, `(() => {
      const button = [...document.querySelectorAll('button')].find(el => (el.innerText || '').includes('进入下一天'));
      return !!button && !button.disabled;
    })()`);
    if (!canAdvance) break;
    await clickText(client, '进入下一天');
    await sleep(500);
    await closeTransientModals(client);
    const reachedMonthTwo = await evaluate(client, 'document.body.innerText.includes("M2")');
    if (reachedMonthTwo) break;
  }
  await waitFor(client, 'document.body.innerText.includes("M2") || document.body.innerText.includes("月结完成")', 'month-end or M2', 20000);
  screenshots.push(await screenshot(client, '06-month-end'));

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(500);
  screenshots.push(await screenshot(client, '07-mobile-dashboard'));

  const bodyText = await visibleText(client);
  assert.ok(bodyText.includes('经营日历') || bodyText.includes('经营看板'), 'Final page lost core game shell');

  const errors = client.events.filter(event => {
    if (event.method === 'Runtime.exceptionThrown') return true;
    if (event.method === 'Log.entryAdded') {
      const level = event.params?.entry?.level;
      const text = event.params?.entry?.text || '';
      return ['error', 'warning'].includes(level) && !/favicon|manifest/i.test(text);
    }
    if (event.method === 'Network.loadingFailed') {
      return !String(event.params?.errorText || '').includes('net::ERR_ABORTED');
    }
    return false;
  });
  assert.deepEqual(errors.map(event => event.method), [], `Browser errors found: ${JSON.stringify(errors.slice(0, 5))}`);
} catch (error) {
  findings.push(error.message);
  const relevantEvents = client.events.filter(event => [
    'Runtime.exceptionThrown',
    'Runtime.consoleAPICalled',
    'Log.entryAdded',
    'Network.loadingFailed',
  ].includes(event.method));
  console.error(JSON.stringify(relevantEvents.slice(-10), null, 2));
  throw error;
} finally {
  const report = {
    baseUrl: BASE_URL,
    cdpUrl: CDP_URL,
    screenshots,
    findings,
    events: client.events.filter(event => [
      'Runtime.exceptionThrown',
      'Runtime.consoleAPICalled',
      'Log.entryAdded',
      'Network.loadingFailed',
    ].includes(event.method)).slice(-25),
  };
  await writeFile(path.join(ARTIFACT_DIR, 'full-ui-playtest-result.json'), JSON.stringify(report, null, 2));
  client.close();
}

console.log(`ok - full UI playtest passed; screenshots: ${screenshots.length}`);
