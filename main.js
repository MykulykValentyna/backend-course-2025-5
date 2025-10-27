const { Command } = require('commander');
const http = require('http');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const program = new Command();
program
  .requiredOption('-h, --host <type>', 'server address (required)')
  .requiredOption('-p, --port <type>', 'server port (required)')
  .requiredOption('-c, --cache <type>', 'cache directory path (required)');
program.parse();
const options = program.opts();

if (!fsSync.existsSync(options.cache)) {
  fsSync.mkdirSync(options.cache, { recursive: true });
}

const server = http.createServer(async (req, res) => {
  const urlCode = req.url.slice(1);
  const imagePath = path.join(options.cache, `${urlCode}.jpg`);
  
  if (req.method === 'GET') {
    try {
      const image = await fs.readFile(imagePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(image);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found\n');
    }
  } else if (req.method === 'PUT') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    await fs.writeFile(imagePath, Buffer.concat(chunks));
    res.writeHead(201, { 'Content-Type': 'text/plain' });
    res.end('Created\n');
  } else if (req.method === 'DELETE') {
    try {
      await fs.unlink(imagePath);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK\n');
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found\n');
    }
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed\n');
  }
});

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
});