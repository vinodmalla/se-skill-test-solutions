
 // Smart API base — works in both development and production
const API = window.location.hostname === 'localhost' ? '' : '/api';
let token = localStorage.getItem('token');
let allTasks = [];
let editingTaskId = null;
let currentFilter = 'all';

// ── Auth Tab Switch ─────────────────────────────────────
function switchTab(tab) {
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  clearAuthMessage();
}

function showAuthMessage(msg, isSuccess = false) {
  const el = document.getElementById('auth-message');
  el.textContent = msg;
  el.className = 'message' + (isSuccess ? ' success' : '');
}

function clearAuthMessage() {
  document.getElementById('auth-message').textContent = '';
}

// ── Password Hints ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const pwInput = document.getElementById('reg-password');
  if (pwInput) {
    pwInput.addEventListener('input', () => {
      const val = pwInput.value;
      toggle('hint-length', val.length >= 8);
      toggle('hint-upper', /[A-Z]/.test(val));
      toggle('hint-number', /[0-9]/.test(val));
      toggle('hint-special', /[!@#$%^&*]/.test(val));
    });
  }
  if (token) showTasksSection();
});

function toggle(id, valid) {
  document.getElementById(id).classList.toggle('valid', valid);
}

// ── Register ────────────────────────────────────────────
async function register() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!username || !email || !password) {
    return showAuthMessage('All fields are required');
  }

  try {
    const res = await fetch(API + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (data.token) {
      token = data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('username', data.user.username);
      showTasksSection();
    } else {
      showAuthMessage(data.error || 'Registration failed');
    }
  } catch {
    showAuthMessage('Network error. Please try again.');
  }
}

// ── Login ───────────────────────────────────────────────
async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    return showAuthMessage('Email and password are required');
  }

  try {
    const res = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      token = data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('username', data.user.username);
      showTasksSection();
    } else {
      showAuthMessage(data.error || 'Login failed');
    }
  } catch {
    showAuthMessage('Network error. Please try again.');
  }
}

// ── Section Toggle ──────────────────────────────────────
function showTasksSection() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('tasks-section').style.display = 'block';
  const username = localStorage.getItem('username');
  if (username) document.getElementById('welcome-msg').textContent = `Hello, ${username}`;
  loadTasks();
}

function logout() {
  token = null;
  allTasks = [];
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  document.getElementById('auth-section').style.display = 'flex';
  document.getElementById('tasks-section').style.display = 'none';
}

// ── Load Tasks ──────────────────────────────────────────
async function loadTasks() {
  try {
    const res = await fetch(API + '/tasks', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 401 || res.status === 403) return logout();
    allTasks = await res.json();
    updateStats();
    renderTasks();
  } catch {
    showTaskMessage('Failed to load tasks.', true);
  }
}

// ── Stats ───────────────────────────────────────────────
function updateStats() {
  document.getElementById('stat-total').textContent = allTasks.length;
  document.getElementById('stat-pending').textContent = allTasks.filter(t => t.status === 'pending').length;
  document.getElementById('stat-progress').textContent = allTasks.filter(t => t.status === 'in_progress').length;
  document.getElementById('stat-done').textContent = allTasks.filter(t => t.status === 'completed').length;
}
// ── Render Tasks ────────────────────────────────────────
function renderTasks() {
  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');
  const filtered = currentFilter === 'all' ? allTasks : allTasks.filter(t => t.status === currentFilter);

  if (filtered.length === 0) {
    list.innerHTML = '';
    list.appendChild(empty);
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = filtered.map(task => `
    <div class="task-card ${task.status === 'completed' ? 'completed-task' : ''}" id="task-${task.id}">
      <div class="task-status-dot dot-${task.status}"></div>
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
      </div>
      <span class="task-badge badge-${task.status}">${formatStatus(task.status)}</span>
      <div class="task-actions">
        <button class="btn-icon" onclick="openEdit(${task.id})" title="Edit">✎</button>
        <button class="btn-icon delete" onclick="deleteTask(${task.id})" title="Delete">✕</button>
      </div>
    </div>
  `).join('');
}

// ── Filter ──────────────────────────────────────────────
function filterTasks(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

// ── Create Task ─────────────────────────────────────────
async function createTask() {
  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-description').value.trim();
  const status = document.getElementById('task-status').value;

  if (!title) return showTaskMessage('Title is required');

  try {
    const res = await fetch(API + '/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ title, description, status })
    });
    if (res.status === 401 || res.status === 403) return logout();
    const data = await res.json();
    if (data.id) {
      document.getElementById('task-title').value = '';
      document.getElementById('task-description').value = '';
      document.getElementById('task-status').value = 'pending';
      showTaskMessage('Task added!', true);
      loadTasks();
    } else {
      showTaskMessage(data.error || 'Failed to create task');
    }
  } catch {
    showTaskMessage('Network error. Please try again.');
  }
}

// ── Edit Task ───────────────────────────────────────────
function openEdit(id) {
  const task = allTasks.find(t => t.id === id);
  if (!task) return;
  editingTaskId = id;
  document.getElementById('edit-title').value = task.title;
  document.getElementById('edit-description').value = task.description || '';
  document.getElementById('edit-status').value = task.status;
  document.getElementById('edit-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('edit-modal').style.display = 'none';
  editingTaskId = null;
}

async function saveEdit() {
  const title = document.getElementById('edit-title').value.trim();
  const description = document.getElementById('edit-description').value.trim();
  const status = document.getElementById('edit-status').value;

  if (!title) return;

  try {
    const res = await fetch(API + '/tasks/' + editingTaskId, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ title, description, status })
    });
    if (res.status === 401 || res.status === 403) return logout();
    closeModal();
    loadTasks();
  } catch {
    showTaskMessage('Failed to update task.');
  }
}

// ── Delete Task ─────────────────────────────────────────
async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    const res = await fetch(API + '/tasks/'+id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 401 || res.status === 403) return logout();
    loadTasks();
  } catch {
    showTaskMessage('Failed to delete task.');
  }
}

// ── Helpers ─────────────────────────────────────────────
function showTaskMessage(msg, isSuccess = false) {
  const el = document.getElementById('task-message');
  el.textContent = msg;
  el.className = 'message' + (isSuccess ? ' success' : '');
  setTimeout(() => { el.textContent = ''; }, 3000);
}

function formatStatus(status) {
  return { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' }[status] || status;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'edit-modal') closeModal();
});
