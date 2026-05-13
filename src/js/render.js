import { isOverdue, formatDate } from './models.js';

export function renderProjects(projects, activeId) {
  const list = document.getElementById('projectList');
  if (!list) return;

  if (projects.length === 0) {
    list.innerHTML = `<div style="padding:8px 10px;font-size:.82rem;color:var(--text3);">No projects yet</div>`;
    return;
  }

  list.innerHTML = projects.map(p => {
    const active = p.id === activeId ? 'active' : '';
    const count = p.tasks.length;
    return `
      <div class="project-item ${active}" data-id="${p.id}"
           style="--project-color:${p.color}">
        <span class="project-dot" style="background:${p.color}"></span>
        <span class="project-name">${escHtml(p.name)}</span>
        <span class="project-count">${count}</span>
        <div class="project-actions">
          <button class="project-action-btn" data-action="edit-project" data-id="${p.id}" title="Rename">✎</button>
          <button class="project-action-btn del" data-action="delete-project" data-id="${p.id}" title="Delete">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

export function renderTasks(project, filterPriority, filterStatus) {
  const board = document.getElementById('taskBoard');
  const emptyState = document.getElementById('emptyState');
  const projectTitle = document.getElementById('projectTitle');
  const projectTaskCount = document.getElementById('projectTaskCount');
  const btnAddTask = document.getElementById('btnAddTask');

  if (!project) {
    board.innerHTML = '';
    emptyState.classList.add('visible');
    projectTitle.textContent = 'Select a project';
    projectTaskCount.textContent = '';
    btnAddTask.disabled = true;
    return;
  }

  emptyState.classList.remove('visible');
  btnAddTask.disabled = false;
  projectTitle.textContent = project.name;

  let tasks = [...project.tasks];

  // Apply filters
  if (filterPriority !== 'all') tasks = tasks.filter(t => t.priority === filterPriority);
  if (filterStatus === 'pending')   tasks = tasks.filter(t => !t.completed);
  if (filterStatus === 'completed') tasks = tasks.filter(t => t.completed);

  const total = project.tasks.length;
  const pending = project.tasks.filter(t => !t.completed).length;
  projectTaskCount.textContent = `${pending} pending · ${total} total`;

  if (tasks.length === 0) {
    const msg = project.tasks.length === 0
      ? 'No tasks yet — add your first task!'
      : 'No tasks match the current filters.';
    board.innerHTML = `
      <div class="empty-state visible" style="flex:unset;padding:60px 0">
        <div class="empty-icon">◎</div>
        <p class="empty-title">${msg}</p>
      </div>`;
    return;
  }

  // Sort: incomplete first, then by due date, then by priority weight
  const priorityWeight = { high: 0, medium: 1, low: 2 };
  tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return priorityWeight[a.priority] - priorityWeight[b.priority];
  });

  board.innerHTML = tasks.map(t => renderTaskCard(t)).join('');
}

function renderTaskCard(task) {
  const priorityColor = { high: 'var(--high)', medium: 'var(--med)', low: 'var(--low)' }[task.priority];
  const overdue = isOverdue(task);
  const checkedClass = task.completed ? 'checked' : '';
  const cardClass = task.completed ? 'completed' : '';
  const dueBadge = task.dueDate
    ? `<span class="badge badge-due ${overdue ? 'overdue' : ''}">
        ${overdue ? '⚠ ' : '📅 '}${formatDate(task.dueDate)}
       </span>`
    : '';
  const notesBadge = task.notes
    ? `<span class="badge badge-notes">📝 Notes</span>` : '';

  return `
    <div class="task-card ${cardClass}" data-id="${task.id}"
         style="--priority-color:${priorityColor}">
      <div class="task-check ${checkedClass}" data-action="toggle" data-id="${task.id}"></div>
      <div class="task-body">
        <div class="task-title">${escHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="badge badge-${task.priority}">${task.priority}</span>
          ${dueBadge}
          ${notesBadge}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-action-btn" data-action="edit-task" data-id="${task.id}" title="Edit">✎</button>
        <button class="task-action-btn del" data-action="delete-task" data-id="${task.id}" title="Delete">✕</button>
      </div>
    </div>
  `;
}

export function renderSummary(projects) {
  let total = 0, done = 0, overdue = 0;
  for (const p of projects) {
    for (const t of p.tasks) {
      total++;
      if (t.completed) done++;
      if (isOverdue(t)) overdue++;
    }
  }
  document.getElementById('summaryTotal').textContent = total;
  document.getElementById('summaryDone').textContent = done;
  document.getElementById('summaryOverdue').textContent = overdue;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
