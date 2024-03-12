# This is a template repository 
This is a template repository for [Obsidian](https://obsidian.md) plugins.

# Features
- Linting Setup
- Testing Setup with Jest
- Auto Version bump
- Auto Version update

# Getting started
- Clone this repo.
- Make sure your NodeJS is at least v16 (node --version).
- npm i or yarn to install dependencies.
- npm run dev to start compilation in watch mode.

## Need to change 
### [package.json](https://github.com/4Source/obsidian-plugin-template/blob/caf33126008642a2be32e3696f1cba34b04657fd/package.json)
- name
- description
- author
- license (optional)
### [manifest.json](https://github.com/4Source/obsidian-plugin-template/blob/caf33126008642a2be32e3696f1cba34b04657fd/manifest.json)
- id
- name
- description
- author
- authorUrl
- fundingUrl
- minAppVersion (optional)
- isDesktopOnly (optional)
### [LICENSE](https://github.com/4Source/obsidian-plugin-template/blob/caf33126008642a2be32e3696f1cba34b04657fd/LICENSE) (optional)
### [.github/workflows/cd.yml](https://github.com/4Source/obsidian-plugin-template/blob/caf33126008642a2be32e3696f1cba34b04657fd/.github/workflows/cd.yml)
versioning > Configure git
```
git config --global user.name "YOUR-USER"
git config --global user.email "YOUR-EMAIL"
```
## Need to add
### New labels
- ``major``
- ``minor``
- ``patch``

# Usage
1. Create feature branch
2. Make changes
3. Push feature branch
4. Create pull request
5. Add desired [label](#new-labels) to pull request
6. Merge pull request
7. Publish draft release
