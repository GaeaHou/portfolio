import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const titleElement = document.querySelector('.projects-title');
if (titleElement) {
  titleElement.textContent = `${projects.length} Projects `;
}
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// 准备数据
let data = [
  { value: 1, label: 'apples' },
  { value: 2, label: 'oranges' },
  { value: 3, label: 'mangos' },
  { value: 4, label: 'pears' },
  { value: 5, label: 'limes' },
  { value: 5, label: 'cherries' },
];
let colors = d3.scaleOrdinal(d3.schemeTableau10);
// 创建 arc 生成器
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