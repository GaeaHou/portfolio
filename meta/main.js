import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let commitProgress = 100;
let lastCommitProgress = 100;
let timeScale;
let filteredCommits = [];
let prevFilteredCommits = []; // 记录上一次的 filteredCommits

let NUM_ITEMS = 100; // Ideally, let this value be the length of your commit history
let ITEM_HEIGHT = 100; // Feel free to change
let VISIBLE_COUNT = 10; // Feel free to change as well
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;
const scrollContainer = d3.select('#scroll-container');
const spacer = d3.select('#spacer');
spacer.style('height', `${totalHeight}px`);
const itemsContainer = d3.select('#items-container');
scrollContainer.on('scroll', () => {
  const scrollTop = scrollContainer.property('scrollTop');
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  startIndex = Math.max(
    0,
    Math.min(startIndex, commits.length - VISIBLE_COUNT),
  );
  renderItems(startIndex);
});

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: false,
        enumerable: false,
        configurable: false,
      });

      return ret;
    });
}
function renderItems(startIndex) {
  // Clear things off
  itemsContainer.selectAll('div').remove();
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex);
  // 更新散点图
  updateScatterPlot(data, newCommitSlice);
  // Re-bind the commit data to the container and represent each using a div
  filteredCommits = newCommitSlice;
  displayCommitFiles();

  itemsContainer.selectAll('div')
    .data(newCommitSlice)
    .enter()
    .append('div')
    .attr('class', 'item')
    .html((d, i) => `
      <p>
        On ${d.datetime.toLocaleString("en", {dateStyle: "full", timeStyle: "short"})}, I made
        <a href="${d.url}" target="_blank">
          ${i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
        </a>. I edited ${d.totalLines} lines across ${d3.rollups(d.lines, D => D.length, d => d.file).length} files. Then I looked over all I had made, and I saw that it was very good.
      </p>
    `)
    .style('position', 'absolute')
    .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`);
}

function renderCommitInfo(data, commits) {
  d3.select("#stats").html("");

  const totalLOC = data.length;
  const totalCommits = commits.length;
  const totalFiles = d3.groups(data, d => d.file).length;
  const maxDepth = d3.max(data, d => d.depth);
  const longestLine = d3.max(data, d => d.length);
  const maxLines = d3.max(
    d3.rollups(data, v => d3.max(v, d => d.line), d => d.file),
    d => d[1]
  );

  const stats = [
    { label: "Commits", value: totalCommits },
    { label: "Files", value: totalFiles },
    { label: "Total LOC", value: totalLOC },
    { label: "Max Depth", value: maxDepth },
    { label: "Longest Line", value: longestLine },
    { label: "Max Lines", value: maxLines },
  ];

  const container = d3.select("#stats")
    .append("section")
    .attr("class", "summary-panel");

  const statRow = container.append("div").attr("class", "stat-grid");

  const cards = statRow.selectAll("div")
    .data(stats)
    .enter()
    .append("div")
    .attr("class", "stat-card");

  cards.append("div").attr("class", "stat-label").text(d => d.label.toUpperCase());
  cards.append("div").attr("class", "stat-value").text(d => d.value);
}

function updateScatterPlot(data, filteredCommits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 40, left: 50 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // 获取或创建 SVG（不移除）
  let svg = d3.select('#chart').select('svg');
  if (svg.empty()) {
    svg = d3
      .select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height + 60}`)
      .style('overflow', 'visible');

    // 初始化轴和图例
    const xScale = d3.scaleTime()
      .domain(d3.extent(filteredCommits, d => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();

    const yScale = d3.scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);

    svg.append('g')
      .attr('class', 'y-axis-grid')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(d3.axisBottom(xScale));

    // 图例
    const legendWidth = 300;
    const legendHeight = 12;

    const legendGroup = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${(width - legendWidth) / 2}, ${height + 40})`);

    const legendScale = d3.scaleLinear().domain([0, 24]).range([0, legendWidth]);

    const gradientId = "legend-gradient";
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%").attr("x2", "100%")
      .attr("y1", "0%").attr("y2", "0%");

    const colorScale = d3.scaleSequential()
      .domain([0, 24])
      .interpolator(d3.interpolateWarm);

    for (let i = 0; i <= 24; i++) {
      linearGradient.append("stop")
        .attr("offset", `${(i / 24) * 100}%`)
        .attr("stop-color", colorScale(i));
    }

    legendGroup.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", `url(#${gradientId})`)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.5);

    const legendAxis = d3.axisBottom(legendScale)
      .tickValues([0, 6, 12, 18, 24])
      .tickFormat(d => {
        if (d === 0) return "Midnight";
        if (d === 6) return "6am";
        if (d === 12) return "Noon";
        if (d === 18) return "6pm";
        if (d === 24) return "Midnight";
        return d;
      });

    legendGroup.append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .style("font-size", "0.75em");
  }

  // 更新比例尺
  const xScale = d3.scaleTime()
    .domain(d3.extent(filteredCommits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  const yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const colorScale = d3.scaleSequential()
    .domain([0, 24])
    .interpolator(d3.interpolateWarm);

  const [minLines, maxLines] = d3.extent(filteredCommits, d => d.totalLines);
  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([3, 20]);

  // 更新轴
  svg.select('.y-axis-grid')
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  svg.select('.y-axis')
    .call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));

  svg.select('.x-axis')
    .call(d3.axisBottom(xScale));

  // 确定新点
  const prevCommitIds = new Set(prevFilteredCommits.map(d => d.id));
  const newCommits = filteredCommits.filter(d => !prevCommitIds.has(d.id));

  // 判断滑块方向
  const isMovingForward = commitProgress > lastCommitProgress;

  // 更新点
  const dots = svg.selectAll('.dots').data([null]);
  const dotsEnter = dots.enter().append('g').attr('class', 'dots');
  const dotsGroup = dotsEnter.merge(dots);

  dotsGroup.selectAll('circle')
    .data(filteredCommits, d => d.id)
    .join(
      enter => enter.append('circle')
        .attr('class', d => (isMovingForward && newCommits.some(nc => nc.id === d.id)) ? 'new-circle' : '')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', 0) // 新点从 r: 0 开始，过渡到目标值
        .attr('fill', d => colorScale(d.hourFrac))
        .attr('stroke', 'black')
        .attr('stroke-width', 0.2)
        .style('fill-opacity', 0.7)
        .attr('style', d => `--r: ${rScale(d.totalLines)}`)
        .on('mouseenter', (event, commit) => {
          d3.select(event.currentTarget).style('fill-opacity', 1);
          renderTooltipContent(commit);
          updateTooltipVisibility(true);
          updateTooltipPosition(event);
        })
        .on('mousemove', updateTooltipPosition)
        .on('mouseleave', (event) => {
          d3.select(event.currentTarget).style('fill-opacity', 0.7);
          updateTooltipVisibility(false);
        })
        .transition() // 添加过渡
        .duration(500) // 0.5 秒过渡
        .attr('r', d => rScale(d.totalLines)),
      update => update
        .transition() // 为现有点添加位置过渡
        .duration(500) // 0.5 秒过渡
        .attr('class', '')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines))
        .attr('fill', d => colorScale(d.hourFrac))
        .attr('stroke', 'black')
        .attr('stroke-width', 0.2)
        .style('fill-opacity', 0.7)
        .attr('style', d => `--r: ${rScale(d.totalLines)}`),
      exit => exit.remove()
    );

  // 更新 Brushing
  const brush = d3.brush()
    .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
    .on("start brush end", brushed);

  svg.call(brush);

  svg.selectAll('.dots, .overlay ~ *').raise();

  function isCommitSelected(selection, commit) {
    if (!selection) return false;
    const [[x0, y0], [x1, y1]] = selection;
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
  }

  function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? filteredCommits.filter((d) => isCommitSelected(selection, d))
      : [];
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;
    return selectedCommits;
  }

  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? filteredCommits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');
    container.className = 'language-columns';
    container.innerHTML = '';

    if (selectedCommits.length === 0) return;

    const lines = selectedCommits.flatMap((d) => d.lines);
    const breakdown = d3.rollup(lines, v => v.length, d => d.type);

    for (const [lang, count] of breakdown) {
      const proportion = count / lines.length;
      const langDiv = document.createElement('div');
      langDiv.className = 'lang-block';
      langDiv.innerHTML = `
        <div class="lang-name">${lang.toUpperCase()}</div>
        <div class="lang-lines">${count} lines</div>
        <div class="lang-percent">(${d3.format('.1~%')(proportion)})</div>
      `;
      container.appendChild(langDiv);
    }
  }

  function brushed(event) {
    const selection = event.selection;
    d3.selectAll("circle").classed("selected", d => isCommitSelected(selection, d));
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
  }
}

