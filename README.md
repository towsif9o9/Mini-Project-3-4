# GitHub Profile Finder

Type a GitHub username to see the profile (avatar, bio, followers) and every public repository. Search and filter the repos, and save profiles to come back to later.

Built with HTML, Tailwind CSS (CDN) and plain JavaScript, using the [GitHub REST API](https://docs.github.com/en/rest). Mini Project 3-4, CSE-2340 Software Development I, IIUC.

## Features
- Search any GitHub username
- Filter repositories by name and language, and sort by updated date, stars or name
- Save profiles and see recent searches - both are still there after a refresh (localStorage)
- Welcome, loading, error (with Try again) and empty states

## Run it
Open `index.html` in a browser. An internet connection is needed for the API, Tailwind and the font.

Note: GitHub allows 60 requests per hour without a login, and each search uses 2 requests.

## Where each requirement is in `script.js`
| Requirement | Where |
|---|---|
| DOM manipulation | `showProfile()`, `showRepos()`, `showSavedList()`, `showRecent()` |
| Events | Section 8, `addEventListener` |
| Array methods | `filter`, `map`, `some`, `sort`, `slice` |
| fetch + async/await | `searchUser()` |
| Loading / error / empty states | `searchUser()`, `showWelcome()`, `showRepos()` |
| localStorage | Section 4 |
