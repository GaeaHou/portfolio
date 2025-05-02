import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const titleElement = document.querySelector('.projects-title');
if (titleElement) {
  titleElement.textContent = `${projects.length} Projects `;
}
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// 1. 创建一个 arc 生成器（用于生成 path 字符串）
let arcGenerator = d3.arc()
  .innerRadius(0)
  .outerRadius(50);  // 半径为 50，内半径为 0，表示实心圆

// 2. 用 arcGenerator 生成一个完整圆的 path（起始角度 0，结束角度 2π）
let arc = arcGenerator({
  startAngle: 0,
  endAngle: 2 * Math.PI
});

// 3. 把这个 path 添加到 SVG 中
d3.select('#projects-plot')
  .append('path')
  .attr('d', arc)
  .attr('fill', 'red');