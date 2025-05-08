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
  
    container.append("h2").text("Summary");
  
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