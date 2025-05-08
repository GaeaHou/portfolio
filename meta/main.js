import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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
      .attr('viewBox', `0 0 ${width} ${height + 60}`) // 给图例预留空间
      .style('overflow', 'visible');
  
    const xScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    const yScale = d3.scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);
  
    const colorScale = d3.scaleSequential()
      .domain([0, 24])
      .interpolator(d3.interpolateWarm);
  
    const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
    const rScale = d3.scaleSqrt()
      .domain([minLines, maxLines])
      .range([3, 20]);
  
    // ✅ 添加网格线
    svg.append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  
    // ✅ 添加坐标轴
    svg.append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));
  
    svg.append('g')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(d3.axisBottom(xScale));
  
    // ✅ 绘制点（按修改行数降序）
    const sortedCommits = d3.sort(commits, d => -d.totalLines);
  
    svg.append('g')
      .attr('class', 'dots')
      .selectAll('circle')
      .data(sortedCommits)
      .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', d => rScale(d.totalLines))
      .attr('fill', d => colorScale(d.hourFrac))
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
  
    // ✅ 添加图例（颜色条）
    const legendWidth = 300;
    const legendHeight = 12;
  
    const legendGroup = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${(width - legendWidth) / 2}, ${height + 40})`);
  
    const legendScale = d3.scaleLinear().domain([0, 24]).range([0, legendWidth]);
  
    const gradientId = "legend-gradient";
  
    // 定义渐变色
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
  
    // 绘制渐变矩形
    legendGroup.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", `url(#${gradientId})`)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.5);
  
    // 添加刻度
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
    tooltip.style.left = `${event.clientX + 10}px`;  // 偏移一点
    tooltip.style.top = `${event.clientY + 10}px`;
  }

  async function main() {
    const data = await loadData();
    const commits = processCommits(data);
    renderCommitInfo(data, commits);
    renderScatterPlot(data, commits);
  }
  
main();