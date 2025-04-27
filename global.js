console.log("IT’S ALIVE!");

// 工具函数：选择器简写
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// 页面导航配置
let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact", title: "Contact" },
  { url: "CV", title: "CV" },
  { url: "https://github.com/GaeaHou", title: "GitHub" },
];

// 动态创建导航栏
let nav = document.createElement("nav");
document.body.prepend(nav);

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  if (!url.startsWith("http")) {
    url = BASE_PATH + url;
  }

  let a = document.createElement("a");
  a.href = url;
  a.textContent = title;

  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

// 当前页高亮
const navLinks = $$("nav a");
let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);
currentLink?.classList.add("current");

// 🌗 创建主题切换器
const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">🌗 Automatic (${isDarkMode ? "Dark" : "Light"})</option>
      <option value="light">🌞 Light</option>
      <option value="dark">🌙 Dark</option>
    </select>
  </label>
`
);

// 💾 读取已保存的主题并应用
const themeSelect = document.querySelector("label.color-scheme select");
const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
  document.documentElement.setAttribute("color-scheme", savedTheme);
  document.documentElement.style.colorScheme = savedTheme;
  themeSelect.value = savedTheme;
} else {
  // 默认设置为自动
  document.documentElement.setAttribute("color-scheme", "light dark");
  document.documentElement.style.colorScheme = "light dark";
}

// 🎯 监听下拉选择变化
themeSelect.addEventListener("change", (e) => {
  const theme = e.target.value;
  document.documentElement.setAttribute("color-scheme", theme);
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem("theme", theme);
});

// 📧 改进联系表单
const form = document.querySelector("form.contact-form");
form?.addEventListener("submit", function (event) {
  event.preventDefault(); // 阻止默认表单提交

  const data = new FormData(form);
  let url = form.action + "?"; // 获取mailto:地址，例如mailto:xuebinghou60@gmail.com
  const params = [];

  // 遍历表单字段，编码值并构建URL参数
  for (let [name, value] of data) {
    const encodedValue = encodeURIComponent(value);
    params.push(`${name}=${encodedValue}`);
    console.log(name, encodedValue); // 调试：查看编码后的值
  }

  // 拼接参数到URL
  url += params.join("&");

  // 打开邮件客户端
  location.href = url;
});


export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!Array.isArray(projects)) {
    console.error('Invalid projects data');
    return;
  }

  if (!containerElement || !(containerElement instanceof HTMLElement)) {
    console.error('Invalid containerElement');
    return;
  }

  const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  if (!validHeadings.includes(headingLevel)) {
    console.warn(`Invalid headingLevel "${headingLevel}", defaulting to h2`);
    headingLevel = 'h2';
  }

  containerElement.innerHTML = '';

  if (projects.length === 0) {
    containerElement.innerHTML = `<p>No projects to display.</p>`;
    return;
  }

  for (const project of projects) {
    const article = document.createElement('article');
    
    // 如果有 link，就让图片变成可点击
    const imageElement = project.link
      ? `<a href="${project.link}" target="_blank"><img src="${project.image || '#'}" alt="${project.title || 'Project Image'}"></a>`
      : `<img src="${project.image || '#'}" alt="${project.title || 'Project Image'}">`;

    article.innerHTML = `
      <${headingLevel}>${project.title || 'Untitled Project'}</${headingLevel}>
      ${imageElement}
      <p>${project.description || 'No description provided.'}</p>
    `;
    containerElement.appendChild(article);
  }
}