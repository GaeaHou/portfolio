import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// [1.1] 添加全局变量 commitProgress、timeScale 和 commitMaxTime
let commitProgress = 100;
let timeScale = null;
let commitMaxTime = null;
// [1.2] 添加全局变量 filteredCommits
let filteredCommits = null;
// [1.2] 添加全局变量 xScale、yScale 和 colorScale 以便 updateScatterPlot 使用
let xScale = null;
let yScale = null;
let colorScale = null;
// [Fix] 添加全局变量 commits
let commits = null;

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
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

// [1.2] 添加 updateScatterPlot 函数
function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  // [1.2] 更新 xScale 的定义域
  xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  // [1.2] 清除并更新 x 轴
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('--r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

function renderScatterPlot(data, commits) {
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
  
    const svg = d3
      .select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height + 60}`)
      .style('overflow', 'visible');
  
    // [1.2] 初始化全局 xScale
    xScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    // [1.2] 初始化全局 yScale
    yScale = d3.scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);
  
    // [1.2] 初始化全局 colorScale
    colorScale = d3.scaleSequential()
      .domain([0, 24])
      .interpolator(d3.interpolateWarm);
  
    const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
    const rScale = d3.scaleSqrt()
      .domain([minLines, maxLines])
      .range([3, 20]);
  
    svg.append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  
    svg.append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));
  
    svg.append('g')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .attr('class', 'x-axis')
      .call(d3.axisBottom(xScale));
  
    svg.append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));

    const sortedCommits = d3.sort(commits, d => -d.totalLines);
  
    svg.append('g')
      .attr('class', 'dots')
      .selectAll('circle')
      .data(sortedCommits, (d) => d.id)
      .join('circle')
      .attr('cx', (d) => xScale(d.datetime))
      .attr('cy', (d) => yScale(d.hourFrac))
      .attr('r', (d) => rScale(d.totalLines))
      .style('--r', (d) => rScale(d.totalLines))
      .attr('fill', (d) => colorScale(d.hourFrac))
      .attr('stroke', 'black')
      .attr('stroke-width', 0.2)
      .style('fill-opacity', 0.7)
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
      });
  
    // 添加图例（颜色条）
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
        ? commits.filter((d) => isCommitSelected(selection, d))
        : [];
      const countElement = document.getElementById('selection-count');
      countElement.textContent = `${
        selectedCommits.length || 'No'
      } commits selected`;
      return selectedCommits;
    }
  
    function renderLanguageBreakdown(selection) {
      const selectedCommits = selection
        ? commits.filter((d) => isCommitSelected(selection, d))
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
      if (!selection) {
        d3.selectAll("circle").classed("selected", false);
        renderSelectionCount(null);
        renderLanguageBreakdown(null);
        return;
      }
      d3.selectAll("circle").classed("selected", d =>
        isCommitSelected(selection, d)
      );
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

function isCommitSelected(selection, commit) {
    if (!selection) return false;
    const [[x0, y0], [x1, y1]] = selection;
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
    return selectedCommits;
}

function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }

    const lines = selectedCommits.flatMap((d) => d.lines);

    const breakdown = d3.rollup(lines, v => v.length, d => d.type);
    container.innerHTML = '';
    for (const [lang, count] of breakdown) {
      const proportion = count / lines.length;
      container.innerHTML += `
        <dt>${lang}</dt>
        <dd>${count} lines (${d3.format('.1~%')(proportion)})</dd>`;
    }
}

// [Step 2.1] 添加 updateFileDisplay 函数
function updateFileDisplay(filteredCommits) {
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    });

  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join(
      (enter) =>
        enter.append('div').call((div) => {
          div.append('dt').append('code');
          div.append('dd');
        }),
    );

  filesContainer.select('dt > code').text((d) => d.name);
  filesContainer.select('dd').text((d) => `${d.lines.length} lines`);
}

function onTimeSliderChange(data) {
  commitProgress = +d3.select('#commit-progress').property('value');
  commitMaxTime = timeScale.invert(commitProgress);
  d3.select('#commit-time').text(
    commitMaxTime.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })
  );
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  updateScatterPlot(data, filteredCommits);
  renderCommitInfo(data, filteredCommits);
  // [Step 2.1] 调用 updateFileDisplay 更新文件显示
  updateFileDisplay(filteredCommits);
}

async function main() {
    const data = await loadData();
    commits = processCommits(data);
    timeScale = d3
      .scaleTime()
      .domain([
        d3.min(commits, (d) => d.datetime),
        d3.max(commits, (d) => d.datetime),
      ])
      .range([0, 100]);
    commitMaxTime = timeScale.invert(commitProgress);
    d3.select('#commit-time').text(
      commitMaxTime.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })
    );
    d3.select('#commit-progress').on('input', () => onTimeSliderChange(data));
    renderCommitInfo(data, commits);
    renderScatterPlot(data, commits);
    // [Step 2.1] 初始调用 updateFileDisplay
    updateFileDisplay(commits);
}

main();