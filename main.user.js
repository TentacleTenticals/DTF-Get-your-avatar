// ==UserScript==
// @name        DTF-Get your avatar
// @namespace   https://github.com/TentacleTenticals/
// @match       https://dtf.ru/*
// @grant       none
// @version     1.0
// @author      Tentacle Tenticals
// @description Скрипт для показа и получения аватарок и фонов пользователей
// @homepage    https://github.com/TentacleTenticals/DTF-Get-your-avatar
// @updateURL   https://github.com/TentacleTenticals/DTF-Get-your-avatar/raw/master/main.user.js
// @downloadURL https://github.com/TentacleTenticals/DTF-Get-your-avatar/raw/master/main.user.js
//
// @require     https://github.com/TentacleTenticals/dtf-libs-2.0/raw/main/libs/splitCls/div_btn_img_vid_a_css.js
// @license MIT
// ==/UserScript==
/* jshint esversion:8 */

(() => {
  window.addEventListener('load', run);
  function run(){
  const vars = {
    cfg: {
      mode: 'click', // Режим скрипта. button/click/hover/timer
      'close after': {// Закрыть после
        'btnUp': true, // отпускания кнопки
        'hoverOut': true // увода курсора с аватарки
      },
      'close menu after': {// Закрыть меню после
        'btnUp': true
      },
      buttons: {
        showImg: 'Control', // Кнопка показа аватарки. Control/Shift/Alt
        showSrchMenu: 'Shift', //  Кнопка показа поискового меню
        copyUrl: 'Alt',
        get btnFilter(){
          return new RegExp(`${this.showImg}|${this.showSrchMenu}|${this.copyUrl}`);
        },
        'click mode': {
          copyUrl: 'altKey' // Кнопка копирования ссылки в буфер обмена для 'click' режима скрипта. shiftKey/ctrlKey/altKey
        }
      },
      timers: {// Таймеры для режима 'timer'.
        alert: 2000, // алерт
        hover: {
          'for menu': 2000, // для меню. Не используется...пока что.
          'for image': 2000 // для аватарки
        }
      },
      filters: {
        'comment avatar': 'comment__avatar__image',
        'subsite avatar': 'subsite-card__avatar',
        'user page avatar': 'v-header-avatar',
        'user page cover': 'v-header-cover',
        'user page subscribers': 'v-list__image',
        'topic author header avatar': 'content-header-author__avatar',
        'comment panel avatar': document.querySelector(`.layout__right-column div[style^='background-image']`) ? document.querySelector(`.layout__right-column div[style^='background-image']`).className : '',
        // 'comment panel image': document.querySelector(`.layout__right-column div[style^='background-image']`) ? document.querySelector(`.layout__right-column div[style^='background-image']`).className : ''
      },
      get regex(){
        return new RegExp(Object.values(this.filters).filter(e => e).join('|'));
      },
      searches: [// Список поисковиков.
        {url:'http://saucenao.com/search.php?db=999&url=', name:'Saucenao', use:true},
        {url:'https://www.bing.com/images/search?view=detailv2&iss=sbi&FORM=SBIHMP&sbisrc=UrlPaste&q=imgurl:', name:'Bing', use:true},
        {url:`https://www.google.com/searchbyimage?sbisrc=4chanx&safe=off&image_url=`, name:'Google', use:true},
        {url:'https://lens.google.com/uploadbyurl?url=', name:'Google Lens', use:true},
        {url:'https://yandex.ru/images/search?rdrnd=296405&rpt=imageview&url=', name:'Yandex', use:true},
        {url:'http://tineye.com/search/?url=', name:'TinEye', use:true},
        {url:'http://iqdb.org/?url=', name:'IQDB', use:true}
      ]
    },
    btnPressed: {}
  };

  let css = `
  .v-header__avatar {
    width: max-content;
    height: max-content;
  }

  .avatarPreview {
    display: inline-flex;
    position: absolute;
    background-color: rgb(0 0 0);
    width: 200px;
    height: 200px;
    padding: 3px;
    top: 100px;
    left: 5px;
    box-shadow: 0 0 4px 0px rgb(0 0 0);
    z-index: 10;
  }
  .avatarPreview :is(img, video) {
    max-width: 100%;
    max-height: 100%;
    margin: auto;
  }

  .avatarPreview.s-${vars.cfg.filters['comment avatar']} {
    margin: 5px 0 0 0;
    width: 200px;
    aspect-ratio: 1/1;
  }
  .avatarPreview.s-${vars.cfg.filters['subsite avatar']} {
    margin: 10px 0 0 0;
    width: 200px;
    aspect-ratio: 1/1;
  }
  .avatarPreview.s-${vars.cfg.filters['topic author header avatar']} {
    margin: 5px 0 0 0;
    width: 200px;
    aspect-ratio: 1/1;
  }
  .avatarPreview.s-${vars.cfg.filters['user page cover']} {
    margin: 30px 0 0 0;
    width: 300px;
    aspect-ratio: 1/0.5;
  }
  .avatarPreview.s-${vars.cfg.filters['user page avatar']} {
    margin: 10px 0 0 0;
    width: 200px;
    aspect-ratio: 1/1;
  }
  .avatarPreview.s-${vars.cfg.filters['comment panel avatar']} {
    margin: 10px 0 0 0;
    width: 200px;
    aspect-ratio: 1/1;
  }

  .dtf-menu {
    display: flex;
    flex-direction: column;
    background-color: rgb(0 0 0);
    position: absolute;
    top: 40px;
    margin: 10px 0 0 0;
    padding: 5px;
    border-radius: 2px;
    outline: none;
    z-index: 100;
    box-shadow: 0 0 4px 0px rgb(0 0 0);
  }
  .dtf-menu .header {
    background-color: rgb(88 44 78);
    color: rgb(255 255 255);
  }

  .dtf-menu .list {
    display: flex;
    flex-direction: column;
    margin: 6px 0 0 0;
    gap: 5px 0;
  }

  .dtf-menu .list button {
    background-color: rgb(44 44 44);
    color: rgb(255 255 255);
    font-size: 14px;
    outline: none;
    cursor: pointer;
  }
  .dtf-menu .list button:hover {
    filter: brightness(1.3);
  }

  .avatarAlert {
    position: absolute;
    background-color: rgb(165 235 189);
    border-radius: 2px;
    margin: 5px 0 0 0;
    padding: 3px;
    color: rgb(0 0 0);
    font-size: 12px;
    line-height: 12px;
    font-weight: 500;
    box-shadow: 0px 0px 4px 0px rgb(0 0 0);
    z-index: 100;
  }`;
  new El().Css('DTF-Avatar Getter', css);
  class Avatar{
    getImg(cls, t){
      const avFilter = /(?:url\(")*(http(?:s):\/\/[^/]+\/[^/]+)(?:.+)/;
      return (() => {
        switch (cls.match(vars.cfg.regex)?.[0]) {
          case vars.cfg.filters['comment avatar']:
          return t.children[0].src;
          case vars.cfg.filters['subsite avatar']:
          return t.style.backgroundImage;
          case vars.cfg.filters['user page avatar']:
          return t.style.backgroundImage;
          case vars.cfg.filters['user page cover']:
          return t.style?.backgroundImage;
          case vars.cfg.filters['user page subscribers']:
          return t.style?.backgroundImage;
          case vars.cfg.filters['topic author header avatar']:
          return t.children[0].src;
          case vars.cfg.filters['comment panel avatar']:
          return t.style.backgroundImage;
        }
      })()?.replace(avFilter, '$1');
    }
    build(t, type, video){
      if(document.getElementById('dtf-avatarPreview')) return;
      this.main=new El().Div({
        path: document.body,
        cName: `avatarPreview s-${type}`,
        id: 'dtf-avatarPreview',
        tab: -1,
        style: `
        top: ${t.getBoundingClientRect().top + (window.scrollY||window.scrollHeight||0) + t.getBoundingClientRect().height}px;
        left: ${t.getBoundingClientRect().left}px`,
        rtn: [],
        onblur: () => {
          this.main.remove();
        }
      });
      if(!video) new El().Image({
        path: this.main,
        url: this.getImg(t.classList.value, t)?.replace(this.avFilter, '$1')
      });
      else
      new El().Video({
        path: this.main,
        url: this.getImg(t.classList.value, t)?.replace(this.avFilter, '$1'),
        autoplay: true,
        loop: true
      });
      this.main.focus();
    }
    srchMenu(t, type){
      if(document.getElementById('dtf-avatarSearchMenu')) return;
      function search({path, name, url}){
        new El().Button({
          path: path,
          text: name,
          onclick: () => {
            window.open(url, '_blank');
            document.activeElement.blur();
          }
        });
      }
      this.main=new El().Div({
        path: document.body,
        cName: 'dtf-menu',
        id: 'dtf-avatarSearchMenu',
        tab: -1,
        rtn: [],
        style: `top: ${t.getBoundingClientRect().top + (window.scrollY||window.scrollHeight||0) + t.getBoundingClientRect().height}px;
        left: ${t.getBoundingClientRect().left}px`,
        onblur: () => {
          setTimeout(() => {
            this.main.remove();
          }, 1000);
        }
      });
      this.header=new El().Div({
        path: this.main,
        cName: 'header',
        text: 'Меню поиска'
      });

      this.list=new El().Div({
        path: this.main,
        cName: 'list',
        rtn: []
      });
      vars.cfg.searches.forEach(e => {
        if(e.use) search({
          path: this.list,
          name: e.name,
          url: `${e.url}${this.getImg(t.classList.value, t)?.replace(this.avFilter, '$1')}`
        });
      });
      this.main.focus();
    }
    write(cls, t){
      new Promise((res, err) => {
        res(this.getImg(cls, t));
      }).then(res => {
        if(res){
          navigator.clipboard.writeText(res);
          if(document.getElementById('dtf-avatarAlert')) return;
          let alert=new El().Div({
            path: document.body,
            cName: 'avatarAlert',
            id: 'dtf-avatarAlert',
            text: 'Ссылка успешно скопирована в буфер обмена',
            rtn: [],
            style: `top: ${t.getBoundingClientRect().top + (window.scrollY||window.scrollHeight||0) + t.getBoundingClientRect().height}px;
            left: ${t.getBoundingClientRect().left}px`
          });
          setTimeout(() => {
            alert.remove();
          }, vars.cfg.timers.alert);
        }
      }).catch(err => console.log(err));
    }
  }
  if(vars.cfg.mode.match(/button|hover|timer/)){
    document.onmouseover = (e) => {
      if(document.activeElement && document.activeElement.id === 'dtf-avatarSearchMenu') return;
      if(!e.target.className){
        if(!e.target.nodeName === 'VIDEO') return;
        if(!e.target.parentNode.className) return;
        if(!e.target.parentNode.classList.value.match(vars.cfg.filters['user page cover'])) return;
        vars.hovered = e.target.parentNode;
        if(vars.cfg.mode === 'hover') new Avatar().build(e.target.parentNode, e.target.parentNode.className.split(' ')[0], true);
        else
        if(vars.cfg.mode === 'timer') vars.timer = setTimeout(() => {
          if(document.activeElement && document.activeElement.id === 'dtf-avatarSearchMenu') return;
          new Avatar().build(e.target.parentNode, e.target.parentNode.className.split(' ')[0], true);
        }, vars.cfg.timers.hover['for image']);
      }else{
        if(!e.target.classList.value.match(vars.cfg.regex)) return;
        vars.hovered = e.target;
        if(vars.cfg.mode === 'hover') new Avatar().build(e.target, e.target.className.split(' ')[0]);
        else
        if(vars.cfg.mode === 'timer') vars.timer = setTimeout(() => {
          if(document.activeElement && document.activeElement.id === 'dtf-avatarSearchMenu') return;
          new Avatar().build(e.target, e.target.className.split(' ')[0]);
        }, vars.cfg.timers.hover['for image']);
      }
    };
    document.onmouseout = (e) => {
      vars.hovered = false;
      if(vars.cfg.mode === 'timer'){
        if(vars.timer) clearTimeout(vars.timer);
      }
      if(!document.activeElement.id) return;
      if(vars.cfg.mode.match(/button|hover|timer/)){
        if(vars.cfg['close after']['hoverOut']){
          if(document.activeElement.id === 'dtf-avatarPreview') document.activeElement.blur();
        }
      }
    };

    document.onkeydown = (e) => {
      if(!vars.hovered) return;
      if(!e.code.match(vars.cfg.buttons.btnFilter)) return;
      else{
        e.preventDefault();
        e.stopImmediatePropagation();
        vars.btnPressed[e.code.match(vars.cfg.buttons.btnFilter)[0]] = true;
      };

      if(vars.cfg.mode === 'button'){
        if(vars.btnPressed[vars.cfg.buttons.showImg]) new Avatar().build(vars.hovered, vars.hovered.className.split(' ')[0]);
        if(vars.btnPressed[vars.cfg.buttons.copyUrl]) new Avatar().write(vars.hovered.classList.value, vars.hovered);
        if(vars.btnPressed[vars.cfg.buttons.showSrchMenu]) new Avatar().srchMenu(vars.hovered, vars.hovered.className.split(' ')[0]);
      }else
      if(vars.cfg.mode.match(/hover|timer/)){
        // if(document.activeElement && document.activeElement.id === 'dtf-avatarPreview') return;
        if(vars.btnPressed[vars.cfg.buttons.copyUrl]) new Avatar().write(vars.hovered.classList.value, vars.hovered);
        if(vars.btnPressed[vars.cfg.buttons.showSrchMenu]) new Avatar().srchMenu(vars.hovered, vars.hovered.className.split(' ')[0]);
      }
    };
    document.onkeyup = (e) => {
      if(e.code.match(vars.cfg.buttons.btnFilter)) vars.btnPressed[e.code.match(vars.cfg.buttons.btnFilter)[0]] = false;

      if(vars.cfg.mode !== 'button') return;
      if(!document.activeElement.id) return;
      if(!e.code.match(vars.cfg.buttons.btnFilter)) return;
      if(e.code === vars.cfg.buttons.showImg && vars.cfg['close after']['btnUp']){
        if(document.activeElement.id === 'dtf-avatarPreview') document.activeElement.blur();
      }
      if(e.code === vars.cfg.buttons.showSrchMenu && vars.cfg['close menu after']['btnUp']){
        if(document.activeElement.id === 'dtf-avatarSearchMenu') document.activeElement.blur();
      }
    };
  };

  if(vars.cfg.mode === 'click'){
    document.body.onclick = (e) => {
      if(!e.button === 0) return;
      if(!e.target.className){
        if(e.target.nodeName !== 'VIDEO') return;
        if(!e.target.parentNode.className) return;
        if(!e.target.parentNode.classList.value.match(vars.cfg.filters['user page cover'])) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if(!e.shiftKey && !e.ctrlKey && !e.altKey) new Avatar().build(e.target.parentNode, e.target.parentNode.className.split(' ')[0], true);
        if(e[vars.cfg.buttons['click mode'].copyUrl]) new Avatar().write(e.target.parentNode.classList.value, e.target.parentNode);
      }else{
        if(!e.target.classList.value.match(vars.cfg.regex)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if(!e.shiftKey && !e.ctrlKey && !e.altKey && !e.target.classList.value.match(vars.cfg.filters['user page avatar'])) new Avatar().build(e.target, e.target.className.split(' ')[0]);
        if(e[vars.cfg.buttons['click mode'].copyUrl]) new Avatar().write(e.target.classList.value, e.target);
      }
    }
    document.oncontextmenu = (e) => {
      if(!e.button === 2) return;
      if(!e.target.className){
        if(e.target.nodeName !== 'VIDEO') return;
        if(!e.target.parentNode.className) return;
        if(!e.target.parentNode.classList.value.match(vars.cfg.filters['user page cover'])) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        new Avatar().srchMenu(e.target.parentNode, e.target.parentNode.className.split(' ')[0]);
      }else{
        if(!e.target.classList.value.match(vars.cfg.regex)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        new Avatar().srchMenu(e.target, e.target.className.split(' ')[0]);
      }
    }
  }

  }
})();
