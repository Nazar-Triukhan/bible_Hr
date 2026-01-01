const START_DATE = "2026-01-01";

function getTodayDayNumber(startDate){
  const s = new Date(startDate + 'T00:00:00');
  const today = new Date();
  const diffMs = today.setHours(0,0,0,0) - s.setHours(0,0,0,0);
  const diffDays = Math.floor(diffMs / (24*60*60*1000));
  const dayNumber = diffDays + 1;
  // clamp between 1 and biblePlan length
  if(dayNumber < 1) return 1;
  if(typeof biblePlan !== 'undefined' && dayNumber > biblePlan.length) return biblePlan.length;
  return dayNumber;
}

function loadData(){
  const out = {};
  for(let i=0;i<localStorage.length;i++){
    const key = localStorage.key(i);
    try{
      out[key] = JSON.parse(localStorage.getItem(key));
    }catch(e){
      out[key] = localStorage.getItem(key);
    }
  }
  return out;
}

function saveData(obj){
  for(const k in obj){
    localStorage.setItem(k, JSON.stringify(obj[k]));
  }
}

function progressKey(dayNumber, chapter){
  return `progress_day${dayNumber}_${chapter}`;
}

function noteKey(dayNumber){
  return `note_day${dayNumber}`;
}

function toggleChapterRead(dayNumber, chapter){
  const key = progressKey(dayNumber, chapter);
  const cur = localStorage.getItem(key);
  const val = !(cur && JSON.parse(cur) === true);
  localStorage.setItem(key, JSON.stringify(val));
  // update UI checkbox if exists
  const cb = document.querySelector(`[data-key="${cssEscape(key)}"]`);
  if(cb) cb.checked = val;
}

function markAllAsRead(dayNumber){
  const day = biblePlan.find(d=>d.day===dayNumber);
  if(!day) return;
  const toSave = {};
  day.chapters.forEach(ch=>{
    toSave[progressKey(dayNumber,ch)] = true;
  });
  saveData(toSave);
  renderTodayView();
  renderDaysList();
}

