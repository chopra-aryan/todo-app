const STORAGE_KEY = 'taskflow_data';

const defaultData = {
  projects: [],
  activeProjectId: null,
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultData);
    return JSON.parse(raw);
  } catch {
    return structuredClone(defaultData);
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}
