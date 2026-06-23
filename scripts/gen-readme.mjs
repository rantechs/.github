// Regenerate the Featured projects block in profile/README.md from the portfolio
// metadata (data/projects.yml in the public showcase repo). Run: `npm run gen:readme`.
// Replaces content between the PROJECTS:START/END markers. Only `featured` projects appear.
import { readFileSync, writeFileSync } from 'node:fs';
import yaml from 'js-yaml';

const SRC =
  process.env.PROJECTS_URL ||
  'https://raw.githubusercontent.com/rantechs/rantechs.github.io/main/data/projects.yml';
const BASE = 'https://work.rantechs.com';
const TARGET = 'profile/README.md';

const STATUS_COLOR = {
  Production: '2ea44f',
  'In Development': 'd29922',
  Maintained: '5b8cff',
  Archived: '6e7681',
};
const HOST = {
  'AWS CloudFront': ['FF9900', 'amazoncloudfront'],
  AWS: ['FF9900', 'amazonwebservices'],
  Vercel: ['000000', 'vercel'],
  Netlify: ['00C7B7', 'netlify'],
  'GitHub Pages': ['222222', 'githubpages'],
};

// shields.io label/message escaping: '-' -> '--', '_' -> '__', ' ' -> '_'
const t = (s) => String(s ?? '').replace(/-/g, '--').replace(/_/g, '__').replace(/ /g, '_');
const badge = (label, msg, color, extra = '') =>
  `https://img.shields.io/badge/${t(label)}-${t(msg)}-${color}?style=flat-square${extra}`;

function card(p) {
  const out = [`### ${p.name} — *${p.tagline}*`, ''];
  out.push(`\`${p.category}\` · ${(p.stack || []).join(' · ')}`);
  if (p.summary) out.push(p.summary);
  out.push('');

  const b = [];
  if (p.case_study)
    b.push(`[![Case study](${badge('Case study', 'Read report', '5b8cff')})](${BASE}${p.case_study})`);
  if (p.production && p.hosting) {
    const [color, logo] = HOST[p.hosting] || ['555555', ''];
    b.push(
      `[![Live · ${p.hosting}](${badge('Live', p.hosting, color, logo ? `&logo=${logo}&logoColor=white` : '')})](${p.production})`
    );
  }
  if (p.status && p.production)
    b.push(
      `[![Status · ${p.status}](${badge('Status', p.status, STATUS_COLOR[p.status] || '555555')})](${p.production})`
    );
  if (p.repo) {
    const url = `https://github.com/${p.repo}`;
    b.push(
      p.repo_public
        ? `[![Repo · Source](${badge('Repo', 'Source', '1f6feb', '&logo=github&logoColor=white')})](${url})`
        : `[![Repo · Private](https://img.shields.io/badge/Repo-Private_%F0%9F%94%92-6e7681?style=flat-square&logo=github&logoColor=white)](${url})`
    );
  }
  if (p.ci_workflow && p.repo) {
    const w = `https://github.com/${p.repo}/actions/workflows/${p.ci_workflow}`;
    b.push(`[![Deploy](${w}/badge.svg)](${w})`);
  }
  out.push(b.join('\n'));
  return out.join('\n');
}

const text = await (await fetch(SRC)).text();
const { projects = [] } = yaml.load(text) || {};
const featured = projects.filter((p) => p.featured);

let body = featured.map(card).join('\n\n---\n\n');
if (featured.some((p) => !p.repo_public && p.ci_workflow)) {
  body +=
    '\n\n<sub>↑ The live CI/CD status badge renders for RanTechs team members with repo access; it is a private repository, so logged-out visitors may see it as unavailable.</sub>';
}

const md = readFileSync(TARGET, 'utf8');
const re = /(<!-- PROJECTS:START[^>]*-->)[\s\S]*?(<!-- PROJECTS:END -->)/;
if (!re.test(md)) {
  console.error('PROJECTS markers not found in', TARGET);
  process.exit(1);
}
writeFileSync(TARGET, md.replace(re, `$1\n\n${body}\n\n$2`));
console.log(`gen-readme: wrote ${featured.length} featured project(s) from ${SRC}`);
