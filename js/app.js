
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
let attachmentPanelOpen=false;
let sharedTab='photo';
let mediaRecorder=null;
let mediaChunks=[];
let voiceRecording=false;
let voiceStartedAt=0;
let voiceTimer=null;
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
 const f=e.target.files?.[0];
 if(!f)return;
 const u=URL.createObjectURL(f);
 window.__lensImageURL=u;
 document.getElementById('imagePreview').innerHTML=`
   <div class="lens-wrap">
     <h3 class="lens-title">Поиск по изображению</h3>
     <div class="lens-stage" id="lensStage">
       <img id="lensImage" src="${u}" alt="">
       <div class="lens-box" id="lensBox">
         <span class="lens-handle nw" data-handle="nw"></span>
         <span class="lens-handle ne" data-handle="ne"></span>
         <span class="lens-handle sw" data-handle="sw"></span>
         <span class="lens-handle se" data-handle="se"></span>
       </div>
     </div>
     <div class="lens-help"><span>Перемещайте рамку и меняйте её размер</span><b>Выделите предмет</b></div>
     <div id="lensResultHead"></div>
   </div>`;
 const img=document.getElementById('lensImage');
 img.onload=()=>initLens();
}


let lensState={x:.10,y:.37,w:.80,h:.46,drag:null,start:null,timer:null};

function initLens(){
 const stage=document.getElementById('lensStage');
 const box=document.getElementById('lensBox');
 if(!stage||!box)return;
 lensState={x:.10,y:.37,w:.80,h:.46,drag:null,start:null,timer:null};
 updateLensBox();
 box.addEventListener('pointerdown',lensPointerDown);
 window.addEventListener('pointermove',lensPointerMove);
 window.addEventListener('pointerup',lensPointerUp);
 window.addEventListener('pointercancel',lensPointerUp);
 setTimeout(updateLensResults,80);
}

function lensPointerDown(e){
 e.preventDefault();
 const stage=document.getElementById('lensStage');
 if(!stage)return;
 const r=stage.getBoundingClientRect();
 lensState.drag=e.target.dataset.handle||'move';
 lensState.start={
   px:e.clientX,py:e.clientY,
   x:lensState.x,y:lensState.y,w:lensState.w,h:lensState.h,
   sw:r.width,sh:r.height
 };
 try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}
}

function lensPointerMove(e){
 if(!lensState.drag||!lensState.start)return;
 e.preventDefault();
 const s=lensState.start;
 const dx=(e.clientX-s.px)/s.sw,dy=(e.clientY-s.py)/s.sh;
 let x=s.x,y=s.y,w=s.w,h=s.h;
 const minW=.18,minH=.16;

 if(lensState.drag==='move'){
   x=Math.max(0,Math.min(1-w,s.x+dx));
   y=Math.max(0,Math.min(1-h,s.y+dy));
 }else{
   if(lensState.drag.includes('w')){x=Math.max(0,Math.min(s.x+s.w-minW,s.x+dx));w=s.w+(s.x-x)}
   if(lensState.drag.includes('e')){w=Math.max(minW,Math.min(1-s.x,s.w+dx))}
   if(lensState.drag.includes('n')){y=Math.max(0,Math.min(s.y+s.h-minH,s.y+dy));h=s.h+(s.y-y)}
   if(lensState.drag.includes('s')){h=Math.max(minH,Math.min(1-s.y,s.h+dy))}
 }

 lensState.x=x;lensState.y=y;lensState.w=w;lensState.h=h;
 updateLensBox();
 clearTimeout(lensState.timer);
 lensState.timer=setTimeout(updateLensResults,180);
}

function lensPointerUp(){
 if(!lensState.drag)return;
 lensState.drag=null;lensState.start=null;
 clearTimeout(lensState.timer);
 lensState.timer=setTimeout(updateLensResults,80);
}

function updateLensBox(){
 const box=document.getElementById('lensBox');
 if(!box)return;
 box.style.left=(lensState.x*100)+'%';
 box.style.top=(lensState.y*100)+'%';
 box.style.width=(lensState.w*100)+'%';
 box.style.height=(lensState.h*100)+'%';
}

function lensCropDataURL(){
 const img=document.getElementById('lensImage');
 if(!img||!img.naturalWidth)return null;
 const c=document.createElement('canvas');
 const sx=Math.round(lensState.x*img.naturalWidth);
 const sy=Math.round(lensState.y*img.naturalHeight);
 const sw=Math.max(1,Math.round(lensState.w*img.naturalWidth));
 const sh=Math.max(1,Math.round(lensState.h*img.naturalHeight));
 c.width=Math.min(420,sw);
 c.height=Math.max(1,Math.round(c.width*sh/sw));
 c.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,c.width,c.height);
 return c.toDataURL('image/jpeg',.84);
}


