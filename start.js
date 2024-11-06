const { exec } = require('child_process');

function startServer() {
  console.log('Starting the Node.js server...');
  const server = exec('node app.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing server: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });

  server.on('close', (code) => {
    console.log(`Server stopped with code ${code}. Restarting...`);
    setTimeout(startServer, 1000);
  });
}

startServer();
