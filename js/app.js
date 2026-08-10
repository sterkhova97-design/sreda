
let products = [];
let route = 'home';
let selectedCategory = 'Все';
let currentProduct = null;
let favorites = new Set(JSON.parse(localStorage.getItem('sreda:favorites')||'[]'));
let messages = JSON.parse(localStorage.getItem('sreda:messages')||'[]');

const categories = ['Все','Мягкая мебель','Стулья','Столы','Освещение','Напольные покрытия','Настенные покрытия','Декор','Радиаторы','Корпусная мебель','Сантехника'];

fetch('data/products.json').then(r=>r.json()).then(d=>{products=d; render()});

document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>go(b.dataset.route));

function rub(n){ return new Intl.NumberFormat('ru-RU').format(n)+' ₽'; }
function saveFav(){localStorage.setItem('sreda:favorites',JSON.stringify([...favorites]))}
function saveMessages(){localStorage.setItem('sreda:messages',JSON.stringify(messages))}
function go(r){ route=r; currentProduct=null; setNav(); render(); window.scrollTo(0,0); }
function setNav(){
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.route===route));
}
function toggleFav(id,e){
  if(e) e.stopPropagation();
  favorites.has(id)?favorites.delete(id):favorites.add(id);
  saveFav(); render();
}
function productCard(p){
  return `<article class="card" onclick="openProduct('${p.id}')">
    <div class="card-img"><img src="${p.image}" alt="${p.name}">
      <button class="heart" onclick="toggleFav('${p.id}',event)">${favorites.has(p.id)?'♥':'♡'}</button>
    </div>
    <div class="card-meta"><b>${p.name}</b><div class="type">${p.type}</div><div class="price">${rub(p.price)}</div></div>
  </article>`;
}
function categoryMatches(p){
  if(selectedCategory==='Все') return true;
  if(selectedCategory==='Мягкая мебель') return ['Диван','Кресло'].includes(p.type);
  if(selectedCategory==='Корпусная мебель') return p.type==='Кровать';
  return false;
}
function renderHome(){
  return `<div class="category-strip">${categories.map(c=>`<button class="chip ${c===selectedCategory?'active':''}" onclick="selectedCategory='${c}';render()">${c}</button>`).join('')}</div>
  <div class="ad-card"><img src="assets/products/sora.webp"><div class="ad-copy"><b>Новая коллекция Forma Dom</b><small>Смотреть подборку →</small></div></div>
  <div class="masonry">${products.filter(categoryMatches).map(productCard).join('')}</div>`;
}
function renderSearch(){
 return `<h1 class="page-title">Поиск</h1>
 <div class="searchbox"><input id="q" placeholder="Товар, модель или визуализация" oninput="searchNow()"><button onclick="document.getElementById('imgInput').click()">▣</button></div>
 <input id="imgInput" type="file" accept="image/*" hidden onchange="imageSearch(event)">
 <div id="imagePreview"></div>
 <div class="section-title"><h3>Популярные запросы</h3></div>
 <div>${['диван модульный','кресло','кровать','букле','дерево','современная мебель'].map(x=>`<button class="chip" onclick="document.getElementById('q').value='${x}';searchNow()">${x}</button>`).join(' ')}</div>
 <div id="searchResults" class="masonry" style="margin-top:18px">${products.map(productCard).join('')}</div>`;
}
function searchNow(){
 const q=(document.getElementById('q')?.value||'').toLowerCase();
 const found=products.filter(p=>(p.name+' '+p.type+' '+p.description).toLowerCase().includes(q));
 document.getElementById('searchResults').innerHTML=found.map(productCard).join('') || '<div class="empty">Ничего не найдено</div>';
}
function imageSearch(e){
 const f=e.target.files?.[0]; if(!f) return;
 const url=URL.createObjectURL(f);
 document.getElementById('imagePreview').innerHTML=`<div class="section-title"><h3>Поиск по изображению</h3></div><img src="${url}" style="width:100%;max-height:220px;object-fit:cover;border-radius:16px"><p class="copy">Демо-режим: показываем визуально близкую подборку.</p>`;
 document.getElementById('searchResults').innerHTML=products.slice().reverse().map(productCard).join('');
}
function renderFavorites(){
 const fav=products.filter(p=>favorites.has(p.id));
 return `<h1 class="page-title">Избранное</h1>
 <div class="tabs"><button class="active">Товары</button><button>Визуализации</button></div>
 ${fav.length?`<div class="masonry" style="margin-top:14px">${fav.map(productCard).join('')}</div>`:`<div class="empty">Сохранённые товары появятся здесь.<br>Нажмите ♡ на карточке товара.</div>`}`;
}
function renderChats(){
 const rows = [
  ['Nube','Прошу уточнить детали','12:40'],
  ['Shad','Нужна дополнительная информация','11:15'],
  ['Квартира на Патриках','Анна: Отлично, спасибо!','Вчера'],
  ['Дом в Подмосковье','Вы: Отправил(а) файл','Пн'],
 ];
 return `<h1 class="page-title">Чаты</h1><div class="chat-tabs"><button class="chip active">Все</button><button class="chip">По товарам</button><button class="chip">По проектам</button></div>
 <div class="chat-list">${rows.map((r,i)=>`<div class="chat-row" onclick="openChat('${r[0]}')"><div class="avatar">${r[0][0]}</div><div><b>${r[0]}</b><small>${r[1]}</small></div><div class="time">${r[2]}</div></div>`).join('')}</div>`;
}
function renderProfile(){
 return `<h1 class="page-title">Профиль</h1>
 <div class="profile-switch"><button class="chip active" onclick="profileType('designer',this)">Дизайнер</button><button class="chip" onclick="profileType('supplier',this)">Поставщик</button></div>
 <div id="profileBody"></div>`;
}
function profileType(type,btn){
 document.querySelectorAll('.profile-switch .chip').forEach(x=>x.classList.remove('active')); if(btn)btn.classList.add('active');
 const el=document.getElementById('profileBody');
 if(type==='designer') el.innerHTML=`<div class="profile-head"><div class="avatar">АС</div><h2>Анна Смирнова</h2><div class="eyebrow">Дизайнер интерьеров · Москва</div><div class="stats"><div><b>124</b><small>Публикации</small></div><div><b>1 245</b><small>Подписчики</small></div><div><b>320</b><small>Подписки</small></div></div><p class="copy">Создаю функциональные и эстетичные интерьеры для жизни и бизнеса.</p></div><div class="profile-grid"><div class="profile-tile">Проекты</div><div class="profile-tile">Спецификации</div></div>`;
 else el.innerHTML=`<div class="profile-head"><div class="avatar">FD</div><h2>Forma Dom</h2><div class="eyebrow">Поставщик мебели · Москва</div><div class="stats"><div><b>98</b><small>Публикации</small></div><div><b>2 340</b><small>Подписчики</small></div><div><b>150</b><small>Подписки</small></div></div><p class="copy">Современная мебель собственного производства для частных и общественных интерьеров.</p></div><div class="profile-grid"><div class="profile-tile">Карточки</div><div class="profile-tile">Запросы на расчёты</div><div class="profile-tile">Аналитика</div><div class="profile-tile">Отметки</div></div>`;
}
function openProduct(id){
 currentProduct=products.find(p=>p.id===id); route='product'; setNav(); render(); window.scrollTo(0,0);
}
function renderProduct(){
 const p=currentProduct; if(!p) return renderHome();
 const sizes=p.bedSizes||p.sizes||[];
 return `<div class="product-hero"><img src="${p.image}"><button class="back" onclick="go('home')">‹</button></div>
 <div class="product-content"><div class="eyebrow">${p.type}</div><h1 class="product-name">${p.name}</h1><div class="product-price">${rub(p.price)}</div>
 <div class="field"><label>Отделка</label><select>${p.finishes.map(x=>`<option>${x}</option>`).join('')}</select></div>
 <div class="field"><label>${p.bedSizes?'Спальное место':'Размер'}</label><select>${sizes.map(x=>`<option>${x}</option>`).join('')}</select></div>
 <button class="btn primary" onclick="specModal()">Добавить в спецификацию</button>
 <button class="btn" onclick="requestCalc()">Запросить расчёт</button>
 <div class="info-row"><span>Срок производства</span><b>${p.production}</b></div>
 <div class="tabs"><button class="active">Описание</button><button>Характеристики</button><button>Отзывы (12)</button></div>
 <p class="copy">${p.description}</p>
 <div class="section-title"><h3>Похожие товары</h3><small>Смотреть все</small></div>
 <div class="horizontal">${products.filter(x=>x.id!==p.id).slice(0,5).map(x=>`<div class="mini" onclick="openProduct('${x.id}')"><img src="${x.image}"><b>${x.name}</b><div class="price">${rub(x.price)}</div></div>`).join('')}</div>
 </div>`;
}
function specModal(){
 const m=document.getElementById('modal'); m.classList.remove('hidden');
 m.innerHTML=`<div class="sheet"><h3>Добавить в спецификацию</h3>
 ${['Квартира на Патриках','Дом в Подмосковье','Офисное пространство'].map(x=>`<label class="project">${x}<input type="radio" name="pr"></label>`).join('')}
 <button class="btn">＋ Создать новый проект</button>
 <div class="field"><label>Помещение</label><select><option>Гостиная</option><option>Спальня</option><option>Кабинет</option><option>Другое</option></select></div>
 <button class="btn primary" onclick="closeModal()">Добавить</button></div>`;
 m.onclick=e=>{if(e.target===m)closeModal()}
}
function closeModal(){document.getElementById('modal').classList.add('hidden')}
function requestCalc(){
 const p=currentProduct;
 messages.push({from:'me',text:'Прошу уточнить детали',product:p.id});
 saveMessages(); openChat(p.name);
}
function openChat(title){
 route='chat'; currentProduct=products.find(p=>p.name===title)||currentProduct; render(); window.scrollTo(0,0);
}
function renderChat(){
 const p=currentProduct;
 const relevant=messages.filter(m=>!m.product || !p || m.product===p.id);
 return `<div class="message-view"><div class="section-title"><h3>‹ ${p?p.name:'Чат'}</h3><span>•••</span></div>
 <div class="messages">${relevant.map(m=>`<div class="bubble ${m.from==='me'?'me':''}">${m.product&&p?`<div class="product-bubble"><img src="${p.image}"><div><b>${p.name}</b><br><small>${rub(p.price)}</small></div></div><br>`:''}${m.text}</div>`).join('')}
 ${relevant.length===0?'<div class="bubble">Здравствуйте! Чем можем помочь?</div>':''}</div>
 <div class="composer"><input id="msg" placeholder="Сообщение…"><button onclick="sendMsg()">↑</button></div></div>`;
}
function sendMsg(){
 const inp=document.getElementById('msg'); const t=inp.value.trim(); if(!t)return;
 messages.push({from:'me',text:t,product:currentProduct?.id}); saveMessages(); render();
}
function render(){
 const v=document.getElementById('view'); if(!products.length){v.innerHTML='<div class="empty">Загрузка…</div>';return;}
 if(route==='home')v.innerHTML=renderHome();
 else if(route==='search')v.innerHTML=renderSearch();
 else if(route==='favorites')v.innerHTML=renderFavorites();
 else if(route==='chats')v.innerHTML=renderChats();
 else if(route==='profile'){v.innerHTML=renderProfile(); profileType('designer');}
 else if(route==='product')v.innerHTML=renderProduct();
 else if(route==='chat')v.innerHTML=renderChat();
}
