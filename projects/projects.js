import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const titleElement = document.querySelector('.projects-title');
if (titleElement) {
  titleElement.textContent = `Projects (${projects.length})`;
}
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');