function lensCropCanvas(){
 const img=document.getElementById('lensImage');
 if(!img||!img.naturalWidth)return null;
 const c=document.createElement('canvas');
 c.width=64;c.height=64;
 const sx=Math.round(lensState.x*img.naturalWidth);
 const sy=Math.round(lensState.y*img.naturalHeight);
 const sw=Math.max(1,Math.round(lensState.w*img.naturalWidth));
 const sh=Math.max(1,Math.round(lensState.h*img.naturalHeight));
 c.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,64,64);
 return c;
}
function imageSignature(canvas){
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 let cells=[], gx=4, gy=4;
 for(let cy=0;cy<gy;cy++){
   for(let cx=0;cx<gx;cx++){
     let r=0,g=0,b=0,l=0,n=0;
     const x0=Math.floor(cx*canvas.width/gx),x1=Math.floor((cx+1)*canvas.width/gx);
     const y0=Math.floor(cy*canvas.height/gy),y1=Math.floor((cy+1)*canvas.height/gy);
     for(let y=y0;y<y1;y+=2){
       for(let x=x0;x<x1;x+=2){
         const i=(y*canvas.width+x)*4;
         const R=d[i],G=d[i+1],B=d[i+2];
         r+=R;g+=G;b+=B;l+=.2126*R+.7152*G+.0722*B;n++;
       }
     }
     cells.push([r/n,g/n,b/n,l/n]);
   }
 }
 return cells;
}
function signatureDistance(a,b){
 let s=0;
 for(let i=0;i<Math.min(a.length,b.length);i++){
   const dr=(a[i][0]-b[i][0])/255;
   const dg=(a[i][1]-b[i][1])/255;
   const db=(a[i][2]-b[i][2])/255;
   const dl=(a[i][3]-b[i][3])/255;
   s+=dr*dr+dg*dg+db*db+.5*dl*dl;
 }
 return s/Math.min(a.length,b.length);
}
function loadImage(src){
 return new Promise((resolve,reject)=>{
   const i=new Image();
   i.onload=()=>resolve(i);
   i.onerror=reject;
   i.src=src;
 });
}

