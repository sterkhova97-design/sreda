
const PRODUCTS = window.SREDA_PRODUCTS;
const VISUALS = window.SREDA_VISUALS;
const STORIES = [
  {title:'Топ 10 диванов', image:'assets/stories/top10-divany.webp'},
  {title:'Новинки Gessi', image:'assets/stories/novinki-gessi.jpeg'},
  {title:'Isaloni', image:'assets/stories/isaloni.jpg'},
  {title:'Выставка интерьера Москва', image:'assets/stories/vystavka-moskva.jpg'}
];

const CATEGORIES = ['Все','Мягкая мебель','Стулья','Столы','Освещение','Напольные покрытия','Настенные покрытия','Декор','Радиаторы','Корпусная мебель','Сантехника','Ткани'];

let route='home', selectedCategory='Все', currentProduct=null, currentChat='Nube';
let profileRole='designer', profileTab='projects', currentProject=null, selectMode=false;
let favorites=new Set(JSON.parse(localStorage.getItem('sreda:favorites')||'[]'));
let messages=JSON.parse(localStorage.getItem('sreda:messages')||'[]');
let filters={availability:'Все',category:'Все',material:'Все',color:'Все',sort:'Сначала новые',minPrice:0,maxPrice:2000000};

let specData={
 'Квартира на Патриках':{
   'Гостиная':[{id:'nube',qty:1,status:'Согласование',conf:'Букле Cream · 240 × 105 см'},{id:'dominique',qty:1,status:'Расчёт',conf:'Латунь · стандарт'}],
   'Спальня':[{id:'shad',qty:1,status:'Производство',conf:'Велюр Olive · 180×200'},{id:'terra',qty:2,status:'Ожидает оплаты',conf:'Молочная керамика'}],
   'Ванная':[{id:'fima5801',qty:1,status:'Согласование',conf:'Нержавеющая сталь'}]
 },
 'Дом в Подмосковье':{
   'Гостиная':[{id:'sora',qty:1,status:'Доставка',conf:'Букле Cocoa · 310 × 125 см'},{id:'vista',qty:1,status:'Производство',conf:'Индивидуальный размер'}],
   'Спальня':[{id:'crona',qty:1,status:'Расчёт',conf:'Велюр Cognac · 200×200'}]
 },
 'Офисное пространство':{
   'Переговорная':[{id:'core',qty:4,status:'Отгружено',conf:'Кожа Black / дуб Black'}],
   'Лаунж':[{id:'form',qty:2,status:'Завершено',conf:'Букле Snow · 260 × 100 см'}]
 }
};

const HISTORY={
  nube:[
    ['10.08.2026','Добавлен в спецификацию','Гостиная · Квартира на Патриках'],
    ['10.08.2026','Отправлен запрос на расчёт','Поставщик получил конфигурацию товара'],
    ['11.08.2026','Получен расчёт','497 000 ₽ · срок 6–8 недель'],
    ['12.08.2026','Статус изменён','Согласование']
  ],
  shad:[
    ['08.08.2026','Добавлен в спецификацию','Спальня · Квартира на Патриках'],
    ['09.08.2026','Согласован размер','Спальное место 180×200'],
    ['10.08.2026','Оплата подтверждена','Передан в производство'],
    ['10.08.2026','Статус изменён','Производство']
  ]
};

document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>go(b.dataset.route));

