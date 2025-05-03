import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const titleElement = document.querySelector('.projects-title');
if (titleElement) {
  titleElement.textContent = `${projects.length} Projects`;
}

const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');
const svg = d3.select('#projects-plot');
const legend = d3.select('.legend');

let selectedIndex = -1;
let query = '';
let currentChartData = [];

function getFilteredProjects() {
  let result = projects.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  if (selectedIndex !== -1) {
    const selectedYear = currentChartData[selectedIndex].label;
    result = result.filter((p) => String(p.year) === String(selectedYear));
  }

  return result;
}

function update() {
  const filtered = getFilteredProjects();
  renderProjects(filtered, projectsContainer, 'h2');
  renderPieChart(filtered);
}

function renderPieChart(projectsInput) {
  const rolledData = d3.rollups(
    projectsInput,
    (v) => v.length,
    (d) => d.year
  );

  const data = rolledData.map(([year, count]) => ({
    label: year,
    value: count
  }));

  currentChartData = data;

  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);

  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  arcData.forEach((d, i) => {
    svg
      .append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i))
      .attr('style', `--color:${colors(i)}`)
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        update();
      });
  });

  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(i)}`)
      .attr('class', i === selectedIndex ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        update();
      });
  });
}

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  update();
});

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);