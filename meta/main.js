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
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Number of files
    dl.append('dt').text('Number of files');
    dl.append('dd').text(d3.groups(data, d => d.file).length);
  
    // Longest line
    const longestLine = d3.greatest(data, d => d.length);
    dl.append('dt').text('Longest line');
    dl.append('dd').text(longestLine?.length + ' chars');
  
    // Deepest line
    const deepest = d3.greatest(data, d => d.depth);
    dl.append('dt').text('Max depth');
    dl.append('dd').text(deepest?.depth);
  
    // Average file length (in lines)
    const fileLengths = d3.rollups(
      data,
      v => d3.max(v, d => d.line),
      d => d.file
    );
    dl.append('dt').text('Avg file length (lines)');
    dl.append('dd').text(d3.mean(fileLengths, d => d[1]).toFixed(2));
  
    // Most active time of day
    const periodWork = d3.rollups(
      data,
      v => v.length,
      d => d.datetime.toLocaleString('en', { dayPeriod: 'short' })
    );
    const mostWorkPeriod = d3.greatest(periodWork, d => d[1])?.[0];
    dl.append('dt').text('Most active time of day');
    dl.append('dd').text(mostWorkPeriod || 'N/A');
  }
  
async function main() {
    const data = await loadData();
    const commits = processCommits(data);
    renderCommitInfo(data, commits);
}
  
main();