async function lensDemoRanking(){
 const crop=lensCropCanvas();
 if(!crop)return [...PRODUCTS];

 const refs=[
   {id:'shad',src:'assets/search-references/shad.webp'},
   {id:'lora',src:'assets/search-references/lora.webp'}
 ];

 const cropSig=imageSignature(crop);
 const scored=[];

 for(const ref of refs){
   try{
     const img=await loadImage(ref.src);
     const c=document.createElement('canvas');
     c.width=64;c.height=64;
     c.getContext('2d').drawImage(img,0,0,64,64);
     const sig=imageSignature(c);
     scored.push({id:ref.id,score:signatureDistance(cropSig,sig)});
   }catch(e){}
 }

 scored.sort((a,b)=>a.score-b.score);
 const winner=scored[0]?.id||'shad';

 let preferred = winner==='lora'
   ? ['lora','crona','shad','sora','nube','form','core']
   : ['shad','lora','crona','nube','form','sora','core'];

 const rank=new Map(preferred.map((id,i)=>[id,i]));
 return [...PRODUCTS].sort((a,b)=>(rank.has(a.id)?rank.get(a.id):99)-(rank.has(b.id)?rank.get(b.id):99));
}
async function updateLensResults(){
 const crop=lensCropDataURL();
 const ranked=await lensDemoRanking();
 const result=document.getElementById('searchResults');
 const head=document.getElementById('lensResultHead');

 if(head){
   head.innerHTML=`<div class="lens-result-head">
     ${crop?`<img class="lens-crop-preview" src="${crop}" alt="">`:''}
     <div class="lens-result-copy"><b>Ищем по выделенному фрагменту</b>Результаты обновляются автоматически при движении рамки.</div>
   </div>
   <div class="lens-results-title">Похожие товары</div>`;
 }
 if(result)result.innerHTML=ranked.map(feedCard).join('');
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
function openChat(t){
 currentChat=t;
 currentProduct=PRODUCTS.find(p=>p.name===t)||null;
 route='chat';
 attachmentPanelOpen=false;
 render();
 setTimeout(()=>document.querySelector('.messages')?.scrollTo(0,99999),50);
}

function escapeHTML(s){
 return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function msgTime(){return new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
function formatBytes(n){
 if(!n)return '0 КБ';
 if(n<1024*1024)return Math.max(1,Math.round(n/1024))+' КБ';
 return (n/1024/1024).toFixed(1)+' МБ';
}
function formatDuration(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}

function chatMessageHTML(m){
 let body='';
 if(m.product){
   const p=PRODUCTS.find(x=>x.id===m.product);
   if(p)body+=`<div class="bubble-product" onclick="openProduct('${p.id}')"><img src="${p.image}"><div><b>${p.name}</b><small>${p.type} · ${p.priceLabel}</small></div></div>`;
 }
 if(m.attachment){
   const a=m.attachment;
   if(a.type==='image')body+=`<img class="chat-photo" src="${a.url}" alt="">`;
   else if(a.type==='video')body+=`<video class="chat-video" controls playsinline src="${a.url}"></video>`;
   else if(a.type==='audio')body+=`<div class="voice-msg"><span class="voice-wave">▂▄▆▃▅▇▄▂</span><audio controls src="${a.url}"></audio><small>${a.duration||''}</small></div>`;
   else body+=`<div class="file-msg"><span class="file-doc">⌑</span><div><b>${escapeHTML(a.name||'Файл')}</b><small>${escapeHTML(a.meta||'Вложение')}</small></div></div>`;
 }
 if(m.text)body+=`<div class="bubble-text">${escapeHTML(m.text)}</div>`;
 return `<div class="bubble ${m.from==='me'?'me':''}">${body}<small class="msg-time">${m.time||''}</small></div>`;
}

function renderChat(){
 const rel=messages.filter(m=>!m.chat||m.chat===currentChat);
 return `<section class="telegram-chat">
   <header class="chat-head">
     <button class="chat-back" onclick="go('chats')">‹</button>
     <div class="chat-avatar">${currentChat.slice(0,2).toUpperCase()}</div>
     <div class="chat-head-main"><b>${currentChat}</b><small>в сети</small></div>
     <button class="chat-more" onclick="openSharedMedia()">•••</button>
   </header>

   <div class="messages">
     ${rel.length?rel.map(chatMessageHTML).join(''):`<div class="bubble"><div class="bubble-text">Здравствуйте! Напишите, что вас интересует.</div><small class="msg-time">сейчас</small></div>`}
   </div>

   ${attachmentPanelOpen?renderAttachPanel():''}

   <div class="composer">
     <button class="composer-icon" onclick="toggleAttachPanel()" aria-label="Вложения">＋</button>
     <input id="msg" placeholder="${voiceRecording?'Идёт запись…':'Сообщение'}" onkeydown="if(event.key==='Enter')sendMsg()">
     <button class="mic-btn ${voiceRecording?'recording':''}" onclick="toggleVoice()" aria-label="Голосовое">${voiceRecording?'■':'◉'}</button>
     <button class="send-btn" onclick="sendMsg()" aria-label="Отправить">↑</button>
   </div>

   <input id="photoInput" type="file" accept="image/*" multiple hidden onchange="sendAttachments(this.files,'image')">
   <input id="videoInput" type="file" accept="video/*" multiple hidden onchange="sendAttachments(this.files,'video')">
   <input id="fileInput" type="file" multiple hidden onchange="sendAttachments(this.files,'file')">
 </section>`;
}

function sendMsg(){
 const input=document.getElementById('msg');
 const text=(input?.value||'').trim();
 if(!text)return;
 messages.push({chat:currentChat,from:'me',text,time:msgTime()});
 localStorage.setItem('sreda:messages',JSON.stringify(messages.filter(m=>!m.attachment)));
 render();
}

function toggleAttachPanel(){
 attachmentPanelOpen=!attachmentPanelOpen;
 render();
}
function renderAttachPanel(){
 return `<div class="attach-sheet">
   <div class="attach-grabber"></div>
   <div class="attach-actions">
     <button onclick="document.getElementById('photoInput').click()"><span>▧</span><small>Фото</small></button>
     <button onclick="document.getElementById('videoInput').click()"><span>▷</span><small>Видео</small></button>
     <button onclick="document.getElementById('fileInput').click()"><span>⌑</span><small>Файл</small></button>
     <button onclick="sendDemoLink()"><span>⌁</span><small>Ссылка</small></button>
   </div>
 </div>`;
}
function sendAttachments(files,type){
 [...files].forEach(file=>{
   messages.push({
     chat:currentChat,from:'me',time:msgTime(),
     attachment:{
       type:type==='file'?'file':type,
       url:URL.createObjectURL(file),
       name:file.name,
       meta:`${file.type||'Файл'} · ${formatBytes(file.size)}`
     }
   });
 });
 attachmentPanelOpen=false;
 render();
}
function sendDemoLink(){
 messages.push({chat:currentChat,from:'me',text:'https://sterkhova97-design.github.io/sreda/',time:msgTime()});
 attachmentPanelOpen=false;
 render();
}

async function toggleVoice(){
 if(voiceRecording){
   if(mediaRecorder&&mediaRecorder.state!=='inactive')mediaRecorder.stop();
   return;
 }
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){
   alert('В этом браузере запись голосовых недоступна.');
   return;
 }
 try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});
   mediaChunks=[];
   mediaRecorder=new MediaRecorder(stream);
   voiceStartedAt=Date.now();
   voiceRecording=true;
   mediaRecorder.ondataavailable=e=>{if(e.data.size)mediaChunks.push(e.data)};
   mediaRecorder.onstop=()=>{
     const blob=new Blob(mediaChunks,{type:mediaRecorder.mimeType||'audio/webm'});
     const duration=Math.max(1,Math.round((Date.now()-voiceStartedAt)/1000));
     messages.push({
       chat:currentChat,from:'me',time:msgTime(),
       attachment:{type:'audio',url:URL.createObjectURL(blob),duration:formatDuration(duration)}
     });
     stream.getTracks().forEach(t=>t.stop());
     voiceRecording=false;
     clearInterval(voiceTimer);
     render();
   };
   mediaRecorder.start();
   render();
   voiceTimer=setInterval(()=>{
     const i=document.getElementById('msg');
     if(i)i.placeholder='Запись '+formatDuration(Math.round((Date.now()-voiceStartedAt)/1000))+'…';
   },500);
 }catch(e){
   voiceRecording=false;
   alert('Разрешите доступ к микрофону в настройках браузера.');
 }
}

