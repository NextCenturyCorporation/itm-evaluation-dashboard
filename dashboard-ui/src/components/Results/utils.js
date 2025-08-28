export const multiSort = (a, b) => {
  const aMatch = a.match(/^([a-zA-Z]+)(\d+)$/);
  const bMatch = b.match(/^([a-zA-Z]+)(\d+)$/);

  if (aMatch && bMatch && aMatch[1] === bMatch[1]) {
    return parseInt(aMatch[2], 10) - parseInt(bMatch[2], 10);
  }
  return a.localeCompare(b);
};

export const isObject = (item) =>
  typeof item === 'object' && !Array.isArray(item) && item !== null;

export const isExpandable = (v) => v && typeof v === 'object';

export const snakeCaseToNormalCase = (string) =>
  String(string).replace(/_/g, ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

export const formatPathTitle = (pathArr) =>
  pathArr.map((tok) => (tok.startsWith('[') ? tok : snakeCaseToNormalCase(tok))).join(' > ');

export const formatLeaf = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
};

export const pathKey = (arr) => arr.join('.');

export const deepIsEmpty = (v) => {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') {
    const t = v.trim();
    return t === '' || t === '—' || t === '-' || t.toLowerCase() === 'n/a';
  }
  if (typeof v === 'number') return Number.isNaN(v);
  if (Array.isArray(v)) return v.every(deepIsEmpty);
  if (isObject(v)) {
    const entries = Object.entries(v);
    if (entries.length === 0) return true;
    return entries.every(([, val]) => deepIsEmpty(val));
  }
  return false;
};

export const isEmpty = deepIsEmpty;

export const getNodeAtPath = (root, pathArr = []) => {
  if (!root || typeof root !== 'object') return root;
  let cur = root;
  for (const tok of pathArr) {
    if (cur == null) break;
    if (/^\[\d+\]$/.test(tok)) {
      const idx = parseInt(tok.slice(1, -1), 10);
      if (!Array.isArray(cur) || idx >= cur.length) return undefined;
      cur = cur[idx];
    } else {
      if (typeof cur !== 'object') return undefined;
      cur = cur[tok];
    }
  }
  return cur;
};

export const collectExpandablePaths = (node, path = [], acc = new Set()) => {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) {
    node.forEach((el, idx) => {
      if (el && typeof el === 'object') {
        const p = pathKey([...path, `[${idx}]`]);
        acc.add(p);
        collectExpandablePaths(el, [...path, `[${idx}]`], acc);
      }
    });
  } else {
    Object.entries(node).forEach(([k, v]) => {
      if (v && typeof v === 'object') {
        const p = pathKey([...path, k]);
        acc.add(p);
        collectExpandablePaths(v, [...path, k], acc);
      }
    });
  }
  return acc;
};

export const formatADMString = (peformerADMString) => {
  if (peformerADMString.indexOf('ALIGN-ADM') > -1) return `Kitware: ${peformerADMString}`;
  if (peformerADMString.indexOf('TAD') > -1) return `Parallax: ${peformerADMString}`;
  return peformerADMString;
};

export const formatScenarioString = (evalNumber, id) => {
  const lower = String(id).toLowerCase();
  if (evalNumber < 3) {
    return lower.indexOf('adept') > -1 ? `BBN: ${id}` : `Soartech: ${id}`;
  } else if (evalNumber === 3) {
    return lower.indexOf('metricseval') > -1 ? `ADEPT: ${id}` : `Soartech: ${id}`;
  } else {
    return lower.includes('qol') || lower.includes('vol') ? `Soartech: ${id}` : `Adept: ${id}`;
  }
};

export const computeAttribute = (evalNumber, scenarioId = '', targetStr = '') => {
  const s = String(scenarioId || '').toLowerCase();
  const t = String(targetStr || '').toLowerCase();

  if (evalNumber >= 8) {
    if (s.includes('mf') && s.includes('af')) return 'AF-MF';
    if (s.includes('mf')) return 'MF';
    if (s.includes('af')) return 'AF';
    if (s.includes('ss')) return 'SS';
    return 'PS';
  }
  if (s.includes('qol')) return 'QOL';
  if (s.includes('vol')) return 'VOL';
  if (t.includes('moral')) return 'MJ';
  return 'IO';
};

