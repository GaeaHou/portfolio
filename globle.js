console.log('IT’S ALIVE!');

// 工具函数：选择器简写
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// 激活当前页面链接高亮
const navLinks = $$("nav a");
let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);
currentLink?.classList.add("current");

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

// 🌗 创建主题切换器（自动插入 <label><select>...）
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

// 💾 读取用户选择的主题
const themeSelect = document.querySelector("label.color-scheme select");
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  document.documentElement.style.colorScheme = savedTheme;
  themeSelect.value = savedTheme;
}

// 🎯 监听选择变化并应用主题
themeSelect.addEventListener("change", (e) => {
  const theme = e.target.value;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem("theme", theme);
});