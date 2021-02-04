const { ipcRenderer } = require('electron');

let connected = false;
let options;

let fader = options => {
  let faders = document.querySelector('.faders');
  let f = document.createElement('div');
  f.classList.add('fader');
  let fc = document.createElement('div');
  fc.classList.add('fader-container');
  let fci = document.createElement('i');
  fci.classList.add('fas');
  fci.classList.add('fa-times');
  let fcr = document.createElement('input');
  fcr.setAttribute('type', 'range');
  fcr.setAttribute('min', '0');
  fcr.setAttribute('max', '127');
  let fm = document.createElement('div');
  fm.classList.add('fader-meta');
  let fms = document.createElement('span');
  fms.innerText = options.name;

  fc.appendChild(fci);
  fc.appendChild(fcr);
  fm.appendChild(fms);
  f.appendChild(fc);
  f.appendChild(fm);

  fcr.addEventListener('input', e => {
    if(connected) {
      ipcRenderer.send('client-change', ['002', options.channel.toString().padStart(3, '0'), options.id.toString().padStart(3, '0'), e.target.value.toString().padStart(3, '0')]);
    }
  });

  fci.addEventListener('click', () => {
    if(f.classList.contains('visible')) {
      f.classList.remove('visible');
    }

    setTimeout(() => {
      f.remove();
    }, 550);

    ipcRenderer.send('client-delete', options);
  });

  faders.appendChild(f);

  fcr.setAttribute('style', `width: ${fc.clientHeight - 80}px;`);
  f.classList.add('visible');

  document.body.scroll({left: document.querySelector('body > div > div.container').scrollWidth - window.innerWidth, top: 0, behavior: 'smooth'});
};

let modalIsOpened = false;

let resize = (transition=0) => {
  [...document.querySelectorAll('.fader > .fader-container > input')].forEach(target => {
    if(transition > 0) {
      let s = target?.getAttribute('style');
      target?.setAttribute('style', `transition: width ${transition}ms;`);

      setTimeout(() => {
        target?.setAttribute('style', s);
      }, transition);
    }

    target?.setAttribute('style', `width: ${target?.parentElement?.clientHeight - 80}px;`);
  });
}

let modal = state => {
  let curtain = document.querySelector('.curtain');
  let modal = document.querySelector('.modal');

  if(state) {
    if(!curtain.classList.contains('visible')) {
      curtain.classList.add('visible');
    }

    if(!modal.classList.contains('visible')) {
      modal.classList.add('visible');
    }
  } else {
    if(curtain.classList.contains('visible')) {
      curtain.classList.remove('visible');
    }

    if(modal.classList.contains('visible')) {
      modal.classList.remove('visible');
    }
  }

  modalIsOpened = state;
}

let init = () => {
  let container = document.querySelector('.modal > .modal-container');
  let i = document.createElement('i');
  i.classList.add('fas');
  i.classList.add('fa-times');
  let h = document.createElement('h1');
  h.innerText = 'Connect to server';
  let y = document.createElement('input');
  y.setAttribute('type', 'text');
  y.setAttribute('placeholder', 'IP');
  let a = document.createElement('a');
  a.setAttribute('href', '#');
  a.classList.add('button');
  a.innerText = 'Connect';

  if(options?.ip?.length > 0) {
    y.value = options.ip;
  }

  [...container?.children].forEach(child => {
    child?.remove();
  });

  i.addEventListener('click', () => {
    modal(false);
  });

  a.addEventListener('click', () => {
    let input = document.querySelector('.modal > div > input');

    if(modalIsOpened && input?.value?.length > 0) {
      modal(false);

      options.ip = input.value;
      ipcRenderer.send('client-init', input.value);
    }
  });

  container.appendChild(i);
  container.appendChild(h);
  container.appendChild(y);
  container.appendChild(a);

  modal(true);
}

window.addEventListener('load', () => {
  document.querySelector('.navigation-left > i').addEventListener('click', () => {
    init();
  });

  ipcRenderer.on('main-resize', () => {
    resize();
  });

  ipcRenderer.send('client-fetch');

  ipcRenderer.on('main-fetch-response', (event, data) => {
    if(data?.ip.length === 0) {
      init();
    }

    data?.faders.forEach(target => {
      fader(target);
    });

    options = data;
  });

  ipcRenderer.on('main-connect', () => {
    connected = true;

    document.querySelector('.navigation-left > span').innerText = 'connected';

    if(document.querySelector('.navigation-left > i').classList.contains('fa-link')) {
      document.querySelector('.navigation-left > i').classList.remove('fa-link');
      document.querySelector('.navigation-left > i').classList.add('fa-pen');
    }

    console.log('CONNECTED')
  });

  ipcRenderer.on('main-disconnect', () => {
    connected = false;

    document.querySelector('.navigation-left > span').innerText = 'disconnected';

    if(document.querySelector('.navigation-left > i').classList.contains('fa-pen')) {
      document.querySelector('.navigation-left > i').classList.remove('fa-pen');
      document.querySelector('.navigation-left > i').classList.add('fa-link');
    }

    console.log('DISCONNECTED')
  });

  document.querySelector('.curtain').addEventListener('click', () => {
    modal(false);
  });

  document.querySelector('.container > i.fas.fa-plus').addEventListener('click', () => {
    let container = document.querySelector('.modal > .modal-container');
    let i = document.createElement('i');
    i.classList.add('fas');
    i.classList.add('fa-times');
    let h = document.createElement('h1');
    h.innerText = 'Create new fader';
    let yn = document.createElement('input');
    yn.setAttribute('type', 'text');
    yn.setAttribute('placeholder', 'Name');
    let yc = document.createElement('input');
    yc.setAttribute('type', 'number');
    yc.setAttribute('placeholder', 'Channel');
    let yi = document.createElement('input');
    yi.setAttribute('type', 'number');
    yi.setAttribute('placeholder', 'ID');
    let a = document.createElement('a');
    a.setAttribute('href', '#');
    a.classList.add('button');
    a.innerText = 'Create';

    i.addEventListener('click', () => {
      modal(false);
    });

    a.addEventListener('click', () => {
      let inputs = [...document.querySelectorAll('.modal > div > input')];

      if(
          modalIsOpened &&
          inputs.every(target => {
            return target?.value?.length > 0
          })
      ) {
        modal(false);

        let options = {
          name: inputs[0].value,
          channel: inputs[1].value,
          id: inputs[2].value
        };

        ipcRenderer.send('client-create', options);

        setTimeout(() => {
          fader(options);
        }, 300);
      }
    });

    [...container?.children].forEach(child => {
      child?.remove();
    });

    container.appendChild(i);
    container.appendChild(h);
    container.appendChild(yn);
    container.appendChild(yc);
    container.appendChild(yi);
    container.appendChild(a);

    modal(true);
  });

  document.querySelector('.navigation > .navigation-right > i.fas.fa-window-minimize').addEventListener('click', () => {
    ipcRenderer.send('client-window-minimize');
  });

  document.querySelector('.navigation > .navigation-right > i.fas.fa-window-maximize').addEventListener('click', () => {
    ipcRenderer.send('client-window-maximize');
  });

  document.querySelector('.navigation > .navigation-right > i.fas.fa-times').addEventListener('click', () => {
    ipcRenderer.send('client-window-close');
  });
});