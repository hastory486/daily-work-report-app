import './styles.css';
import { calculatePriority, completionRate, getLocalDateString, isDueToday } from './priority.js';
import { isSupabaseConfigured, supabase } from './supabase.js';

const app = document.querySelector('#app');
let session = null;
let tasks = [];
let editingId = null;
let loading = false;

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function authScreen() {
  return `
    <main class="auth-shell">
      <section class="auth-card">
        <div class="brand-mark" aria-hidden="true">✓</div>
        <p class="eyebrow">DAILY WORK NOTE</p>
        <h1>오늘의 일을<br />가볍게 정리하세요</h1>
        <p class="auth-copy">업무 우선순위와 완료율을 한눈에 확인하고, 어디서든 이어서 관리할 수 있습니다.</p>
        ${!isSupabaseConfigured ? `<div class="notice error"><strong>연결 설정이 필요합니다.</strong><br />.env 파일에 Supabase URL과 Publishable Key를 입력해 주세요.</div>` : ''}
        <form id="auth-form" class="stack-form">
          <label>이메일<input name="email" type="email" autocomplete="email" placeholder="name@company.com" required /></label>
          <label>비밀번호<input name="password" type="password" autocomplete="current-password" minlength="6" placeholder="6자 이상" required /></label>
          <button class="primary-button" type="submit" ${!isSupabaseConfigured ? 'disabled' : ''}>로그인</button>
          <button class="secondary-button" id="signup-button" type="button" ${!isSupabaseConfigured ? 'disabled' : ''}>처음 사용하시나요? 회원가입</button>
        </form>
        <p id="auth-message" class="form-message" role="status"></p>
      </section>
    </main>`;
}

function dashboardScreen() {
  const rate = completionRate(tasks);
  const completed = tasks.filter((task) => task.completed).length;
  const remainingHours = tasks.filter((task) => !task.completed).reduce((sum, task) => sum + Number(task.estimated_hours), 0);
  return `
    <header class="topbar">
      <div><p class="eyebrow">DAILY WORK REPORT</p><h1>안녕하세요, 오늘도 차근차근 해봐요.</h1></div>
      <button id="logout-button" class="text-button" type="button">로그아웃</button>
    </header>
    <main class="page-shell">
      <section class="summary-grid" aria-label="업무 요약">
        <article class="summary-card accent"><span>전체 업무</span><strong>${tasks.length}</strong><small>등록된 업무</small></article>
        <article class="summary-card"><span>완료</span><strong>${completed}</strong><small>${rate}% 달성</small></article>
        <article class="summary-card"><span>남은 예상시간</span><strong>${remainingHours.toFixed(1)}h</strong><small>미완료 업무 기준</small></article>
        <article class="progress-card"><div><span>오늘의 완료율</span><strong>${rate}%</strong></div><div class="progress-track"><span style="width:${rate}%"></span></div><small>${completed}개 완료 · ${tasks.length - completed}개 남음</small></article>
      </section>

      <section class="workspace-grid">
        <article class="panel form-panel">
          <div class="section-heading"><div><p class="eyebrow">NEW TASK</p><h2>${editingId ? '업무 수정' : '업무 추가'}</h2></div>${editingId ? '<button id="cancel-edit" class="text-button" type="button">수정 취소</button>' : ''}</div>
          <form id="task-form" class="task-form">
            <label class="full">업무명<input name="title" maxlength="100" placeholder="예: 8월 자금일보 작성" required /></label>
            <label class="full">설명<textarea name="description" maxlength="1000" rows="3" placeholder="업무의 주요 내용이나 참고사항"></textarea></label>
            <label>중요도<select name="importance" required><option value="1">낮음</option><option value="2" selected>보통</option><option value="3">높음</option></select></label>
            <label>긴급도<select name="urgency" required><option value="1">여유</option><option value="2" selected>보통</option><option value="3">긴급</option></select></label>
            <label>마감일<input name="due_date" type="date" required /></label>
            <label>예상시간<input name="estimated_hours" type="number" min="0.5" max="999" step="0.5" value="1" required /></label>
            <div class="priority-preview full" id="priority-preview"><span>자동 계산 우선순위</span><strong>높음</strong></div>
            <button class="primary-button full" type="submit">${editingId ? '수정 내용 저장' : '업무 추가하기'}</button>
          </form>
          <p id="task-message" class="form-message" role="status"></p>
        </article>

        <section class="task-section">
          <div class="list-heading"><div><p class="eyebrow">TODAY'S TASKS</p><h2>업무 목록</h2></div><span>${tasks.length}개의 업무</span></div>
          ${loading ? '<div class="empty-state">업무를 불러오는 중입니다…</div>' : taskListHtml()}
        </section>
      </section>
    </main>`;
}

