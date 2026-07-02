import fs from 'fs';
import https from 'https';
import path from 'path';

const commit = 'f6b19159219d5f52708bc50e2050d5d86a9294ef';
const files = [
  'src/App.tsx',
  'src/components/Auth.tsx',
  'src/components/Avatar.tsx',
  'src/components/Board.tsx',
  'src/components/Dashboard.tsx',
  'src/components/FilterBar.tsx',
  'src/components/IssueList.tsx',
  'src/components/IssueModal.tsx',
  'src/components/NotificationCenter.tsx',
  'src/components/Sidebar.tsx',
  'src/components/ThemeToggle.tsx',
  'src/components/TutorialGuide.tsx',
  'src/components/UsersManagement.tsx',
  'src/firebase.ts',
  'src/index.css',
  'src/main.tsx',
  'src/services/api.ts',
  'src/types.ts',
  'package.json',
  'vite.config.ts'
];

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const file of files) {
    const url = `https://raw.githubusercontent.com/Fareed04/erp-issue-tracker/${commit}/${file}`;
    console.log(`Downloading ${file}...`);
    await download(url, file);
  }
  console.log('Done!');
}

run();
