const { Command } = require('commander');
const http = require('http');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const superagent = require('superagent');

const program = new Command();
program
  .requiredOption('-h, --host <type>', 'server address')
  .requiredOption('-p, --port <type>', 'server port') 
  .requiredOption('-c, --cache <type>', 'cache directory path');
program.parse();
const options = program.opts();

//ініціалізація кеш директорії
if (!fsSync.existsSync(options.cache)) {
   fsSync.mkdirSync(options.cache, { recursive: true });
   console.log(`Cache directory created: ${options.cache}`);
}

//створення HTTP сервера
const server = http.createServer(async function(req, res) {
  const httpCode = req.url.split('/')[1];
  const imagePath = path.join(options.cache, `${httpCode}.jpg`);
  try {
    switch (req.method) {
      case 'GET':
        //отримання картинки - спочатку з кешу, потім з інтернету
        try {
          const image = await fs.readFile(imagePath);
          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          res.end(image);
        } catch (error) {
          if (error.code === 'ENOENT') {
            try {
              const response = await superagent
                .get(`https://http.cat/${httpCode}.jpg`)
                .buffer(true);
              const imageBuffer = response.body;
              
              await fs.writeFile(imagePath, imageBuffer);
              res.writeHead(200, { 'Content-Type': 'image/jpeg' });
              res.end(imageBuffer);
            } catch (httpCatError) {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('Not Found');
            }
          } else {
            throw error;
          }
        }
        break;
        
      case 'PUT':
        //завантаження картинки на сервер
        let putBody = [];
        req.on("data", function(chunk) {
          putBody.push(chunk);
        });
        req.on("end", async function() {
          try {
            const putImageData = Buffer.concat(putBody);
            await fs.writeFile(imagePath, putImageData);
            res.writeHead(201, { 'Content-Type': 'text/plain' });
            res.end('Created');
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Server Error');
          }
        });
        break;
        
      case 'DELETE':
        //видалення картинки з кешу
        try {
          await fs.unlink(imagePath);
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('OK');
        } catch (error) {
          if (error.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          } else {
            throw error;
          }
        }
        break;
        
      default:
        //обробка недозволених методів
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    }
  } catch (error) {
    //загальна обробка помилок сервера
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

//запуск сервера
server.listen(options.port, options.host, function() {
  console.log(`Server running at http://${options.host}:${options.port}`);
  console.log(`Cache directory: ${options.cache}`);
});

//обробка помилок сервера
server.on('error', function(error) {
  console.error('Server error:', error.message);
  process.exit(1);
});