function renderTodayView(){
  const container = document.getElementById('today-view');
  if(!container) return;
  container.innerHTML = '';
  const dayNumber = getTodayDayNumber(START_DATE);
  const title = document.createElement('h2');
  title.textContent = `День ${dayNumber}`;
  container.appendChild(title);

  const day = biblePlan.find(d=>d.day===dayNumber);
  const ul = document.createElement('ul');
  ul.className = 'chapters';
  if(day){
    day.chapters.forEach(ch=>{
      const li = document.createElement('li');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      const key = progressKey(dayNumber,ch);
      const stored = localStorage.getItem(key);
      checkbox.checked = stored ? JSON.parse(stored) === true : false;
      checkbox.dataset.key = key;
      checkbox.addEventListener('change', ()=>{
        localStorage.setItem(key, JSON.stringify(checkbox.checked));
      });
      // data-key used for existence check
      checkbox.setAttribute('data-key', key);

      const span = document.createElement('span');
      span.textContent = ch;
      li.appendChild(checkbox);
      li.appendChild(span);
      ul.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'Плану на сьогодні немає.';
    ul.appendChild(li);
  }
  container.appendChild(ul);

  const controls = document.createElement('div');
  controls.className = 'controls';
  const markAllBtn = document.createElement('button');
  markAllBtn.className = 'button';
  markAllBtn.textContent = 'Позначити всі як прочитані';
  markAllBtn.addEventListener('click', ()=> markAllAsRead(dayNumber));

  const openNotesBtn = document.createElement('button');
  openNotesBtn.className = 'button';
  openNotesBtn.textContent = 'Відкрити нотатки на сьогодні';
  openNotesBtn.addEventListener('click', ()=>{
    const target = document.getElementById(`day-${dayNumber}`);
    if(target){ target.scrollIntoView({behavior:'smooth',block:'center'});
      const ta = target.querySelector('textarea');
      if(ta) ta.focus();
    }
  });

  controls.appendChild(markAllBtn);
  controls.appendChild(openNotesBtn);
  container.appendChild(controls);
}

function renderDaysList(){
  const container = document.getElementById('days-list');
  if(!container) return;
  container.innerHTML = '';

  biblePlan.forEach(day=>{
    const wrapper = document.createElement('div');
    wrapper.className = 'day';
    wrapper.id = `day-${day.day}`;

    const h = document.createElement('h3');
    h.textContent = `День ${day.day}`;
    wrapper.appendChild(h);

    const ul = document.createElement('ul');
    ul.className = 'chapters';
    day.chapters.forEach(ch=>{
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = ch;
      span.style.flex = '1';
      li.appendChild(span);

      const btn = document.createElement('button');
      btn.className = 'button small';
      const key = progressKey(day.day, ch);
      const checked = localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) === true : false;
      btn.textContent = checked ? '✓ Прочитано' : 'Позначити';
      btn.addEventListener('click', ()=>{
        toggleChapterRead(day.day, ch);
        renderDaysList();
        renderTodayView();
      });
      li.appendChild(btn);
      ul.appendChild(li);
    });

    wrapper.appendChild(ul);

    const notesDiv = document.createElement('div');
    notesDiv.className = 'notes';
    const noteHeader = document.createElement('h4');
    noteHeader.style.margin = '0 0 8px 0';
    noteHeader.style.fontSize = '13px';
    noteHeader.style.color = '#666';
    noteHeader.textContent = day.chapters.join(', ');
    notesDiv.appendChild(noteHeader);
    const ta = document.createElement('textarea');
    ta.placeholder = `Нотатки для Дня ${day.day}`;
    ta.id = `note-area-${day.day}`;
    const existing = localStorage.getItem(noteKey(day.day));
    if(existing){
      try{ const obj = JSON.parse(existing); if(obj && obj.text) ta.value = obj.text; }catch(e){}
    }
    notesDiv.appendChild(ta);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'button';
    saveBtn.textContent = 'Зберегти нотатку';
    saveBtn.addEventListener('click', ()=> saveNoteForDay(day.day));

    notesDiv.appendChild(saveBtn);
    wrapper.appendChild(notesDiv);
    container.appendChild(wrapper);

    // auto-save on input (debounce)
    let t;
    ta.addEventListener('input', ()=>{
      clearTimeout(t);
      t = setTimeout(()=> saveNoteForDay(day.day), 700);
    });
  });
}

function saveNoteForDay(dayNumber){
  const ta = document.getElementById(`note-area-${dayNumber}`);
  if(!ta) return;
  const text = ta.value.trim();
  const day = biblePlan.find(d=>d.day===dayNumber);
  const chapters = day ? day.chapters.join(', ') : '';
  const noteObj = { text: text, chapters: chapters, timestamp: Date.now() };
  const k = noteKey(dayNumber);
  saveData({[k]: noteObj});
  // small feedback: briefly change button text if available
  const btn = ta.nextElementSibling;
  if(btn && btn.tagName === 'BUTTON'){
    const old = btn.textContent;
    btn.textContent = 'Збережено';
    setTimeout(()=> btn.textContent = old, 800);
  }
}function loadNotesArchive(){
  const container = document.getElementById('notes-archive');
  if(!container) return;
  const notes = [];
  for(let i=0;i<localStorage.length;i++){
    const key = localStorage.key(i);
    if(key && key.startsWith('note_day')){
      try{
        const val = JSON.parse(localStorage.getItem(key));
        if(val && val.timestamp){
          const dayNum = key.replace('note_day','');
          notes.push({ key, day: dayNum, text: val.text || '', chapters: val.chapters || '', timestamp: val.timestamp });
        }
      }catch(e){}
    }
  }
  notes.sort((a,b)=> b.timestamp - a.timestamp);
  container.innerHTML = '';
  if(notes.length===0){
    const p = document.createElement('p'); p.textContent = 'Поки немає нотаток.'; container.appendChild(p); return;
  }
  notes.forEach(n=>{
    const item = document.createElement('div');
    item.className = 'archive-item';
    const h = document.createElement('h4');
    h.textContent = `День ${n.day} — ${n.chapters || ''} — ${formatDate(n.timestamp)}`;
    const p = document.createElement('p');
    p.textContent = n.text || '';
    item.appendChild(h);
    item.appendChild(p);
    container.appendChild(item);
  });
}

function formatDate(ts){
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

// helper for attribute selector safe matching
function cssEscape(s){
  return s.replace(/(["'\\])/g,'\\$1');
}

document.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('today-view')){
    renderTodayView();
    renderDaysList();
  }
  if(document.getElementById('notes-archive')){
    loadNotesArchive();
  }
});
