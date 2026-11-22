// ============================================================
// GitHub Profile Finder  (MP3 + MP4)
// Plain-words guide:
//   1. User types a username and presses Search
//   2. fetch() asks GitHub for the profile AND the repos
//   3. We draw the profile, then filter / sort the repos (arrays)
//   4. Recent searches and saved profiles live in localStorage
// ============================================================

// ---------- 1. SETTINGS ----------
const API = "https://api.github.com/users/";
const RECENT_KEY = "recentSearches";   // names of boxes inside localStorage
const SAVED_KEY = "savedProfiles";

// ---------- 2. FIND THE PAGE ELEMENTS ----------
const form = document.querySelector("#search-form");
const usernameInput = document.querySelector("#username");
const recentBox = document.querySelector("#recent");
const profileBox = document.querySelector("#profile");
const savedList = document.querySelector("#saved-list");
const savedCount = document.querySelector("#saved-count");
const statusBox = document.querySelector("#status");
const repoArea = document.querySelector("#repo-area");
const repoSearch = document.querySelector("#repo-search");
const languageSelect = document.querySelector("#language");
const repoSort = document.querySelector("#repo-sort");
const repoCount = document.querySelector("#repo-count");
const repoList = document.querySelector("#repos");

// ---------- 3. OUR DATA ----------
let currentUser = null;               // the profile on screen
let currentRepos = [];                // that person's repos
let lastSearch = "";                  // used by the "Try again" button
let recent = readList(RECENT_KEY);    // last searches, read from localStorage
let saved = readList(SAVED_KEY);      // saved profiles, read from localStorage

