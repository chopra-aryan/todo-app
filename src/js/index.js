import '../styles/main.css';
import { loadData, saveData } from './storage.js';
import { createProject, createTask, formatDate, isOverdue } from './models.js';
import { renderProjects, renderTasks, renderSummary } from './render.js';
import { showToast } from './toast.js';

// ── State ──────────────────────────────────────────────────
let state = loadData();
// Ensure structure
if (!state.projects) state.projects = [];
if (!state.activeProjectId) state.activeProjectId = null;

let editingProjectId = null;   // null = creating new
let editingTaskId    = null;   // null = creating new
let selectedColor    = '#FF6B6B';
let filterPriority   = 'all';
let filterStatus     = 'all';

// ── Helpers ────────────────────────────────────────────────
function persist() { saveData(state); }

function getActiveProject() {
  return state.projects.find(p => p.id === state.activeProjectId) || null;
}

function refresh() {
  renderProjects(state.projects, state.activeProjectId);
  renderTasks(getActiveProject(), filterPriority, filterStatus);
  renderSummary(state.projects);
}

// ── Modal helpers ──────────────────────────────────────────
function openModal(overlayId) {
  document.getElementById(overlayId).classList.add('open');
}
function closeModal(overlayId) {
  document.getElementById(overlayId).classList.remove('open');
}

// ── Project Modal ──────────────────────────────────────────
function openProjectModal(projectId = null) {
  editingProjectId = projectId;
  const title = document.getElementById('projectModalTitle');
  const confirm = document.getElementById('projectModalConfirm');
  const input = document.getElementById('projectNameInput');

  if (projectId) {
    const p = state.projects.find(x => x.id === projectId);
    title.textContent = 'Edit Project';
    confirm.textContent = 'Save Changes';
    input.value = p.name;
    selectedColor = p.color;
  } else {
    title.textContent = 'New Project';
    confirm.textContent = 'Create Project';
    input.value = '';
    selectedColor = '#FF6B6B';
  }
  // Sync color dots
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.color === selectedColor);
  });
  openModal('projectModalOverlay');
  setTimeout(() => input.focus(), 80);
}

function closeProjectModal() {
  closeModal('projectModalOverlay');
  editingProjectId = null;
}

function confirmProject() {
  const name = document.getElementById('projectNameInput').value.trim();
  if (!name) { showToast('Please enter a project name.'); return; }

  if (editingProjectId) {
    const p = state.projects.find(x => x.id === editingProjectId);
    p.name = name;
    p.color = selectedColor;
    showToast('Project updated.');
  } else {
    const p = createProject({ name, color: selectedColor });
    state.projects.push(p);
    state.activeProjectId = p.id;
    showToast(`Project "${name}" created!`);
  }
  persist(); refresh(); closeProjectModal();
}

function deleteProject(id) {
  const p = state.projects.find(x => x.id === id);
  if (!confirm(`Delete project "${p.name}" and all its tasks?`)) return;
  state.projects = state.projects.filter(x => x.id !== id);
  if (state.activeProjectId === id) {
    state.activeProjectId = state.projects[0]?.id || null;
  }
  persist(); refresh();
  showToast('Project deleted.');
}

// ── Task Modal ─────────────────────────────────────────────
function openTaskModal(taskId = null) {
  editingTaskId = taskId;
  const title    = document.getElementById('taskModalTitle');
  const confirm  = document.getElementById('taskModalConfirm');

  if (taskId) {
    const project = getActiveProject();
    const t = project.tasks.find(x => x.id === taskId);
    title.textContent   = 'Edit Task';
    confirm.textContent = 'Save Changes';
    document.getElementById('taskTitle').value    = t.title;
    document.getElementById('taskDesc').value     = t.description;
    document.getElementById('taskDueDate').value  = t.dueDate;
    document.getElementById('taskPriority').value = t.priority;
    document.getElementById('taskNotes').value    = t.notes;
  } else {
    title.textContent   = 'New Task';
    confirm.textContent = 'Add Task';
    document.getElementById('taskTitle').value    = '';
    document.getElementById('taskDesc').value     = '';
    document.getElementById('taskDueDate').value  = '';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskNotes').value    = '';
  }
  openModal('taskModalOverlay');
  setTimeout(() => document.getElementById('taskTitle').focus(), 80);
}

function closeTaskModal() {
  closeModal('taskModalOverlay');
  editingTaskId = null;
}

function confirmTask() {
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) { showToast('Task title is required.'); return; }

  const fields = {
    title,
    description: document.getElementById('taskDesc').value.trim(),
    dueDate:     document.getElementById('taskDueDate').value,
    priority:    document.getElementById('taskPriority').value,
    notes:       document.getElementById('taskNotes').value.trim(),
  };

  const project = getActiveProject();
  if (!project) return;

  if (editingTaskId) {
    const t = project.tasks.find(x => x.id === editingTaskId);
    Object.assign(t, fields);
    showToast('Task updated.');
  } else {
    project.tasks.push(createTask(fields));
    showToast('Task added!');
  }
  persist(); refresh(); closeTaskModal();
}

