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
  
async function main() {
    const data = await loadData();
    const commits = processCommits(data);
    renderCommitInfo(data, commits);
}
  
main();

function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };
  
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };
  
    // Create SVG
    const svg = d3
      .select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');
  
    // X: time (date)
    const xScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    // Y: hour (0-24)
    const yScale = d3.scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);
  
    // Color: based on hour
    const colorScale = d3.scaleSequential()
      .domain([0, 24])
      .interpolator(d3.interpolateWarm); // or interpolateCool, interpolatePlasma
  
    // Gridlines
    const gridlines = svg.append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left}, 0)`);
  
    gridlines.call(
      d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width)
    );
  
    // Axes
    svg.append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(
        d3.axisLeft(yScale)
          .tickFormat(d => String(d % 24).padStart(2, '0') + ':00')
      );
  
    svg.append('g')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(d3.axisBottom(xScale));
  
    // Dots
    const dots = svg.append('g').attr('class', 'dots');
  
    dots.selectAll('circle')
      .data(commits)
      .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', 4)
      .attr('fill', d => colorScale(d.hourFrac))
      .attr('opacity', 0.8);
  }

  let data = await loadData();
  let commits = processCommits(data);
  
  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);