export const deriveProbeLabel = (params, { alignmentTarget, evalNumber, scenario }) => {
  const raw = String(params?.probe_id || '').trim();
  if (!raw) return null;

  const std = /^Probe-([A-Za-z]+)-(\d+)$/i.exec(raw);
  if (std) {
    return `Probe-${std[1].toUpperCase()}-${parseInt(std[2], 10)}`;
  }

  const numMatch = /(?:^|\b)Probe[^0-9]*([0-9]+)\b/i.exec(raw);
  const number = numMatch ? parseInt(numMatch[1], 10) : null;

  let attrFromRaw = null;
  const allowed = ['AF', 'MF', 'AF-MF', 'MJ', 'IO', 'QOL', 'VOL', 'SS', 'PS'];
  const prefix = raw.split(/\.?Probe/i)[0];
  if (prefix) {
    const tokens = prefix.split(/[-_\.]/);
    for (const tok of tokens) {
      const u = tok.toUpperCase();
      if (allowed.includes(u)) {
        attrFromRaw = u;
        break;
      }
    }
  }

  const targetHint = params?.target_id || alignmentTarget || '';
  const attrComputed = computeAttribute(evalNumber, scenario, targetHint);
  const attr = attrFromRaw || attrComputed || null;

  if (attr && Number.isFinite(number)) return `Probe-${attr}-${number}`;
  if (Number.isFinite(number)) return `Probe-${number}`;
  return null;
};

export const getDisplayCommandName = (histItem, { alignmentTarget, evalNumber, scenario }) => {
  const base = histItem?.command || '';
  if (typeof base === 'string' && base.toLowerCase() === 'respond to ta1 probe') {
    const label = deriveProbeLabel(histItem?.parameters || {}, {
      alignmentTarget,
      evalNumber,
      scenario,
    });
    return label ? `${base} (${label})` : base;
  }
  return base;
};

export const extractKdmaPairsFromHistory = (history) => {
  if (!Array.isArray(history) || history.length === 0) return [];
  const root = history[history.length - 1]?.response;
  if (!root) return [];
  const pairs = [];
  const take = (name, value) => {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (!name || !Number.isFinite(num)) return;
    pairs.push({ name: String(name), value: num });
  };
  const visit = (node) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node === 'object') {
      const keys = Object.keys(node).map((k) => k.toLowerCase());
      if (keys.includes('kdma') && keys.includes('value')) {
        take(node.kdma ?? node.Kdma ?? node.kdma_name ?? node.name, node.value ?? node.Value);
      }
      for (const [k, v] of Object.entries(node)) {
        if (/^kdma[\s_-]*values?$/i.test(k) && Array.isArray(v)) {
          v.forEach((el) => {
            if (el && typeof el === 'object') {
              take(el.kdma ?? el.Kdma ?? el.kdma_name ?? el.name, el.value ?? el.Value);
            }
          });
        }
      }
      for (const val of Object.values(node)) visit(val);
    }
  };
  visit(root);
  const seen = new Set();
  const out = [];
  for (const p of pairs) {
    const key = p.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out.slice(0, 2);
};

export const kdmaAcronym = (raw) => {
  if (!raw) return '';
  const norm = String(raw).trim().toLowerCase().replace(/[_\s-]+/g, '');
  const MAP = {
    affiliation: 'AF',
    merit: 'MF',
    search: 'SS',
    personalsafety: 'PS',
    moraljudgement: 'MJ',
    ingroupbias: 'IO',
    qualityoflife: 'QOL',
    perceivedquantityoflivessaved: 'VOL',
  };
  if (MAP[norm]) return MAP[norm];
  return raw ? raw[0].toUpperCase() + raw.slice(1) : '';
};