// ── Detail Modal ───────────────────────────────────────────
function openDetailModal(taskId) {
  const project = getActiveProject();
  const t = project.tasks.find(x => x.id === taskId);
  if (!t) return;

  const overdue = isOverdue(t);
  const priorityColors = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

  document.getElementById('detailBadges').innerHTML = `
    <span class="badge ${priorityColors[t.priority]}">${t.priority}</span>
    ${t.completed ? '<span class="badge" style="background:rgba(105,219,124,.15);color:var(--low)">Completed</span>' : ''}
    ${overdue ? '<span class="badge badge-high">Overdue</span>' : ''}
  `;
  document.getElementById('detailTitle').textContent = t.title;

  const meta = [];
  if (t.dueDate) meta.push(`📅 Due ${formatDate(t.dueDate)}`);
  meta.push(`Created ${formatDate(t.createdAt.split('T')[0])}`);
  document.getElementById('detailMeta').textContent = meta.join('  ·  ');

  const descSection = document.getElementById('detailDescSection');
  if (t.description) {
    descSection.style.display = 'block';
    document.getElementById('detailDesc').textContent = t.description;
  } else {
    descSection.style.display = 'none';
  }

  const notesSection = document.getElementById('detailNotesSection');
  if (t.notes) {
    notesSection.style.display = 'block';
    document.getElementById('detailNotes').textContent = t.notes;
  } else {
    notesSection.style.display = 'none';
  }

  // Wire edit button
  document.getElementById('detailEditBtn').onclick = () => {
    closeModal('detailModalOverlay');
    openTaskModal(taskId);
  };

  openModal('detailModalOverlay');
}

// ── Toggle complete ────────────────────────────────────────
function toggleTask(taskId) {
  const project = getActiveProject();
  const t = project.tasks.find(x => x.id === taskId);
  if (!t) return;
  t.completed = !t.completed;
  persist(); refresh();
  showToast(t.completed ? 'Task marked complete ✓' : 'Task reopened');
}

// ── Delete task ────────────────────────────────────────────
function deleteTask(taskId) {
  const project = getActiveProject();
  if (!confirm('Delete this task?')) return;
  project.tasks = project.tasks.filter(x => x.id !== taskId);
  persist(); refresh();
  showToast('Task deleted.');
}

// ── Event Listeners ────────────────────────────────────────

// Sidebar toggle
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// New project button
document.getElementById('btnNewProject').addEventListener('click', () => openProjectModal());

// Project modal
document.getElementById('projectModalClose').addEventListener('click', closeProjectModal);
document.getElementById('projectModalCancel').addEventListener('click', closeProjectModal);
document.getElementById('projectModalConfirm').addEventListener('click', confirmProject);
document.getElementById('projectModalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeProjectModal();
});
document.getElementById('projectNameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmProject();
});

// Color picker
document.getElementById('colorRow').addEventListener('click', e => {
  const dot = e.target.closest('.color-dot');
  if (!dot) return;
  selectedColor = dot.dataset.color;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.toggle('active', d === dot));
});

// Add task button
document.getElementById('btnAddTask').addEventListener('click', () => openTaskModal());

// Task modal
document.getElementById('taskModalClose').addEventListener('click', closeTaskModal);
document.getElementById('taskModalCancel').addEventListener('click', closeTaskModal);
document.getElementById('taskModalConfirm').addEventListener('click', confirmTask);
document.getElementById('taskModalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeTaskModal();
});
document.getElementById('taskTitle').addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmTask();
});

// Detail modal
document.getElementById('detailModalClose').addEventListener('click', () => closeModal('detailModalOverlay'));
document.getElementById('detailModalClose2').addEventListener('click', () => closeModal('detailModalOverlay'));
document.getElementById('detailModalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal('detailModalOverlay');
});

// Filters
document.getElementById('filterPriority').addEventListener('change', e => {
  filterPriority = e.target.value;
  refresh();
});
document.getElementById('filterStatus').addEventListener('change', e => {
  filterStatus = e.target.value;
  refresh();
});

// Project list — event delegation
document.getElementById('projectList').addEventListener('click', e => {
  const editBtn = e.target.closest('[data-action="edit-project"]');
  const delBtn  = e.target.closest('[data-action="delete-project"]');
  const item    = e.target.closest('.project-item');

  if (editBtn) { e.stopPropagation(); openProjectModal(editBtn.dataset.id); return; }
  if (delBtn)  { e.stopPropagation(); deleteProject(delBtn.dataset.id); return; }
  if (item) {
    state.activeProjectId = item.dataset.id;
    persist(); refresh();
  }
});

// Task board — event delegation
document.getElementById('taskBoard').addEventListener('click', e => {
  const toggleBtn = e.target.closest('[data-action="toggle"]');
  const editBtn   = e.target.closest('[data-action="edit-task"]');
  const delBtn    = e.target.closest('[data-action="delete-task"]');
  const card      = e.target.closest('.task-card');

  if (toggleBtn) { e.stopPropagation(); toggleTask(toggleBtn.dataset.id); return; }
  if (editBtn)   { e.stopPropagation(); openTaskModal(editBtn.dataset.id); return; }
  if (delBtn)    { e.stopPropagation(); deleteTask(delBtn.dataset.id); return; }
  if (card)      { openDetailModal(card.dataset.id); }
});

// Global ESC to close any open modal
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  ['projectModalOverlay','taskModalOverlay','detailModalOverlay'].forEach(id => {
    if (document.getElementById(id).classList.contains('open')) closeModal(id);
  });
});

// ── Init ───────────────────────────────────────────────────
refresh();
