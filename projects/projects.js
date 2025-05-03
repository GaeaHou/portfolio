import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


const projects = await fetchJSON('../lib/projects.json');
const titleElement = document.querySelector('.projects-title');
if (titleElement) {
  titleElement.textContent = `${projects.length} Projects `;
}
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

let rolledData = d3.rollups(
  projects,
  v => v.length,    // 每年的项目数量
  d => d.year       // 按 year 分组
);

let data = rolledData.map(([year, count]) => ({
  label: year,
  value: count,
}));


let colors = d3.scaleOrdinal(d3.schemeTableau10);
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let sliceGenerator = d3.pie().value(d => d.value);
let arcData = sliceGenerator(data);

arcData.forEach((d, idx) => {
  d3.select('#projects-plot')
    .append('path')
    .attr('d', arcGenerator(d))
    .attr('fill', colors(idx));
});

let legend = d3.select('.legend');

data.forEach((d, idx) => {
  legend
    .append('li')
    .attr('style', `--color:${colors(idx)}`) // 用变量传颜色
    .attr('class', 'legend-item')            // 加 class 用于样式
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});

