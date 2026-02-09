import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const statePath = path.join(repoRoot, 'data', 'state.json');
const indexPath = path.join(repoRoot, 'index.md');

function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p,obj){ fs.writeFileSync(p, JSON.stringify(obj,null,2)+'\n'); }
function pad3(n){ return String(n).padStart(3,'0'); }

const state = readJson(statePath);
const nextDay = (state.lastDay ?? 1) + 1;
const nextId = pad3(nextDay);

const r = spawnSync('node', ['scripts/render-day.mjs', String(nextDay)], { stdio:'inherit' });
if (r.status !== 0) process.exit(r.status ?? 1);

let index = fs.readFileSync(indexPath, 'utf8');
const card = `\n    <div class="card">\n      <span class="badge">DAY ${nextId}</span>\n      <a href="{{ '/days/day-${nextId}.html' | relative_url }}"><b>Day ${nextDay}</b> — IELTS Speaking</a>\n      <div class="note">Vocab 30 + speaking drills + SRS</div>\n    </div>\n`;

const marker = '  </div>\n\n  <hr>';
if (!index.includes(marker)) throw new Error('index.md marker not found');
index = index.replace(marker, `${card}  </div>\n\n  <hr>`);
fs.writeFileSync(indexPath, index);

state.lastDay = nextDay;
writeJson(statePath, state);

console.log(`Updated: index.md (added DAY ${nextId})`);
console.log(`Updated: data/state.json (lastDay=${nextDay})`);