function renderTooltipContent(commit) {
  document.getElementById('commit-link').href = commit.url;
  document.getElementById('commit-link').textContent = commit.id;
  document.getElementById('commit-date').textContent = commit.datetime.toLocaleDateString();
  document.getElementById('commit-time').textContent = commit.datetime.toLocaleTimeString();
  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  document.getElementById('commit-tooltip').hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 10}px`;
  tooltip.style.top = `${event.clientY + 10}px`;
}

function displayCommitFiles() {
  const lines = filteredCommits.flatMap((d) => d.lines);
  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    });
  files = d3.sort(files, (d) => -d.lines.length);
  d3.select('.files').selectAll('div').remove();
  let filesContainer = d3
    .select('.files')
    .selectAll('div')
    .data(files)
    .enter()
    .append('div');
  filesContainer
    .append('dt')
    .html(
      (d) => `<code>${d.name}</code><small>${d.lines.length} lines</small>`,
    );
  filesContainer
    .append('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .enter()
    .append('div')
    .attr('class', 'line')
    .style('background', (d) => fileTypeColors(d.type));
}

async function main() {
  const data = await loadData();
  const commits = processCommits(data);

  timeScale = d3.scaleTime(
    [d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)],
    [0, 100]
  );

  let commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  renderCommitInfo(data, filteredCommits);
  updateScatterPlot(data, filteredCommits);
  prevFilteredCommits = [...filteredCommits]; // 初始化 prevFilteredCommits
  displayCommitFiles(); // 保留文件显示
  renderItems(0); // 显式调用 renderItems 确保初始渲染
}

main();