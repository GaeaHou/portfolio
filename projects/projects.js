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
let data = [1, 2];
let total = 0;
for (let d of data) total += d;

// 创建 arc 生成器
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// 计算每个扇形的起止角度
let angle = 0;
let arcData = [];
for (let d of data) {
  let endAngle = angle + (d / total) * 2 * Math.PI;
  arcData.push({ startAngle: angle, endAngle });
  angle = endAngle;
}

// 根据角度生成路径
let arcs = arcData.map((d) => arcGenerator(d));

// 添加颜色
let colors = ['gold', 'purple'];

// 把每个扇形添加到 svg
arcs.forEach((arc, idx) => {
  d3.select('#projects-plot')
    .append('path')
    .attr('d', arc)
    .attr('fill', colors[idx]);
});