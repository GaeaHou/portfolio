import { fetchJSON, renderProjects, fetchGithubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);
const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer, 'h2');


const githubData = await fetchGithubData('gaeahou');

const profileStats = document.querySelector('#profile-stats');
if (profileStats && githubData) {
  profileStats.innerHTML = `
    <h2 class="github-title">My GitHub Stats</h2>
    <div class="github-grid">
      <div>
        <span class="label">FOLLOWERS</span>
        <div class="value">${githubData.followers}</div>
      </div>
      <div>
        <span class="label">FOLLOWING</span>
        <div class="value">${githubData.following}</div>
      </div>
      <div>
        <span class="label">PUBLIC REPOS</span>
        <div class="value">${githubData.public_repos}</div>
      </div>
      <div>
        <span class="label">PUBLIC GISTS</span>
        <div class="value">${githubData.public_gists}</div>
      </div>
    </div>
  `;
}