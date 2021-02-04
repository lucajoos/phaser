const SerialPort = require('serialport');
const http = require('http').createServer();
let server = require('socket.io')(http);

SerialPort.list().then(d => {
  let port = new SerialPort(d[0].path, {
    baudRate: 9600
  });

  port.on('data', function (data) {
    console.log(data.toString())
  })

  server.on('connection', socket => {
    socket.on('emit', data => {
      port.write(data?.toString());
    })
  });

  window.loadFile('public/server/main/index.html');
});

http.listen(3787);