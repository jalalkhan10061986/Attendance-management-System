'use strict';
/* ================= HELPERS ================= */
const $ = (s, r = document) => r.querySelector(s);
const KEY = 'attendly_db_v2', ST = ['Present', 'Absent', 'Late', 'Leave'];
const today = () => new Date().toISOString().slice(0, 10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const badge = s => `<span class="badge ${s}">${s}</span>`;
const validDate = d => /^\d{4}-\d\d-\d\d$/.test(d) && !isNaN(Date.parse(d));
const table = (h, r) => r.length
  ? `<div class="tw"><table><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${r.map(x => `<tr>${x.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
  : '<p class="empty">Nothing here yet.</p>';
function toast(m, t = 'ok') { const e = document.createElement('div'); e.className = 'toast ' + t; e.textContent = m; $('#toasts').append(e); setTimeout(() => e.remove(), 3200); }
function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }
const toCSV = rows => rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

/* Sortable, paginated table. rows: [{c:[html cells], v:[sort values]}]; '' heading = not sortable */
const cmp = (a, b) => (typeof a === 'number' && typeof b === 'number') ? a - b : String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true });
function grid(key, heads, rows, def = {}) {
  const g = S.pg[key] ??= { p: 1, size: 10, col: def.col ?? -1, dir: def.dir ?? 1 };
  if (g.col >= 0) rows = [...rows].sort((a, b) => cmp(a.v[g.col], b.v[g.col]) * g.dir);
  const pages = Math.max(1, Math.ceil(rows.length / g.size)); g.p = Math.min(Math.max(1, g.p), pages);
  const from = (g.p - 1) * g.size, part = rows.slice(from, from + g.size);
  const th = heads.map((h, i) => !h ? '<th></th>' : `<th aria-sort="${g.col === i ? (g.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button class="sort" data-a="sort:${key}:${i}">${h}<span aria-hidden="true">${g.col === i ? (g.dir > 0 ? ' ▲' : ' ▼') : ' ↕'}</span></button></th>`).join('');
  const nums = []; for (let i = Math.max(1, g.p - 2); i <= Math.min(pages, g.p + 2); i++) nums.push(`<button class="pg ${i === g.p ? 'on' : ''}" data-a="page:${key}:${i}" ${i === g.p ? 'aria-current="page"' : ''}>${i}</button>`);
  const pager = `<div class="pager"><span>${rows.length ? from + 1 : 0}–${from + part.length} of ${rows.length}</span><span class="sp"></span>
    <label>Rows <select data-ps="${key}">${[5, 10, 25, 50].map(n => `<option ${n === g.size ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <button class="pg" data-a="page:${key}:${g.p - 1}" ${g.p <= 1 ? 'disabled' : ''}>‹ Prev</button>${nums.join('')}<button class="pg" data-a="page:${key}:${g.p + 1}" ${g.p >= pages ? 'disabled' : ''}>Next ›</button></div>`;
  if (!rows.length) return '<p class="empty">No matching results. Try changing the search or filters.</p>';
  return `<div class="tw"><table><thead><tr>${th}</tr></thead><tbody>${part.map(r => `<tr>${r.c.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${pager}`;
}
const clsOpts = sel => `<option value="">All classes</option>` + DB.classes.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('');

/* Modal dialog: onOk returns an error string to keep it open */
function ask(title, html, onOk, okText = 'Save') {
  const d = $('#dlg');
  d.innerHTML = `<form method="dialog"><h3>${title}</h3>${html}<p class="err" id="derr" role="alert"></p><div class="dact"><button class="btn gray" formnovalidate>Cancel</button><button class="btn ${okText === 'Delete' ? 'red' : ''}" id="dok">${okText}</button></div></form>`;
  d.showModal();
  $('#dok').onclick = e => { e.preventDefault(); const r = onOk(); if (r) $('#derr').textContent = r; else d.close(); };
}
const confirmDel = (msg, fn) => ask('Please confirm', `<p>${msg}</p>`, () => { fn(); }, 'Delete');

/* ================= STORAGE ================= */
let DB, USER;
const S = { stu: { q: '', c: '' }, take: { c: '', d: today() }, rec: { from: '', to: '', c: '', q: '', s: '' }, rep: { m: today().slice(0, 7), c: '', q: '', low: '' }, pg: {} };
const save = () => localStorage.setItem(KEY, JSON.stringify(DB));
async function load() {
  const s = localStorage.getItem(KEY);
  if (s) { try { DB = JSON.parse(s); return; } catch (e) { /* fall through to seed */ } }
  try { DB = await (await fetch('data.json')).json(); }
  catch (e) { DB = { users: [{ username: 'admin', password: 'admin123', role: 'admin' }], classes: [], students: [], attendance: [] }; setTimeout(() => toast('Could not load data.json – run via a local server', 'err'), 300); }
  save();
}
const nextId = (p, a) => p + (Math.max(0, ...a.map(x => parseInt(String(x.id).slice(p.length)) || 0)) + 1);
const cls = id => (DB.classes.find(c => c.id === id) || { name: '—' }).name;
const stu = id => DB.students.find(s => s.id === id);

/* ================= AUTH ================= */
function login(u, p) { return DB.users.find(x => x.username === u && x.password === p); }
function start() {
  $('#login').hidden = true; $('#app').hidden = false;
  $('#un').textContent = USER.username; $('#ur').textContent = USER.role; $('#av').textContent = USER.username[0].toUpperCase();
  go('dashboard');
}

/* ================= CALCULATIONS ================= */
function stats(f) { const r = { Present: 0, Absent: 0, Late: 0, Leave: 0, total: 0 }; DB.attendance.filter(f).forEach(a => a.records.forEach(x => { r[x.status]++; r.total++; })); return r; }
/* attendance % = (Present + Late) / all marked days */
function pct(sid, pre = '') {
  let t = 0, a = 0;
  DB.attendance.forEach(r => { if (!r.date.startsWith(pre)) return; const x = r.records.find(x => x.studentId === sid); if (x) { t++; if (x.status === 'Present' || x.status === 'Late') a++; } });
  return t ? Math.round(a / t * 100) : null;
}
const pctBadge = p => p === null ? '—' : `<span class="badge ${p < 75 ? 'Absent' : 'Present'}">${p}%${p < 75 ? ' ⚠ low' : ''}</span>`;
function repRows(m) {
  return DB.students.map(s => {
    const c = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    DB.attendance.forEach(a => { if (!a.date.startsWith(m)) return; const x = a.records.find(x => x.studentId === s.id); if (x) c[x.status]++; });
    const mp = pct(s.id, m), op = pct(s.id);
    return [s.id, s.name, cls(s.classId), c.Present, c.Absent, c.Late, c.Leave, mp === null ? '' : mp + '%', op === null ? '' : op + '%'];
  });
}

function repFiltered() {
  const f = S.rep, q = f.q.toLowerCase();
  return repRows(f.m).filter(r => (!f.c || r[2] === cls(f.c)) && (r[0] + r[1]).toLowerCase().includes(q) && (!f.low || (r[8] && parseInt(r[8]) < 75)));
}

/* ================= VIEWS ================= */
const NAV = [['dashboard', 'Dashboard', '📊'], ['students', 'Students', '👥'], ['classes', 'Classes', '🏫'], ['take', 'Take Attendance', '✅'], ['records', 'Records', '🗂'], ['reports', 'Reports', '📈'], ['settings', 'Settings', '⚙']];
let view = 'dashboard';
const V = {
  dashboard() {
    const dates = DB.attendance.map(a => a.date).sort();
    const d = dates.includes(today()) ? today() : (dates.at(-1) || today());
    const t = stats(a => a.date === d), lbl = d === today() ? 'Today' : d;
    const card = (c, n, l, s, i) => `<div class="stat ${c}"><div><b>${n}</b><span>${l}</span><small>${s}</small></div><i aria-hidden="true">${i}</i></div>`;
    const low = DB.students.map(s => [s, pct(s.id)]).filter(x => x[1] !== null && x[1] < 75);
    const last = [...new Set(dates)].slice(-7);
    return `<div class="stats">${card('green', DB.students.length, 'Total Students', DB.classes.length + ' classes', '🎓')}${card('blue', t.Present, 'Present', lbl, '✔')}${card('red', t.Absent, 'Absent', lbl, '✖')}${card('orange', t.Late, 'Late', lbl, '⏰')}</div>
    <div class="grid2"><div class="card"><h2>Low attendance (&lt;75%)</h2>${table(['Student', 'Class', 'Attendance'], low.map(([s, p]) => [esc(s.name), esc(cls(s.classId)), pctBadge(p)]))}</div>
    <div class="card"><h2>Last 7 days – attendance %</h2><div class="chart">${last.map(x => { const r = stats(a => a.date === x); const p = r.total ? Math.round((r.Present + r.Late) / r.total * 100) : 0; return `<div class="col"><em>${p}%</em><span style="height:${p * 0.75}%"></span><small>${x.slice(5)}</small></div>`; }).join('') || '<p class="empty">No attendance marked yet.</p>'}</div></div></div>`;
  },
  students() {
    const f = S.stu, q = f.q.toLowerCase();
    const rows = DB.students.filter(s => (!f.c || s.classId === f.c) && (s.id + s.name + s.email + s.phone + cls(s.classId)).toLowerCase().includes(q))
      .map(s => ({ c: [esc(s.id), esc(s.name), esc(cls(s.classId)), esc(s.email), esc(s.phone), `<button class="lnk" data-a="editStu:${s.id}">Edit</button><button class="lnk del" data-a="delStu:${s.id}">Delete</button>`], v: [s.id, s.name, cls(s.classId), s.email, s.phone] }));
    return `<div class="card"><div class="bar"><h2>Students</h2><input data-s="stu.q" type="search" placeholder="Search name, ID, email…" aria-label="Search students" value="${esc(f.q)}">
      <select data-s="stu.c" aria-label="Filter by class">${clsOpts(f.c)}</select><button class="btn" data-a="addStu">+ Add student</button></div>
      ${grid('stu', ['ID', 'Name', 'Class', 'Email', 'Phone', ''], rows, { col: 0 })}</div>`;
  },
  classes() {
    const rows = DB.classes.map(c => ({ c: [esc(c.id), esc(c.name), `<span class="pill">${DB.students.filter(s => s.classId === c.id).length}</span>`, `<button class="lnk" data-a="editCls:${c.id}">Rename</button><button class="lnk del" data-a="delCls:${c.id}">Delete</button>`], v: [c.id, c.name, DB.students.filter(s => s.classId === c.id).length] }));
    return `<div class="card"><div class="bar"><h2>Classes</h2><button class="btn" data-a="addCls">+ Add class</button></div>
    ${grid('cls', ['ID', 'Name', 'Students', ''], rows, { col: 0 })}
    <p class="muted small">Assign a student to a class from Students → Edit.</p></div>`;
  },
  take() {
    const t = S.take; if (!t.c || !DB.classes.some(c => c.id === t.c)) t.c = DB.classes[0]?.id || '';
    const rec = DB.attendance.find(a => a.date === t.d && a.classId === t.c);
    const list = DB.students.filter(s => s.classId === t.c);
    return `<div class="card"><div class="bar"><h2>Take attendance</h2>
      <label>Class<select data-s="take.c">${DB.classes.map(c => `<option value="${c.id}" ${c.id === t.c ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <label>Date<input type="date" data-s="take.d" value="${esc(t.d)}"></label>
      <button class="btn blue" data-a="markAll">Mark all present</button><button class="btn" data-a="saveAtt">Save attendance</button></div>
      ${rec ? '<p class="note">Attendance already saved for this class and date – saving will update it.</p>' : ''}
      ${table(['ID', 'Student', 'Status'], list.map(s => { const cur = rec?.records.find(x => x.studentId === s.id)?.status || 'Present'; return [esc(s.id), esc(s.name), `<select data-sid="${s.id}" class="${cur}" aria-label="Status for ${esc(s.name)}">${ST.map(x => `<option ${x === cur ? 'selected' : ''}>${x}</option>`).join('')}</select>`]; }))}</div>`;
  },
  records() {
    const f = S.rec, rows = [];
    DB.attendance.forEach(a => {
      if ((f.from && a.date < f.from) || (f.to && a.date > f.to) || (f.c && a.classId !== f.c)) return;
      a.records.forEach(x => {
        const s = stu(x.studentId);
        if (!s || (f.s && x.status !== f.s) || (f.q && !(s.name + s.id).toLowerCase().includes(f.q.toLowerCase()))) return;
        rows.push({ c: [a.date, esc(s.id), esc(s.name), esc(cls(a.classId)), badge(x.status)], v: [a.date, s.id, s.name, cls(a.classId), x.status] });
      });
    });
    return `<div class="card"><div class="bar"><h2>Records</h2>
      <label>From<input type="date" data-s="rec.from" value="${f.from}"></label><label>To<input type="date" data-s="rec.to" value="${f.to}"></label>
      <label>Class<select data-s="rec.c">${clsOpts(f.c)}</select></label>
      <label>Status<select data-s="rec.s"><option value="">All</option>${ST.map(x => `<option ${x === f.s ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label>Student<input type="search" data-s="rec.q" placeholder="Name or ID" value="${esc(f.q)}"></label></div>
      ${grid('rec', ['Date', 'ID', 'Student', 'Class', 'Status'], rows, { col: 0, dir: -1 })}</div>`;
  },
  reports() {
    const m = S.rep.m, rows = repFiltered();
    const gr = rows.map(r => { const op = r[8] ? parseInt(r[8]) : null; return { c: [esc(r[0]), esc(r[1]), esc(r[2]), r[3], r[4], r[5], r[6], r[7] || '—', pctBadge(op)], v: [r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7] ? parseInt(r[7]) : -1, op ?? -1] }; });
    return `<div class="card"><div class="bar"><h2>Monthly report</h2><label>Month<input type="month" data-s="rep.m" value="${m}"></label>
      <label>Class<select data-s="rep.c">${clsOpts(S.rep.c)}</select></label>
      <label>Show<select data-s="rep.low"><option value="">All students</option><option value="1" ${S.rep.low ? 'selected' : ''}>Below 75% only</option></select></label>
      <label>Student<input type="search" data-s="rep.q" placeholder="Name or ID" value="${esc(S.rep.q)}"></label>
      <button class="btn" data-a="csvRep">Download CSV</button></div>
    ${grid('rep', ['ID', 'Student', 'Class', 'Present', 'Absent', 'Late', 'Leave', 'Month %', 'Overall'], gr, { col: 0 })}
    <p class="muted small">Attendance % = (Present + Late) ÷ all marked days. Below 75% is flagged. The CSV contains the filtered rows.</p></div>`;
  },
  settings() {
    return `<div class="card"><h2>Data</h2><p class="muted">Data is stored in this browser. Export it to keep a JSON backup.</p>
    <div class="bar"><button class="btn" data-a="expJson">Export JSON</button><label class="btn blue" style="margin:0;cursor:pointer">Import JSON<input id="imp" type="file" accept=".json,application/json" hidden></label><button class="btn red" data-a="reset">Reset to sample data</button></div></div>`;
  }
};

function render() {
  $('#nav').innerHTML = NAV.map(n => `<button data-v="${n[0]}" class="${n[0] === view ? 'on' : ''}" ${n[0] === view ? 'aria-current="page"' : ''}><i aria-hidden="true">${n[2]}</i>${n[1]}</button>`).join('');
  $('#view').innerHTML = V[view]();
  $('#side').classList.remove('open');
}
function go(v) { view = v; render(); $('#view').focus(); }

/* ================= ACTIONS ================= */
const studentForm = (s) => {
  const edit = !!s; s = s || {};
  ask(edit ? 'Edit student' : 'Add student',
    `<label>ID<input id="f1" value="${esc(s.id || nextId('S', DB.students))}" ${edit ? 'readonly' : ''}></label><label>Name<input id="f2" value="${esc(s.name)}"></label>
     <label>Class<select id="f3">${DB.classes.map(c => `<option value="${c.id}" ${c.id === s.classId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
     <label>Email<input id="f4" type="email" value="${esc(s.email)}"></label><label>Phone<input id="f5" value="${esc(s.phone)}"></label>`,
    () => {
      const o = { id: $('#f1').value.trim(), name: $('#f2').value.trim(), classId: $('#f3').value, email: $('#f4').value.trim(), phone: $('#f5').value.trim() };
      if (!o.id || !o.name) return 'ID and name are required.';
      if (!o.classId) return 'Create a class first.';
      if (!edit && stu(o.id)) return 'That ID already exists.';
      if (o.email && !/^\S+@\S+\.\S+$/.test(o.email)) return 'Enter a valid email address.';
      if (o.phone && !/^[\d+\-\s()]{7,}$/.test(o.phone)) return 'Enter a valid phone number.';
      if (edit) Object.assign(s, o); else DB.students.push(o);
      save(); toast('Student saved'); render();
    });
};
const classForm = (c) => ask(c ? 'Rename class' : 'Add class', `<label>Class name<input id="f1" value="${esc(c?.name)}"></label>`, () => {
  const n = $('#f1').value.trim();
  if (!n) return 'Class name is required.';
  if (DB.classes.some(x => x !== c && x.name.toLowerCase() === n.toLowerCase())) return 'A class with this name exists.';
  if (c) c.name = n; else DB.classes.push({ id: nextId('C', DB.classes), name: n });
  save(); toast('Class saved'); render();
});
const ACT = {
  addStu: () => DB.classes.length ? studentForm() : toast('Create a class first', 'err'),
  editStu: id => studentForm(stu(id)),
  delStu: id => confirmDel(`Delete student ${esc(stu(id).name)} and their records?`, () => {
    DB.students = DB.students.filter(s => s.id !== id);
    DB.attendance.forEach(a => a.records = a.records.filter(r => r.studentId !== id));
    save(); toast('Student deleted'); render();
  }),
  addCls: () => classForm(),
  editCls: id => classForm(DB.classes.find(c => c.id === id)),
  delCls: id => DB.students.some(s => s.classId === id) ? toast('Move or delete this class’s students first', 'err')
    : confirmDel('Delete this class?', () => { DB.classes = DB.classes.filter(c => c.id !== id); DB.attendance = DB.attendance.filter(a => a.classId !== id); save(); toast('Class deleted'); render(); }),
  sort: (k, c) => { const g = S.pg[k]; c = +c; if (g.col === c) g.dir *= -1; else { g.col = c; g.dir = 1; } render(); },
  page: (k, n) => { S.pg[k].p = +n; render(); },
  markAll: () => document.querySelectorAll('[data-sid]').forEach(s => { s.value = 'Present'; s.className = 'Present'; }),
  saveAtt: () => {
    const { c, d } = S.take, sel = [...document.querySelectorAll('[data-sid]')];
    if (!validDate(d)) return toast('Choose a valid date', 'err');
    if (!c || !sel.length) return toast('No students in this class', 'err');
    const records = sel.map(s => ({ studentId: s.dataset.sid, status: s.value }));
    const ex = DB.attendance.find(a => a.date === d && a.classId === c);
    if (ex) ex.records = records; else DB.attendance.push({ date: d, classId: c, records });
    save(); toast(ex ? 'Attendance updated' : 'Attendance saved'); render();
  },
  csvRep: () => { download(`attendance-${S.rep.m}.csv`, toCSV([['ID', 'Name', 'Class', 'Present', 'Absent', 'Late', 'Leave', 'Month %', 'Overall %'], ...repFiltered()]), 'text/csv'); toast('CSV downloaded'); },
  expJson: () => { download('attendance-data.json', JSON.stringify(DB, null, 2), 'application/json'); toast('JSON exported'); },
  reset: () => confirmDel('Replace all data with the sample data?', async () => { localStorage.removeItem(KEY); await load(); toast('Sample data restored'); render(); })
};

/* ================= EVENTS ================= */
const vw = $('#view');
vw.addEventListener('click', e => { const a = e.target.closest('[data-a]'); if (!a) return; const [k, ...args] = a.dataset.a.split(':'); ACT[k]?.(...args); });
vw.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.s) { // generic state binding, e.g. data-s="rec.q"
    const [a, b] = t.dataset.s.split('.'); S[a][b] = t.value; Object.values(S.pg).forEach(g => g.p = 1); render();
    const n = $(`[data-s="${t.dataset.s}"]`); if (n && t.type !== 'date' && t.type !== 'month' && t.tagName !== 'SELECT') { n.focus(); n.setSelectionRange?.(99, 99); }
  } else if (t.dataset.ps) { const g = S.pg[t.dataset.ps]; g.size = +t.value; g.p = 1; render(); }
  else if (t.dataset.sid) t.className = t.value;
  else if (t.id === 'imp' && t.files[0]) {
    t.files[0].text().then(txt => {
      const j = JSON.parse(txt);
      if (!['users', 'classes', 'students', 'attendance'].every(k => Array.isArray(j[k]))) throw 0;
      DB = j; save(); toast('Data imported'); render();
    }).catch(() => toast('Invalid JSON file', 'err'));
  }
});
$('#nav').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) go(b.dataset.v); });
$('#gs').addEventListener('keydown', e => { if (e.key === 'Enter') { S.stu.q = e.target.value; e.target.value = ''; go('students'); } });
['burger', 'burger2'].forEach(i => $('#' + i).onclick = () => $('#side').classList.toggle('open'));
$('#logout').onclick = () => { sessionStorage.removeItem('att_user'); location.reload(); };
$('#theme').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; localStorage.setItem('att_theme', t); };
$('#lf').onsubmit = e => {
  e.preventDefault();
  const u = login($('#lu').value.trim(), $('#lp').value);
  if (!u) return $('#le').textContent = 'Wrong username or password.';
  USER = u; sessionStorage.setItem('att_user', u.username); start();
};

/* ================= INIT ================= */
(async () => {
  document.documentElement.dataset.theme = localStorage.getItem('att_theme') || 'light';
  await load();
  USER = DB.users.find(u => u.username === sessionStorage.getItem('att_user'));
  USER ? start() : ($('#login').hidden = false);
})();