function taskListHtml() {
  if (!tasks.length) return `<div class="empty-state"><div class="empty-icon">＋</div><h3>아직 등록된 업무가 없습니다.</h3><p>왼쪽 입력란에서 첫 업무를 추가해 보세요.</p></div>`;
  return `<div class="task-list">${tasks.map((task) => {
    const priority = calculatePriority(task.importance, task.urgency);
    const dueToday = isDueToday(task.due_date);
    return `<article class="task-card ${task.completed ? 'completed' : ''} ${dueToday && !task.completed ? 'due-today' : ''}">
      <button class="check-button" data-action="toggle" data-id="${task.id}" aria-label="${task.completed ? '완료 취소' : '완료 처리'}">${task.completed ? '✓' : ''}</button>
      <div class="task-content">
        <div class="task-title-row"><h3>${escapeHtml(task.title)}</h3><span class="badge ${priority.tone}">${priority.label}</span>${dueToday ? '<span class="badge today">오늘 마감</span>' : ''}</div>
        ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}
        <div class="task-meta"><span>마감 ${escapeHtml(task.due_date)}</span><span>예상 ${Number(task.estimated_hours).toFixed(1)}시간</span><span>중요도 ${task.importance} · 긴급도 ${task.urgency}</span></div>
      </div>
      <div class="task-actions"><button data-action="edit" data-id="${task.id}">수정</button><button class="delete" data-action="delete" data-id="${task.id}">삭제</button></div>
    </article>`;
  }).join('')}</div>`;
}

function render() {
  app.innerHTML = session ? dashboardScreen() : authScreen();
  session ? bindDashboard() : bindAuth();
}

function showMessage(id, message, isError = false) {
  const element = document.querySelector(id);
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('error-text', isError);
}

function bindAuth() {
  const form = document.querySelector('#auth-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const { error } = await supabase.auth.signInWithPassword({ email: data.get('email'), password: data.get('password') });
    showMessage('#auth-message', error ? `로그인 실패: ${error.message}` : '로그인되었습니다.', Boolean(error));
  });
  document.querySelector('#signup-button')?.addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const { error } = await supabase.auth.signUp({ email: data.get('email'), password: data.get('password') });
    showMessage('#auth-message', error ? `회원가입 실패: ${error.message}` : '가입 확인 메일을 확인해 주세요.', Boolean(error));
  });
}

function bindDashboard() {
  const form = document.querySelector('#task-form');
  if (!editingId) form.elements.due_date.value = getLocalDateString();
  const updatePreview = () => {
    const p = calculatePriority(form.elements.importance.value, form.elements.urgency.value);
    document.querySelector('#priority-preview strong').textContent = p.label;
  };
  form.elements.importance.addEventListener('change', updatePreview);
  form.elements.urgency.addEventListener('change', updatePreview);

  if (editingId) {
    const task = tasks.find((item) => item.id === editingId);
    ['title', 'description', 'importance', 'urgency', 'due_date', 'estimated_hours'].forEach((key) => { form.elements[key].value = task[key] ?? ''; });
    updatePreview();
  }

  form.addEventListener('submit', saveTask);
  document.querySelector('#logout-button').addEventListener('click', () => supabase.auth.signOut());
  document.querySelector('#cancel-edit')?.addEventListener('click', () => { editingId = null; render(); });
  document.querySelector('.task-list')?.addEventListener('click', handleTaskAction);
}

async function loadTasks() {
  loading = true; render();
  const { data, error } = await supabase.from('tasks').select('*').order('completed').order('priority_score', { ascending: false }).order('due_date');
  loading = false;
  if (error) { render(); showMessage('#task-message', `업무 불러오기 실패: ${error.message}`, true); return; }
  tasks = data; render();
}

async function saveTask(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const priority = calculatePriority(data.get('importance'), data.get('urgency'));
  const payload = {
    title: data.get('title').trim(), description: data.get('description').trim(),
    importance: Number(data.get('importance')), urgency: Number(data.get('urgency')),
    priority_score: priority.score, due_date: data.get('due_date'),
    estimated_hours: Number(data.get('estimated_hours')),
  };
  const query = editingId
    ? supabase.from('tasks').update(payload).eq('id', editingId)
    : supabase.from('tasks').insert({ ...payload, user_id: session.user.id });
  const { error } = await query;
  if (error) { showMessage('#task-message', `저장 실패: ${error.message}`, true); return; }
  editingId = null; await loadTasks();
}

async function handleTaskAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const task = tasks.find((item) => item.id === button.dataset.id);
  if (button.dataset.action === 'edit') { editingId = task.id; render(); document.querySelector('#task-form').scrollIntoView({ behavior: 'smooth' }); return; }
  if (button.dataset.action === 'delete' && !window.confirm(`“${task.title}” 업무를 삭제할까요?`)) return;
  const { error } = button.dataset.action === 'toggle'
    ? await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id)
    : await supabase.from('tasks').delete().eq('id', task.id);
  if (error) { window.alert(`처리 실패: ${error.message}`); return; }
  await loadTasks();
}

async function start() {
  if (!isSupabaseConfigured) { render(); return; }
  const { data } = await supabase.auth.getSession();
  session = data.session;
  render();
  if (session) await loadTasks();
  supabase.auth.onAuthStateChange((_event, nextSession) => {
    const changed = session?.user?.id !== nextSession?.user?.id;
    session = nextSession;
    tasks = []; editingId = null; render();
    if (session && changed) setTimeout(loadTasks, 0);
  });
}

start();
