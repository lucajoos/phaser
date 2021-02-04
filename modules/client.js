const { ipcMain } = require('electron');
const fs = require('fs');
const io = require('socket.io-client');
const path = require('path');

let events = require('onceupon.js')();

module.exports = window => {
  let options = {
    faders: [],
    ip: ''
  };

  let write = () => {
    try {
      fs.writeFileSync(path.resolve('options.json'), JSON.stringify(options));
    } catch(e) {
      console.error(e);
    }
  }

  let socket;

  events.on('init', () => {
    socket = io(options.ip);

    socket.on('connect', () => {
      events.fire('ready');
      window?.webContents.send('main-connected');
    });
  });

  ipcMain.on('client-window-minimize', event => {
    window.minimize();
    event.reply('main-resize');
  });

  ipcMain.on('client-window-maximize', event => {
    window.isMaximized() ? window.setSize(1200, 830) : window.maximize();
    event.reply('main-resize');
  });

  ipcMain.on('client-window-close', () => {
    window.close();
  });

  ipcMain.on('client-fetch', event => {
    event.reply('main-fetch-response', options);
  });

  ipcMain.on('client-init', (event, data) => {
    if(typeof data === 'string') {
      if(!data.startsWith('ws://')) {
        data = `ws://${data}`;
      }

      if(!data.endsWith(':3787')) {
        data = `${data}:3787`;
      }

      options.ip = data;
      events.fire('init');
      write();
    }
  });

  ipcMain.on('client-change', (event, data) => {
    events.once('ready', () => {
      socket.emit('emit', data.join(':'));
    });
  });

  ipcMain.on('client-create', (event, data) => {
    options.faders.push(data);
    write();
  });

  ipcMain.on('client-delete', (event, data) => {
    options.faders = options.faders.filter(target => {
      return JSON.stringify(target) !== JSON.stringify(data);
    });

    write();
  });

  try {
    if(fs.existsSync(path.resolve('options.json'))) {
      let data = fs.readFileSync(path.resolve('options.json'), { encoding: 'utf-8' }).toString();

      if(data?.length > 0) {
        options = JSON.parse(data);
        events.fire('init');
      }
    }
  } catch(e) {
    console.error(e);
  }

  window.loadFile('public/index.html');
}