const PROJECTS_KEY = 'landscapeflow_v2_projects';
const ACTIVE_PROJECT_KEY = 'landscapeflow_v2_active_project';
const MAX_PROJECTS = 12;

function readMap() {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveProjectState(projectState) {
  if (!projectState?.projectId) return;
  try {
    const projects = readMap();
    const safeState = {
      ...projectState,
      isGenerating: false,
      runState: projectState.runState === 'running' ? 'paused' : projectState.runState,
      savedAt: new Date().toISOString(),
    };
    projects[projectState.projectId] = safeState;
    const ordered = Object.values(projects).sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
    const trimmed = Object.fromEntries(ordered.slice(0, MAX_PROJECTS).map((item) => [item.projectId, item]));
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(trimmed));
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectState.projectId);
  } catch (error) {
    console.warn('项目状态保存失败：', error);
  }
}

export function loadActiveProject() {
  try {
    const id = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (!id) return null;
    return normalizeProject(readMap()[id] || null);
  } catch {
    return null;
  }
}

export function loadProject(projectId) {
  return normalizeProject(readMap()[projectId] || null);
}

export function listProjects() {
  return Object.values(readMap()).map(normalizeProject).sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
}

function normalizeProject(project) {
  if (!project?.blueprint) return project;
  const blueprint = migrateBlueprintToV2(project.blueprint);
  return {
    ...project,
    formData: project.formData || blueprint.projectBasicInfo || {},
    runMode: project.runMode === 'demo' ? 'roadshow' : project.runMode,
    versions: migrateVersionHistory(project.versions || []),
    blueprint: {
      ...blueprint,
      pptOutline: blueprint.pptOutline || blueprint.pptStructure || [],
      pptStructure: blueprint.pptStructure || blueprint.pptOutline || [],
    },
  };
}

export function setActiveProject(projectId) {
  if (projectId) localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
}

export function deleteProject(projectId) {
  const projects = readMap();
  delete projects[projectId];
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  if (localStorage.getItem(ACTIVE_PROJECT_KEY) === projectId) localStorage.removeItem(ACTIVE_PROJECT_KEY);
  return listProjects();
}

export function clearProjects() {
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(ACTIVE_PROJECT_KEY);
}
import { migrateBlueprintToV2 } from '../blueprint/blueprintMigration.js';
import { migrateVersionHistory } from '../blueprint/blueprintVersionService.js';
