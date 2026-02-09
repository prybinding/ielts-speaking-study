import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const vocabPath = path.join(repoRoot, 'data', 'plan', 'vocab.json');
const skillsPath = path.join(repoRoot, 'data', 'plan', 'skills.json');
const daysDir = path.join(repoRoot, 'days');
const daysDataDir = path.join(repoRoot, 'data', 'days');

function pad3(n){ return String(n).padStart(3,'0'); }
function loadJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function saveJson(p,obj){ fs.writeFileSync(p, JSON.stringify(obj,null,2)+'\n'); }
function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }

function srsDueDays(day){
  const offsets=[1,3,7,14];
  return offsets.map(o=>day-o).filter(d=>d>=1);
}

function renderVocab(v){
  return `    <li><b>${v.en}</b> <span class="badge">Word</span><br>
      <div class="note">발음(IPA): <b>${v.ipa}</b> · 뜻: <b>${v.ko}</b></div>
      <ul>
        <li>기억법/힌트: ${v.hint}</li>
        <li>스피킹용: 이 단어로 문장 1개 바로 만들기</li>
      </ul>
    </li>`;
}

function renderSkillBlock(s){
  if (s.items){
    const items = s.items.map(i=>`      <li><b>${i.en}</b> — ${i.ko}</li>`).join('\n');
    return `<div class="card">
  <h3>${s.title}</h3>
  <p class="note">${s.ko}</p>
  <ul>\n${items}\n  </ul>
</div>`;
  }
  const temps = (s.templates??[]).map(t=>`  <li><b>${t.en}</b><br><span class="note">${t.ko}</span></li>`).join('\n');
  return `<div class="card">
  <h3>${s.title}</h3>
  <p class="note">${s.ko}</p>
  <p class="note"><b>구조</b>: <code>${s.pattern}</code></p>
  <ol>\n${temps}\n  </ol>
</div>`;
}

function renderDay({day, vocabToday, skillsToday, reviewSets}){
  const id=pad3(day);
  const prevId=pad3(day-1);
  const nextId=pad3(day+1);
  const navPrev = day===1 ? '<a class="disabled" href="#">← 이전</a>' : `<a href="{{ '/days/day-${prevId}.html' | relative_url }}">← 이전</a>`;

  const vocabHtml = vocabToday.map(renderVocab).join('\n');
  const skillsHtml = skillsToday.map(renderSkillBlock).join('\n');

  const reviewHtml = reviewSets.map(({label,dayNum,items})=>{
    const lines = items.map(v=>`        <li><b>${v.en}</b> — ${v.ko}</li>`).join('\n');
    return `    <li><b>${label}</b> (Day ${pad3(dayNum)})
      <ul>\n${lines}\n      </ul>
      <div class="note">연습: 뜻만 보고 5초 안에 영어로 문장 1개.</div>
    </li>`;
  }).join('\n');

  return `---
layout: none
title: "Day ${id}"
---
<link rel="stylesheet" href="{{ '/assets/style.css' | relative_url }}">

<div class="container">
  <header>
    <h1>Day ${day} — IELTS Speaking</h1>
    <p class="note">오늘 할 것: 단어/표현 30개 + 답변 구조 + 즉답 연습 + 복습(SRS)</p>
  </header>

  <div class="nav">
    ${navPrev}
    <a href="{{ '/index.html' | relative_url }}">목록</a>
    <a href="{{ '/days/day-${nextId}.html' | relative_url }}">다음 →</a>
  </div>

  <hr>
  <h2>0) 오늘의 규칙(스피킹)</h2>
  <ul>
    <li><b>2문장 규칙</b>: 답만 하지 말고, 이유/예시를 1문장 더 붙이기</li>
    <li><b>끊김 방지</b>: 연결어 1개를 먼저 말하고 생각하기 (Actually / In my view / For example ...)</li>
    <li><b>발음</b>: 완벽보다 <b>강세/리듬</b> 우선</li>
  </ul>

  <h2>1) 오늘의 단어/표현 (30개)</h2>
  <ol>
${vocabHtml}
  </ol>

  <h2>2) 오늘의 스피킹 스킬</h2>
${skillsHtml}

  <h2>3) 즉답 퀴즈 (Part 1 느낌)</h2>
  <div class="card">
    <p><b>Q1.</b> Do you like your neighborhood?</p>
    <p class="note">힌트: It depends / convenient / quiet / crowded</p>
    <p><b>Q2.</b> What do you usually do on weekends?</p>
    <p class="note">힌트: routine / make time for / work-life balance</p>
    <p><b>Q3.</b> Do you prefer mornings or nights?</p>
    <p class="note">힌트: prefer / nowadays / on the whole</p>
  </div>

  <h2>4) 복습 (SRS)</h2>
  <p class="note">원칙: 한국어 뜻을 보고 영어를 떠올린 뒤, 문장 1개 말하기.</p>
  <ol>
${reviewHtml || '    <li>오늘은 첫날이라 복습 없음</li>'}
  </ol>

  <hr>
  <div class="nav">
    ${navPrev}
    <a href="{{ '/index.html' | relative_url }}">목록</a>
    <a href="{{ '/days/day-${nextId}.html' | relative_url }}">다음 →</a>
  </div>
</div>
`;
}

const day = Number(process.argv[2]);
if (!Number.isFinite(day) || day<1){
  console.error('Usage: node scripts/render-day.mjs <dayNumber>');
  process.exit(1);
}

ensureDir(daysDir);
ensureDir(daysDataDir);

const vocabAll = loadJson(vocabPath);
const skillsAll = loadJson(skillsPath);

const vocabPerDay = 30;
const start = (day-1)*vocabPerDay;
const vocabToday = vocabAll.slice(start, start+vocabPerDay);
if (vocabToday.length < vocabPerDay){
  throw new Error(`Not enough vocab for Day ${day} (need ${vocabPerDay}, have ${vocabToday.length}). Expand data/plan/vocab.json.`);
}

const skillsToday = day===1 ? skillsAll.slice(0,2) : skillsAll.slice(1,2);

// write day data
saveJson(path.join(daysDataDir, `day-${pad3(day)}.json`), { day, vocabIds: vocabToday.map(v=>v.id), skillIds: skillsToday.map(s=>s.id) });

// review sets
const vocabById = new Map(vocabAll.map(v=>[v.id,v]));
const due = srsDueDays(day);
const reviewSets = due.map(d=>{
  const p=path.join(daysDataDir, `day-${pad3(d)}.json`);
  if (!fs.existsSync(p)) return null;
  const dd = loadJson(p);
  const items = (dd.vocabIds??[]).slice(0,10).map(id=>vocabById.get(id)).filter(Boolean);
  const diff=day-d;
  const label = diff===1?'D+1':diff===3?'D+3':diff===7?'D+7':'D+14';
  return {label, dayNum:d, items};
}).filter(Boolean);

const out = path.join(daysDir, `day-${pad3(day)}.md`);
fs.writeFileSync(out, renderDay({day, vocabToday, skillsToday, reviewSets}));
console.log(`Rendered: ${out}`);
