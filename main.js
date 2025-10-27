const { Command } = require('commander');
const http = require('http');
const fsSync = require('fs');

const program = new Command();

program
  .requiredOption('-h, --host <type>', 'server address (required)')
  .requiredOption('-p, --port <type>', 'server port (required)')
  .requiredOption('-c, --cache <type>', 'cache directory path (required)')
program.parse();
const options = program.opts();

if (!fsSync.existsSync(options.cache)) {
  fsSync.mkdirSync(options.cache, { recursive: true });
  console.log(`Cache directory created: ${options.cache}`);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Proxy server is running!\n');
});

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
});