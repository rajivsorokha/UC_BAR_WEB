// Rename the built index.html to app.html so static hosts (Vercel) don't serve it raw at "/".
// The Express server injects the page title / description into app.html on every request (good for SEO + link previews).
const fs = require('fs'), path = require('path');
const dist = path.join(__dirname, '..', 'client', 'dist');
const from = path.join(dist, 'index.html'), to = path.join(dist, 'app.html');
if (fs.existsSync(from)) { fs.renameSync(from, to); console.log('postbuild: index.html -> app.html'); }