// ---------- 4. LOCAL STORAGE ----------
function readList(key) {
  try {
    // localStorage only keeps text, so we turn the text back into an array
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  // turn the array into text and keep it in the browser
  localStorage.setItem(key, JSON.stringify(list));
}

function addRecent(login) {
  // remove the name if it is already there, put it first, keep only 5
  recent = [login, ...recent.filter((name) => name !== login)].slice(0, 5);
  writeList(RECENT_KEY, recent);
  showRecent();
}

function isSaved(login) {
  return saved.some((item) => item.login === login);
}

function toggleSaved(login) {
  if (isSaved(login)) {
    saved = saved.filter((item) => item.login !== login);
  } else {
    saved.push({ login: currentUser.login, avatar: currentUser.avatar_url });
  }
  writeList(SAVED_KEY, saved);
  showSavedList();
  if (currentUser) showProfile(); // refresh the Save button text
}

// ---------- 5. SAFETY HELPER ----------
// People can type anything in their bio (even HTML code!).
// This turns special characters into harmless text before we put it on the page.
function safe(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

// ---------- 6. GET DATA FROM THE API ----------
async function searchUser(username) {
  lastSearch = username;
  profileBox.innerHTML = "";
  repoArea.classList.add("hidden");
  showStatus(`
    <div class="flex items-center justify-center gap-3 py-12">
      <span class="h-5 w-5 animate-spin rounded-full border-2 border-leaf border-t-transparent"></span>
      <p>Searching GitHub…</p>
    </div>`);

  try {
    // ask for the profile and the repos at the same time
    const name = encodeURIComponent(username);
    const [userResponse, repoResponse] = await Promise.all([
      fetch(API + name),
      fetch(API + name + "/repos?per_page=100&sort=updated"),
    ]);

    // empty state: no such user
    if (userResponse.status === 404) {
      showStatus(`
        <div class="rounded-xl bg-carbon-black-900 p-6 text-center ring-1 ring-white/10">
          <p class="font-bold">No GitHub user named “${safe(username)}”</p>
          <p class="mt-1 text-sm">Check the spelling and try again.</p>
        </div>`);
      return;
    }
    // GitHub allows only 60 requests per hour without a login
    if (userResponse.status === 403 || userResponse.status === 429) {
      throw new Error("GitHub’s hourly request limit was reached. Wait a while and try again.");
    }
    if (!userResponse.ok || !repoResponse.ok) {
      throw new Error("GitHub answered with status " + userResponse.status);
    }

    currentUser = await userResponse.json();
    currentRepos = await repoResponse.json();

    addRecent(currentUser.login);
    repoSearch.value = "";
    fillLanguages();
    showStatus("");
    showProfile();
    repoArea.classList.remove("hidden");
    showRepos();
  } catch (error) {
    // error state
    showStatus(`
      <div class="rounded-xl bg-carbon-black-900 p-6 text-center ring-1 ring-white/10">
        <p class="font-bold">Couldn’t reach GitHub</p>
        <p class="mt-1 text-sm">Check your internet connection, then try again.</p>
        <p class="mt-1 text-xs text-ink/60">${safe(error.message)}</p>
        <button data-action="retry" class="mt-4 rounded-lg bg-leaf px-4 py-2 font-semibold text-white">Try again</button>
      </div>`);
  }
}

// ---------- 7. SHOW THINGS ON THE PAGE ----------
function showStatus(html) {
  statusBox.innerHTML = html;
}

function showWelcome() {
  showStatus(`
    <div class="rounded-xl bg-carbon-black-900 p-8 text-center ring-1 ring-white/10">
      <p class="text-lg font-bold">Search for a GitHub username</p>
      <p class="mt-1 text-sm">You will see their profile, followers, and all their public repositories.</p>
    </div>`);
}

function formatDate(isoText) {
  return new Date(isoText).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function showRecent() {
  if (recent.length === 0) {
    recentBox.innerHTML = "";
    return;
  }
  // map(): one button for every recent name
  recentBox.innerHTML =
    `<span class="text-white/70">Recent:</span>` +
    recent
      .map((name) => `<button data-name="${safe(name)}" class="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20">${safe(name)}</button>`)
      .join("") +
    `<button data-action="clear-recent" class="px-2 text-white/70 underline">Clear</button>`;
}

function showProfile() {
  const user = currentUser;
  const savedNow = isSaved(user.login);

  profileBox.innerHTML = `
    <article class="rounded-xl bg-carbon-black-900 p-5 shadow-sm ring-1 ring-white/10">
      <img src="${user.avatar_url}" alt="Profile picture of ${user.login}" class="h-24 w-24 rounded-full">
      <h2 class="mt-4 text-2xl font-extrabold leading-tight">${safe(user.name || user.login)}</h2>
      <a href="${user.html_url}" target="_blank" rel="noopener" class="text-seaweed-300 underline">@${user.login}</a>
      <p class="mt-3 text-sm">${safe(user.bio) || "<span class='text-ink/60'>No bio yet.</span>"}</p>

      <dl class="mt-4 grid grid-cols-3 gap-2 text-center">
        <div class="rounded-lg bg-carbon-black-800 p-2"><dd class="text-lg font-extrabold">${user.public_repos}</dd><dt class="text-xs text-ink/60">Repos</dt></div>
        <div class="rounded-lg bg-carbon-black-800 p-2"><dd class="text-lg font-extrabold">${user.followers}</dd><dt class="text-xs text-ink/60">Followers</dt></div>
        <div class="rounded-lg bg-carbon-black-800 p-2"><dd class="text-lg font-extrabold">${user.following}</dd><dt class="text-xs text-ink/60">Following</dt></div>
      </dl>

      <ul class="mt-4 space-y-1 text-sm text-ink/80">
        ${user.location ? `<li>Location: ${safe(user.location)}</li>` : ""}
        ${user.company ? `<li>Company: ${safe(user.company)}</li>` : ""}
        <li>Joined: ${formatDate(user.created_at)}</li>
      </ul>

      <button data-action="toggle-save" aria-pressed="${savedNow}"
              class="mt-5 w-full rounded-lg px-4 py-2 font-semibold ${savedNow ? "bg-mint text-ink" : "bg-leaf text-white"}">
        ${savedNow ? "★ Saved" : "☆ Save profile"}
      </button>
    </article>`;
}

function showSavedList() {
  savedCount.textContent = saved.length;

  if (saved.length === 0) {
    savedList.innerHTML = `<li class="text-sm text-ink/70">Nothing saved yet. Open a profile and press Save.</li>`;
    return;
  }
  savedList.innerHTML = saved
    .map(
      (item) => `
      <li class="flex items-center gap-3">
        <img src="${item.avatar}" alt="" class="h-8 w-8 rounded-full">
        <button data-name="${safe(item.login)}" class="flex-1 text-left text-sm font-semibold">${safe(item.login)}</button>
        <button data-remove="${safe(item.login)}" class="px-2 text-ink/60" aria-label="Remove ${safe(item.login)}">✕</button>
      </li>`
    )
    .join("");
}

// fill the language drop-down using only the languages this user really uses
function fillLanguages() {
  const languages = [...new Set(currentRepos.map((repo) => repo.language).filter(Boolean))].sort();
  languageSelect.innerHTML =
    `<option value="all">All languages</option>` +
    languages.map((lang) => `<option value="${safe(lang)}">${safe(lang)}</option>`).join("");
}

function showRepos() {
  const text = repoSearch.value.trim().toLowerCase();
  const language = languageSelect.value;
  const sortBy = repoSort.value;

  // filter(): keep repos that match the name AND the language
  const result = currentRepos.filter((repo) => {
    const matchesName = repo.name.toLowerCase().includes(text);
    const matchesLanguage = language === "all" || repo.language === language;
    return matchesName && matchesLanguage;
  });

  // sort(): put them in the order the user picked
  if (sortBy === "updated") {
    result.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
  } else if (sortBy === "stars") {
    result.sort((a, b) => b.stargazers_count - a.stargazers_count);
  } else {
    result.sort((a, b) => a.name.localeCompare(b.name));
  }

  repoCount.textContent = `Showing ${result.length} of ${currentRepos.length} repositories`;

  // empty states
  if (currentRepos.length === 0) {
    repoList.innerHTML = `<p class="col-span-full rounded-xl bg-carbon-black-900 p-6 text-center ring-1 ring-white/10">${safe(currentUser.login)} has no public repositories yet.</p>`;
    return;
  }
  if (result.length === 0) {
    repoList.innerHTML = `
      <div class="col-span-full rounded-xl bg-carbon-black-900 p-6 text-center ring-1 ring-white/10">
        <p class="font-bold">No repository matches</p>
        <p class="mt-1 text-sm">Check the spelling or pick a different language.</p>
        <button data-action="clear-filters" class="mt-4 rounded-lg bg-leaf px-4 py-2 font-semibold text-white">Clear filters</button>
      </div>`;
    return;
  }

  // map(): turn every repo into a piece of HTML, then join them together
  repoList.innerHTML = result
    .map(
      (repo) => `
      <article class="flex flex-col rounded-xl bg-carbon-black-900 p-4 shadow-sm ring-1 ring-white/10">
        <h3 class="font-bold leading-tight">
          <a href="${repo.html_url}" target="_blank" rel="noopener" class="text-seaweed-300 underline">${safe(repo.name)}</a>
        </h3>
        <p class="mt-2 flex-1 text-sm">${safe(repo.description) || "<span class='text-ink/60'>No description.</span>"}</p>
        <p class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70">
          <span>${safe(repo.language) || "No language"}</span>
          <span>★ ${repo.stargazers_count}</span>
          <span>Forks ${repo.forks_count}</span>
          <span>Updated ${formatDate(repo.pushed_at)}</span>
        </p>
      </article>`
    )
    .join("");
}

function clearFilters() {
  repoSearch.value = "";
  languageSelect.value = "all";
  repoSort.value = "updated";
  showRepos();
}

// ---------- 8. LISTEN FOR CLICKS AND TYPING ----------
form.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the page from reloading
  const username = usernameInput.value.trim();
  if (username) searchUser(username);
});

repoSearch.addEventListener("input", showRepos);
languageSelect.addEventListener("change", showRepos);
repoSort.addEventListener("change", showRepos);

// Recent names and saved names: click one to search it
function handleNameClick(event) {
  const nameButton = event.target.closest("[data-name]");
  if (nameButton) {
    usernameInput.value = nameButton.dataset.name;
    searchUser(nameButton.dataset.name);
  }
}
recentBox.addEventListener("click", (event) => {
  handleNameClick(event);
  if (event.target.dataset.action === "clear-recent") {
    recent = [];
    writeList(RECENT_KEY, recent);
    showRecent();
  }
});
savedList.addEventListener("click", (event) => {
  handleNameClick(event);
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) toggleSaved(removeButton.dataset.remove);
});

// One listener for the buttons that are drawn later
profileBox.addEventListener("click", (event) => {
  if (event.target.dataset.action === "toggle-save") toggleSaved(currentUser.login);
});
statusBox.addEventListener("click", (event) => {
  if (event.target.dataset.action === "retry") searchUser(lastSearch);
});
repoList.addEventListener("click", (event) => {
  if (event.target.dataset.action === "clear-filters") clearFilters();
});

// ---------- 9. START ----------
showRecent();
showSavedList();
showWelcome();