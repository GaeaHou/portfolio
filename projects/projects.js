import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const titleElement = document.querySelector('.projects-title');
if (titleElement) {
  titleElement.textContent = `${projects.length} Projects`;
}
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

let selectedIndex = -1;
let query = '';
const searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  const filteredProjects = projects.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});

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

  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);

  const svg = d3.select('#projects-plot');
  svg.selectAll('path').remove();

  arcData.forEach((d, i) => {
    svg
      .append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i))
      .attr('style', `--color:${colors(i)}`)
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        svg.selectAll('path').attr('class', (_, idx) =>
          idx === selectedIndex ? 'selected' : ''
        );

        d3.select('.legend')
          .selectAll('li')
          .attr('class', (d, idx) =>
            idx === selectedIndex ? 'legend-item selected' : 'legend-item'
          );

        if (selectedIndex === -1) {
          renderProjects(projectsInput, projectsContainer, 'h2');
        } else {
          const selectedYear = data[selectedIndex].label;
          const filtered = projectsInput.filter(
            (p) => String(p.year) === String(selectedYear)
          );
          renderProjects(filtered, projectsContainer, 'h2');
        }
      });
  });

  const legend = d3.select('.legend');
  legend.selectAll('li').remove();

  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(i)}`)
      .attr('class', i === selectedIndex ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        svg.selectAll('path').attr('class', (_, idx) =>
          idx === selectedIndex ? 'selected' : ''
        );
        legend.selectAll('li').attr('class', (_, idx) =>
          idx === selectedIndex ? 'legend-item selected' : 'legend-item'
        );

        if (selectedIndex === -1) {
          renderProjects(projectsInput, projectsContainer, 'h2');
        } else {
          const selectedYear = data[selectedIndex].label;
          const filtered = projectsInput.filter(
            (p) => String(p.year) === String(selectedYear)
          );
          renderProjects(filtered, projectsContainer, 'h2');
        }
      });
  });
}

renderPieChart(projects);