export function createProject({ name, color }) {
  return {
    id: crypto.randomUUID(),
    name,
    color,
    createdAt: new Date().toISOString(),
    tasks: [],
  };
}

export function createTask({ title, description = '', dueDate = '', priority = 'medium', notes = '' }) {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    dueDate,
    priority,
    notes,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

export function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  const due = new Date(task.dueDate + 'T23:59:59');
  return due < new Date();
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