function money(n){return new Intl.NumberFormat('ru-RU').format(n)+' ₽'}
function saveFav(){localStorage.setItem('sreda:favorites',JSON.stringify([...favorites]))}
function setNav(){document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.route===route))}
function go(r){route=r;currentProduct=null;currentProject=null;selectMode=false;setNav();render();scrollTo(0,0)}
function shuffled(arr){let a=[...arr];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function toggleFav(id,e){if(e)e.stopPropagation();favorites.has(id)?favorites.delete(id):favorites.add(id);saveFav();render()}

function categoryMatch(p){
 if(selectedCategory==='Все')return true;
 if(selectedCategory==='Стулья')return p.type==='Кресло';
 if(selectedCategory==='Столы'||selectedCategory==='Декор'||selectedCategory==='Радиаторы')return false;
 return p.category===selectedCategory
}

function feedCard(item){
 if(item.kind==='visual'){
   return `<article class="feed-card">
     <div class="feed-media">
       <img src="${item.image}" alt="${item.title}">
       <button class="feed-heart" onclick="toggleFav('${item.id}',event)">${favorites.has(item.id)?'♥':'♡'}</button>
     </div>
     <div class="feed-caption">
       <div class="caption-main"><span class="caption-name">${item.title}</span></div>
       <div class="caption-sub">${item.subtitle}</div>
     </div>
   </article>`;
 }
 return `<article class="feed-card" onclick="openProduct('${item.id}')">
   <div class="feed-media">
     <img src="${item.image}" alt="${item.name}">
     <button class="feed-heart" onclick="toggleFav('${item.id}',event)">${favorites.has(item.id)?'♥':'♡'}</button>
   </div>
   <div class="feed-caption">
     <div class="caption-main">
       <span class="caption-name">${item.name}</span>
       <span class="caption-price">${item.priceLabel}</span>
     </div>
     <div class="caption-sub">${item.type} · ${item.brand}</div>
   </div>
 </article>`;
}

function renderHome(){
 let goods=PRODUCTS.filter(categoryMatch);
 let mix=selectedCategory==='Все'?shuffled([...goods,...VISUALS]):shuffled(goods);
 return `<div class="feed-tabs">${CATEGORIES.map(c=>`<button class="feed-tab ${c===selectedCategory?'active':''}" onclick="selectedCategory='${c}';render()">${c}</button>`).join('')}</div>
 <div class="stories">${STORIES.map(s=>`<button class="story" onclick="storyDemo('${s.title}')"><span class="story-ring"><img src="${s.image}" alt=""></span><span class="story-title">${s.title}</span></button>`).join('')}</div>
 <div class="masonry">${mix.map(feedCard).join('')}</div>`;
}

function storyDemo(title){
  alert(title + '\n\nДемо-раздел. Позже сюда можно открыть отдельную подборку.');
}

function openProduct(id){currentProduct=PRODUCTS.find(p=>p.id===id);route='product';setNav();render();scrollTo(0,0)}

function renderProduct(){
 const p=currentProduct;
 let sizes=p.bedSizes||p.sizes||['Стандарт'];
 return `<div class="product-hero"><img src="${p.image}" alt="${p.name}"><button class="back" onclick="go('home')">‹</button></div>
 <div class="product-content">
   <div class="eyebrow">${p.type} · ${p.brand}</div>
   <div class="product-title-row"><h1 class="product-name">${p.name}</h1><div class="product-big-price">${p.priceLabel}</div></div>
   <div class="field"><label>Отделка</label><select>${(p.finishes||['Стандарт']).map(x=>`<option>${x}</option>`).join('')}</select></div>
   <div class="field"><label>${p.bedSizes?'Спальное место':'Размер / формат'}</label><select>${sizes.map(x=>`<option>${x}</option>`).join('')}</select></div>
   <button class="btn primary" onclick="specModal()">Добавить в спецификацию</button>
   <button class="btn" onclick="requestCalc()">Запросить расчёт</button>
   <div class="info-row"><span>Срок производства</span><b>${p.production}</b></div>
   <div class="product-tabs"><button class="active">Описание</button><button>Характеристики</button><button>Отзывы (12)</button></div>
   <p class="copy">${p.description}</p>
   <div class="section-line"><h3>Похожие товары</h3><span style="font-size:11px;color:#888">Смотреть все</span></div>
   <div class="horizontal">${PRODUCTS.filter(x=>x.id!==p.id&&(x.category===p.category||x.type===p.type)).slice(0,6).map(x=>`<div class="mini" onclick="openProduct('${x.id}')"><img src="${x.image}" alt=""><div class="mn">${x.name}</div><div class="caption-sub">${x.priceLabel}</div></div>`).join('')}</div>
 </div>`;
}

function specModal(){
 const m=document.getElementById('modal');m.classList.remove('hidden');
 m.innerHTML=`<div class="sheet"><div class="sheet-title"><h3>Добавить в спецификацию</h3><button class="close" onclick="closeModal()">×</button></div>
 ${Object.keys(specData).map((x,i)=>`<label class="project-card"><span><b>${x}</b><small>${i===0?'Москва, 120 м²':i===1?'Московская обл., 250 м²':'Москва, 300 м²'}</small></span><input type="radio" name="p" ${i===0?'checked':''}></label>`).join('')}
 <button class="btn">＋ Создать новый проект</button>
 <div class="field"><label>Помещение</label><select><option>Гостиная</option><option>Спальня</option><option>Ванная</option><option>Кабинет</option></select></div>
 <button class="btn primary" onclick="closeModal()">Добавить</button></div>`;
}
function closeModal(){document.getElementById('modal').classList.add('hidden')}

function requestCalc(){
 messages.push({from:'me',text:'Прошу уточнить детали',product:currentProduct.id});
 localStorage.setItem('sreda:messages',JSON.stringify(messages));
 currentChat=currentProduct.name;route='chat';render();scrollTo(0,0)
}

function renderSearch(){
 return `<div class="search-wrap">
   <div class="searchbox">
     <input id="q" placeholder="Товар, модель или визуализация" oninput="searchNow()">
     <button class="search-icon-btn" onclick="document.getElementById('imageInput').click()"><img src="assets/icons/search.png" alt=""></button>
   </div>
   <input id="imageInput" type="file" accept="image/*" hidden onchange="imageSearch(event)">
   <div class="section-line"><h3>Популярные запросы</h3><button class="filter-launch" onclick="openFilters()"><span class="filter-glyph">☷</span>Фильтры</button></div>
   <div class="quick-chips">${['диван модульный','кресло','кровать','букле','освещение','ковер','керамогранит'].map(x=>`<button class="qchip" onclick="document.getElementById('q').value='${x}';searchNow()">${x}</button>`).join('')}</div>
   <div id="imagePreview"></div>
   <div id="searchResults" class="masonry" style="margin-top:18px">${applySearchFilters(PRODUCTS).map(feedCard).join('')}</div>
 </div>`;
}

function applySearchFilters(list){
 let a=[...list];
 if(filters.availability!=='Все')a=a.filter(p=>p.availability===filters.availability);
 if(filters.category!=='Все')a=a.filter(p=>p.category===filters.category);
 if(filters.material!=='Все')a=a.filter(p=>p.material.includes(filters.material));
 if(filters.color!=='Все')a=a.filter(p=>p.color.includes(filters.color));
 a=a.filter(p=>p.price>=filters.minPrice&&p.price<=filters.maxPrice);
 if(filters.sort==='Цена по возрастанию')a.sort((a,b)=>a.price-b.price);
 if(filters.sort==='Цена по убыванию')a.sort((a,b)=>b.price-a.price);
 return a;
}

function searchNow(){
 const q=(document.getElementById('q')?.value||'').toLowerCase();
 let found=applySearchFilters(PRODUCTS).filter(p=>(p.name+' '+p.type+' '+p.brand+' '+p.category+' '+p.description).toLowerCase().includes(q));
 document.getElementById('searchResults').innerHTML=found.map(feedCard).join('')||'<div class="empty">Ничего не найдено</div>';
}

function imageSearch(e){
 const f=e.target.files?.[0];if(!f)return;
 let u=URL.createObjectURL(f);
 document.getElementById('imagePreview').innerHTML=`<div class="section-line"><h3>Поиск по изображению</h3></div><img src="${u}" style="width:100%;max-height:220px;object-fit:cover;border-radius:18px"><p class="copy">Демо-режим: показываем визуально близкую подборку.</p>`;
 document.getElementById('searchResults').innerHTML=shuffled(PRODUCTS).map(feedCard).join('');
}

function filterSection(title,key,opts){
 return `<details class="filter-section"><summary>${title}<span>⌄</span></summary><div class="filter-options">${opts.map(o=>`<button class="filter-option ${filters[key]===o?'on':''}" onclick="setFilter('${key}','${o}',this)">${o}</button>`).join('')}</div></details>`;
}
function openFilters(){
 const mats=['Все','Ткань','Металл','Керамогранит','Кожа','Шерсть'];
 const colors=['Все','Светлый','Коричневый','Белый','Бежевый','Чёрный','Сталь'];
 const m=document.getElementById('modal');m.classList.remove('hidden');
 m.innerHTML=`<div class="sheet">
   <div class="sheet-title"><h3>Фильтры</h3><button class="close" onclick="closeModal()">×</button></div>
   ${filterSection('Сортировка','sort',['Сначала новые','Цена по возрастанию','Цена по убыванию'])}
   ${filterSection('Наличие','availability',['Все','В наличии','На заказ'])}
   ${filterSection('Категория','category',CATEGORIES)}
   ${filterSection('Цвет','color',colors)}
   ${filterSection('Материал','material',mats)}
   <details class="filter-section"><summary>Цена, ₽ <span>⌄</span></summary><div class="filter-options" style="display:grid;grid-template-columns:1fr 1fr;width:100%"><input id="minP" type="number" value="${filters.minPrice}" placeholder="от"><input id="maxP" type="number" value="${filters.maxPrice}" placeholder="до"></div></details>
   <details class="filter-section"><summary>Размеры, см <span>⌄</span></summary><div class="filter-options"><span class="caption-sub">В демо размер выбирается в карточке товара.</span></div></details>
   <div class="filter-actions"><button class="btn" onclick="resetFilters()">Сбросить</button><button class="btn primary" onclick="applyFilters()">Применить</button></div>
 </div>`;
}
function setFilter(k,v,el){filters[k]=v;el.parentElement.querySelectorAll('.filter-option').forEach(x=>x.classList.remove('on'));el.classList.add('on')}
function applyFilters(){filters.minPrice=+(document.getElementById('minP')?.value||0);filters.maxPrice=+(document.getElementById('maxP')?.value||99999999);closeModal();render()}
function resetFilters(){filters={availability:'Все',category:'Все',material:'Все',color:'Все',sort:'Сначала новые',minPrice:0,maxPrice:2000000};closeModal();render()}

function renderFavorites(){
 let all=[...PRODUCTS,...VISUALS].filter(x=>favorites.has(x.id));
 return `<div class="favorites-space">${all.length?`<div class="masonry">${all.map(feedCard).join('')}</div>`:`<div class="empty">Сохранённые карточки появятся здесь.<br>Нажмите ♡ в ленте.</div>`}</div>`;
}

function renderChats(){
 let rows=[['Nube','Прошу уточнить детали','12:40'],['Shad','Нужна дополнительная информация','11:15'],['Квартира на Патриках','Анна: Отлично, спасибо!','Вчера'],['Дом в Подмосковье','Вы: Отправил(а) файл','Пн']];
 return `<div class="chat-tabs"><button class="chat-tab active">Все</button><button class="chat-tab">По товарам</button><button class="chat-tab">По проектам</button></div><div>${rows.map(r=>`<div class="chat-row" onclick="openChat('${r[0]}')"><div class="avatar">${r[0][0]}</div><div><b>${r[0]}</b><small>${r[1]}</small></div><div class="time">${r[2]}</div></div>`).join('')}</div>`;
}
function openChat(t){currentChat=t;currentProduct=PRODUCTS.find(p=>p.name===t)||null;route='chat';render();scrollTo(0,0)}
function renderChat(){
 let rel=messages.filter(m=>!m.product||!currentProduct||m.product===currentProduct.id);
 return `<div class="message-view"><div class="section-line"><h3>‹ ${currentChat}</h3><span>•••</span></div><div class="messages">${rel.map(m=>`<div class="bubble ${m.from==='me'?'me':''}">${m.product&&currentProduct?`<div class="bubble-product"><img src="${currentProduct.image}"><div><b>${currentProduct.name}</b><br><small>${currentProduct.priceLabel}</small></div></div><br>`:''}${m.text}</div>`).join('')}${rel.length?'':'<div class="bubble">Здравствуйте! Чем можем помочь?</div>'}</div><div class="composer"><input id="msg" placeholder="Сообщение…"><button onclick="sendMsg()">↑</button></div></div>`;
}
function sendMsg(){let i=document.getElementById('msg');let t=i.value.trim();if(!t)return;messages.push({from:'me',text:t,product:currentProduct?.id});localStorage.setItem('sreda:messages',JSON.stringify(messages));render()}

function renderProfile(){
 return `<div class="profile-switch"><button class="${profileRole==='designer'?'active':''}" onclick="profileRole='designer';profileTab='projects';render()">Дизайнер</button><button class="${profileRole==='supplier'?'active':''}" onclick="profileRole='supplier';profileTab='cards';render()">Поставщик</button></div>${profileRole==='designer'?designerProfile():supplierProfile()}`;
}
function designerProfile(){
 return `<div class="profile-head"><div class="avatar">АС</div><h2>Анна Смирнова</h2><div class="meta">Дизайнер интерьеров · Москва</div><div class="stats"><div><b>124</b><small>Публикации</small></div><div><b>1 245</b><small>Подписчики</small></div><div><b>320</b><small>Подписки</small></div></div><div class="profile-description">Создаю функциональные и эстетичные интерьеры для жизни и бизнеса.</div></div>
 <div class="profile-tabs"><button class="profile-tab ${profileTab==='projects'?'active':''}" onclick="profileTab='projects';render()"><span class="tabicon">▦</span>Проекты</button><button class="profile-tab ${profileTab==='specs'?'active':''}" onclick="profileTab='specs';render()"><span class="tabicon">☷</span>Спецификации</button></div>
 ${profileTab==='projects'?renderProjects():renderSpecsRoot()}`;
}
function supplierProfile(){
 let tabs=['cards','requests','analytics','marks'];
 let names={cards:'Карточки',requests:'Запросы',analytics:'Аналитика',marks:'Отметки'};
 return `<div class="profile-head"><div class="avatar">FD</div><h2>Forma Dom</h2><div class="meta">Поставщик мебели · Москва</div><div class="stats"><div><b>98</b><small>Публикации</small></div><div><b>2 340</b><small>Подписчики</small></div><div><b>150</b><small>Подписки</small></div></div><div class="profile-description">Современная мебель собственного производства для частных и общественных интерьеров.</div></div>
 <div class="profile-tabs" style="grid-template-columns:repeat(4,1fr)">${tabs.map(t=>`<button class="profile-tab ${profileTab===t?'active':''}" onclick="profileTab='${t}';render()"><span class="tabicon">${t==='cards'?'▦':t==='requests'?'⌁':t==='analytics'?'▥':'⌑'}</span>${names[t]}</button>`).join('')}</div>
 <div class="empty">Раздел «${names[profileTab]||'Карточки'}» в разработке.</div>`;
}
function renderProjects(){return `<div class="project-list">${Object.keys(specData).map((p,i)=>`<div class="project-card"><span><b>${p}</b><small>${i===0?'Москва · 120 м²':i===1?'Московская область · 250 м²':'Москва · 300 м²'}</small></span><span>›</span></div>`).join('')}</div>`}
function renderSpecsRoot(){if(currentProject)return renderProjectSpec(currentProject);return `<div class="project-list">${Object.keys(specData).map(p=>`<div class="project-card" onclick="currentProject='${p}';render()"><span><b>${p}</b><small>${Object.keys(specData[p]).length} помещений</small></span><span>›</span></div>`).join('')}</div>`}
function renderProjectSpec(name){
 let rooms=specData[name],total=0;
 Object.values(rooms).flat().forEach(x=>{let p=PRODUCTS.find(y=>y.id===x.id);total+=p.price*x.qty});
 return `<div class="project-toolbar"><button onclick="currentProject=null;selectMode=false;render()">‹ Проекты</button><b style="font-size:13px">${name}</b><span><button onclick="selectMode=!selectMode;render()">${selectMode?'Готово':'Выбрать'}</button><button onclick="window.print()" title="Сформировать спецификацию" style="font-size:18px">⇩</button></span></div><div class="${selectMode?'select-mode':''}">${Object.entries(rooms).map(([room,items])=>renderRoom(room,items)).join('')}</div><div class="total"><span>ИТОГО</span><span>${money(total)}</span></div>`;
}
function renderRoom(room,items){return `<div class="room"><button class="room-head" onclick="this.nextElementSibling.hidden=!this.nextElementSibling.hidden"><span>${room}</span><span>⌄</span></button><div class="room-items">${items.map((x,i)=>specRow(room,x,i)).join('')}</div></div>`}
function specRow(room,x,i){
 let p=PRODUCTS.find(y=>y.id===x.id);
 return `<div class="spec-row" data-key="${room}:${i}" onclick="specClick(event,'${room}',${i},'${x.id}')" ontouchstart="holdStart(event,'${room}',${i})" ontouchend="holdEnd()"><div class="select-box"></div><img src="${p.image}"><div class="spec-info"><div class="spec-name">${p.name}</div><div class="spec-conf">${x.conf}</div><span class="spec-status">${x.status}</span></div><div class="spec-right"><div class="spec-price">${money(p.price*x.qty)}</div><div class="qty"><button onclick="changeQty(event,'${room}',${i},-1)">−</button><span>${x.qty}</span><button onclick="changeQty(event,'${room}',${i},1)">+</button></div></div></div>`;
}
let holdTimer=null;
function holdStart(e,r,i){holdTimer=setTimeout(()=>{selectMode=true;e.currentTarget.classList.add('selected');render()},650)}
function holdEnd(){clearTimeout(holdTimer)}
function specClick(e,r,i,id){if(e.target.tagName==='BUTTON')return;if(selectMode){e.currentTarget.classList.toggle('selected');return}openHistory(id)}
function changeQty(e,room,i,d){e.stopPropagation();let x=specData[currentProject][room][i];x.qty=Math.max(1,x.qty+d);render()}
function openHistory(id){currentProduct=PRODUCTS.find(p=>p.id===id);route='history';render();scrollTo(0,0)}
function renderHistory(){
 let p=currentProduct;
 let hist=HISTORY[p.id]||[['10.08.2026','Добавлен в спецификацию','Позиция создана'],['10.08.2026','Статус изменён','Расчёт']];
 return `<div class="project-toolbar"><button onclick="route='profile';profileRole='designer';profileTab='specs';render()">‹ Назад</button><b>История позиции</b><span></span></div><div class="history-head"><img src="${p.image}"><div><b>${p.name}</b><div class="caption-sub">${p.type} · ${p.brand}</div><div class="caption-sub">${p.priceLabel}</div></div></div><div class="timeline">${hist.map(h=>`<div class="event"><b>${h[1]}</b><small>${h[0]}</small><p>${h[2]}</p></div>`).join('')}</div><div class="upload-zone" onclick="document.getElementById('historyFiles').click()">＋ Прикрепить фото рекламации или фото в интерьере<input id="historyFiles" type="file" accept="image/*" multiple hidden onchange="historyUpload(event)"><div id="uploadPreview" class="upload-preview"></div></div>`;
}
function historyUpload(e){let box=document.getElementById('uploadPreview');[...e.target.files].forEach(f=>{let u=URL.createObjectURL(f);box.insertAdjacentHTML('beforeend',`<img src="${u}">`)})}

function render(){
 const v=document.getElementById('view');
 if(route==='home')v.innerHTML=renderHome();
 else if(route==='product')v.innerHTML=renderProduct();
 else if(route==='search')v.innerHTML=renderSearch();
 else if(route==='favorites')v.innerHTML=renderFavorites();
 else if(route==='chats')v.innerHTML=renderChats();
 else if(route==='chat')v.innerHTML=renderChat();
 else if(route==='profile')v.innerHTML=renderProfile();
 else if(route==='history')v.innerHTML=renderHistory();
}
render();