function openSharedMedia(){
 sharedTab='photo';
 renderSharedMediaModal();
}
function renderSharedMediaModal(){
 const modal=document.getElementById('modal');
 modal.className='modal';
 modal.innerHTML=`<div class="modal-card shared-modal">
   <div class="modal-head"><b>Вложения</b><button onclick="closeModal()">×</button></div>
   <div class="shared-tabs">
     ${[['photo','Фото'],['video','Видео'],['file','Файлы'],['link','Ссылки']].map(([k,n])=>`<button class="${sharedTab===k?'active':''}" onclick="sharedTab='${k}';renderSharedMediaModal()">${n}</button>`).join('')}
   </div>
   <div class="shared-content">${sharedMediaContent()}</div>
 </div>`;
}
function sharedMediaContent(){
 const items=messages.filter(m=>m.chat===currentChat&&m.attachment);
 if(sharedTab==='photo'){
   const rows=items.filter(m=>m.attachment.type==='image');
   return rows.length?`<div class="shared-grid">${rows.map(m=>`<img src="${m.attachment.url}">`).join('')}</div>`:`<div class="shared-empty">Здесь будут отправленные фото</div>`;
 }
 if(sharedTab==='video'){
   const rows=items.filter(m=>m.attachment.type==='video');
   return rows.length?rows.map(m=>`<video controls playsinline src="${m.attachment.url}"></video>`).join(''):`<div class="shared-empty">Здесь будут отправленные видео</div>`;
 }
 if(sharedTab==='file'){
   const rows=items.filter(m=>m.attachment.type==='file');
   return rows.length?rows.map(m=>`<div class="shared-file"><b>${escapeHTML(m.attachment.name||'Файл')}</b><small>${escapeHTML(m.attachment.meta||'')}</small></div>`).join(''):`<div class="shared-empty">Здесь будут отправленные файлы</div>`;
 }
 return `<div class="shared-file"><b>sreda · демо</b><small>sterkhova97-design.github.io/sreda/</small></div>`;
}

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
 <div class="profile-tabs supplier-tabs" style="grid-template-columns:repeat(4,1fr)">${tabs.map(t=>`<button class="profile-tab ${profileTab===t?'active':''}" onclick="profileTab='${t}';render()"><span class="tabicon">${t==='cards'?'▦':t==='requests'?'⌁':t==='analytics'?'▥':'⌑'}</span>${names[t]}</button>`).join('')}</div>
 ${profileTab==='cards'?renderSupplierCards():profileTab==='analytics'?renderSupplierAnalytics():profileTab==='requests'?renderSupplierRequests():renderSupplierMarks()}`;
}

function renderSupplierCards(){
 const soft=PRODUCTS.filter(p=>p.category==='Мягкая мебель'||['Диван','Кресло','Кровать'].includes(p.type));
 return `<div class="supplier-section">
   <div class="supplier-headline"><b>Карточки товаров</b><span>${soft.length} товаров</span></div>
   <div class="supplier-card-grid">${soft.map(p=>`
     <article class="supplier-product-card" onclick="openProduct('${p.id}')">
       <img src="${p.image}" alt="${p.name}">
       <div class="supplier-product-copy">
         <div><b>${p.name}</b><span>${p.priceLabel}</span></div>
         <small>${p.type} · ${p.brand}</small>
       </div>
     </article>`).join('')}
   </div>
 </div>`;
}

const SUPPLIER_ANALYTICS={
 '7d':{label:'7 дней',views:18420,opens:6240,specs:428,paid:96,marks:214},
 '1m':{label:'Месяц',views:76480,opens:24790,specs:1834,paid:412,marks:889},
 '6m':{label:'Пол года',views:398700,opens:128440,specs:9560,paid:2248,marks:4380},
 '1y':{label:'Год',views:781300,opens:255620,specs:19140,paid:4680,marks:9270}
};
let analyticsPeriod=window.analyticsPeriod||'1m';

function renderSupplierAnalytics(){
 const a=analyticsPeriod==='custom'
   ?{label:'Свой период',views:52340,opens:17180,specs:1210,paid:286,marks:604}
   :SUPPLIER_ANALYTICS[analyticsPeriod];
 const cards=[
   ['Просмотры',a.views],
   ['Переходы в карточку',a.opens],
   ['Добавлено в спецификацию',a.specs],
   ['Оплачено',a.paid],
   ['Отметки',a.marks]
 ];
 return `<div class="supplier-section analytics-section">
   <div class="analytics-toolbar">
     <div class="analytics-periods">
       ${[['7d','7 дней'],['1m','Месяц'],['6m','Пол года'],['1y','Год'],['custom','Свой период']].map(([k,n])=>`<button class="${analyticsPeriod===k?'active':''}" onclick="analyticsPeriod='${k}';window.analyticsPeriod=analyticsPeriod;render()">${n}</button>`).join('')}
     </div>
     ${analyticsPeriod==='custom'?`<div class="custom-period"><label>С <input type="date" value="2026-07-01"></label><label>По <input type="date" value="2026-08-10"></label></div>`:''}
   </div>
   <div class="analytics-summary">${cards.map(([name,val],i)=>`
     <div class="metric-card">
       <small>${name}</small>
       <b>${new Intl.NumberFormat('ru-RU').format(val)}</b>
       <span>${i===0?'+18%':i===1?'+12%':i===2?'+9%':i===3?'+6%':'+14%'} к прошлому периоду</span>
     </div>`).join('')}
   </div>
   <div class="analytics-funnel">
     <div class="supplier-headline"><b>Воронка</b><span>${a.label}</span></div>
     ${[
       ['Просмотры',a.views,100],
       ['Карточка',a.opens,Math.max(8,Math.round(a.opens/a.views*100))],
       ['Спецификация',a.specs,Math.max(5,Math.round(a.specs/a.views*100))],
       ['Оплачено',a.paid,Math.max(3,Math.round(a.paid/a.views*100))]
     ].map(([n,v,p])=>`<div class="funnel-row"><div><span>${n}</span><b>${new Intl.NumberFormat('ru-RU').format(v)}</b></div><div class="funnel-track"><i style="width:${p}%"></i></div></div>`).join('')}
   </div>
 </div>`;
}

function renderSupplierRequests(){
 return `<div class="supplier-section">
   <div class="supplier-headline"><b>Запросы на расчёт</b><span>Демо</span></div>
   <div class="supplier-list">
     <div class="supplier-list-row"><div><b>Nube</b><small>Квартира на Патриках · сегодня, 12:40</small></div><span>Новый</span></div>
     <div class="supplier-list-row"><div><b>Shad</b><small>Дом в Подмосковье · вчера</small></div><span>В работе</span></div>
     <div class="supplier-list-row"><div><b>Core × 4</b><small>Офисное пространство · 08.08</small></div><span>Расчёт отправлен</span></div>
   </div>
 </div>`;
}

function renderSupplierMarks(){
 return `<div class="supplier-section">
   <div class="supplier-headline"><b>Отметки</b><span>27 новых</span></div>
   <div class="supplier-card-grid marks-grid">
     ${VISUALS.slice(0,6).map(v=>`<article class="supplier-product-card"><img src="${v.image}" alt=""><div class="supplier-product-copy"><div><b>${v.title}</b></div><small>${v.subtitle}</small></div></article>`).join('')}
   </div>
 </div>`;
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
