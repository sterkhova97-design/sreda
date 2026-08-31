
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
 const status=m.from==='me'?`<span class="msg-status ${m.read?'read':''}">${m.read?'✓✓':'✓'}</span>`:'';
 return `<div class="bubble ${m.from==='me'?'me':''}">${body}<div class="msg-footer"><small class="msg-time">${m.time||''}</small>${status}</div></div>`;
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


function demoMarkRead(msg){
 setTimeout(()=>{
   msg.read=true;
   try{
     localStorage.setItem('sreda:messages',JSON.stringify(messages.filter(m=>!m.attachment)));
   }catch(_){}
   if(route==='chat')render();
 },1600);
}

function sendMsg(){
 const input=document.getElementById('msg');
 const text=(input?.value||'').trim();
 if(!text)return;
 const msg={chat:currentChat,from:'me',text,time:msgTime(),read:false};
 messages.push(msg);
 localStorage.setItem('sreda:messages',JSON.stringify(messages.filter(m=>!m.attachment)));
 render();
 demoMarkRead(msg);
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
   const msg={
     chat:currentChat,from:'me',time:msgTime(),read:false,
     attachment:{
       type:type==='file'?'file':type,
       url:URL.createObjectURL(file),
       name:file.name,
       meta:`${file.type||'Файл'} · ${formatBytes(file.size)}`
     }
   };
   messages.push(msg);
   demoMarkRead(msg);
 });
 attachmentPanelOpen=false;
 render();
}
function sendDemoLink(){
 const msg={chat:currentChat,from:'me',text:'https://sterkhova97-design.github.io/sreda/',time:msgTime(),read:false};
 messages.push(msg);
 attachmentPanelOpen=false;
 render();
 demoMarkRead(msg);
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
     const msg={
       chat:currentChat,from:'me',time:msgTime(),read:false,
       attachment:{type:'audio',url:URL.createObjectURL(blob),duration:formatDuration(duration)}
     };
     messages.push(msg);
     demoMarkRead(msg);
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



/* =========================================================
   SREDA v4 — full clickable product prototype
   ========================================================= */

let brandTabV4='products';
let designerTabV4='projects';
let currentBrandV4='Forma Dom';
let currentDesignerV4='Анна Смирнова';
let moderatorTabV4='products';
let productEditStepV4=1;
let uploadedProductPhotoV4='';
let aiProcessedPhotoV4='';
let photoQualityV4=null;
let storyIndexV4=0;
let storyFrameV4=0;
let settingsSectionV4='';
let followedV4=new Set(JSON.parse(localStorage.getItem('sreda:followed')||'[]'));
let selectedProductAnalyticsV4=null;

const DESIGNER_PROJECTS_V4=[
 {id:'patriki',title:'Квартира на Патриках',city:'Москва',cover:'assets/visuals/living-room.jpg',rooms:[
   {name:'Гостиная',images:['assets/visuals/living-room.jpg','assets/products/nube.webp']},
   {name:'Спальня',images:['assets/visuals/shad-room.jpg','assets/products/shad.webp']},
   {name:'Ванная',images:['assets/products/fima5801.webp']}
 ]},
 {id:'country',title:'Дом в Подмосковье',city:'Московская область',cover:'assets/visuals/lora-room.jpg',rooms:[
   {name:'Гостиная',images:['assets/products/sora.webp','assets/products/vista.webp']},
   {name:'Спальня',images:['assets/visuals/lora-room.jpg','assets/products/crona.webp']}
 ]},
 {id:'office',title:'Офисное пространство',city:'Москва',cover:'assets/products/core.webp',rooms:[
   {name:'Переговорная',images:['assets/products/core.webp']},
   {name:'Лаунж',images:['assets/products/form.webp']}
 ]}
];

const STORIES_V4=[
 {title:'Топ 10 диванов',frames:[
   {image:'assets/stories/top10-divany.webp',caption:'10 диванов, которые сохраняют чаще всего'},
   {image:'assets/products/nube.webp',caption:'Nube · Forma Dom'},
   {image:'assets/products/sora.webp',caption:'Sora · Forma Dom'}
 ]},
 {title:'Новинки Gessi',frames:[
   {image:'assets/stories/novinki-gessi.jpeg',caption:'Новые коллекции для ванной'},
   {image:'assets/products/fima5801.webp',caption:'Подборка смесителей'}
 ]},
 {title:'Isaloni',frames:[
   {image:'assets/stories/isaloni.jpg',caption:'Главные интерьерные направления сезона'},
   {image:'assets/products/dominique.webp',caption:'Свет как архитектурный объект'}
 ]},
 {title:'Выставка интерьера Москва',frames:[
   {image:'assets/stories/vystavka-moskva.jpg',caption:'Москва · ближайшее событие'},
   {image:'assets/visuals/living-room.jpg',caption:'Сохранить событие в календарь'}
 ]}
];

function saveFollowV4(){localStorage.setItem('sreda:followed',JSON.stringify([...followedV4]))}
function toggleFollowV4(key){followedV4.has(key)?followedV4.delete(key):followedV4.add(key);saveFollowV4();render()}
function isPartnerDesignerV4(){return profileRole==='designer'}

function openBrandV4(name){
 currentBrandV4=name||'Forma Dom'; brandTabV4='products'; route='brand'; setNav(); render(); scrollTo(0,0);
}
function openDesignerV4(name){
 currentDesignerV4=name||'Анна Смирнова'; designerTabV4='projects'; route='designerPublic'; setNav(); render(); scrollTo(0,0);
}
function openSettingsV4(){route='settings';settingsSectionV4='';render();scrollTo(0,0)}
function openModeratorV4(){profileRole='moderator';profileTab='moderation';route='profile';render();scrollTo(0,0)}
function openProductAnalyticsV4(id){selectedProductAnalyticsV4=id;route='productAnalytics';render();scrollTo(0,0)}

function followButtonV4(key,label='Подписаться'){
 const on=followedV4.has(key);
 return `<button class="v4-follow ${on?'active':''}" onclick="toggleFollowV4('${key}')">${on?'Вы подписаны':label}</button>`;
}

function renderHomeV4(){
 let goods=PRODUCTS.filter(categoryMatch);
 let mix=selectedCategory==='Все'?shuffled([...goods,...VISUALS]):shuffled(goods);
 return `<div class="feed-tabs">${CATEGORIES.map(c=>`<button class="feed-tab ${c===selectedCategory?'active':''}" onclick="selectedCategory='${c}';render()">${c}</button>`).join('')}</div>
 <div class="stories">${STORIES_V4.map((s,i)=>`<button class="story" onclick="openStoryV4(${i})"><span class="story-ring"><img src="${s.frames[0].image}" alt=""></span><span class="story-title">${s.title}</span></button>`).join('')}</div>
 ${renderAdCarouselV4()}
 <div class="masonry">${mix.map(feedCardV4).join('')}</div>`;
}
function feedCardV4(item){
 if(item.kind==='visual'){
   return `<article class="feed-card">
     <div class="feed-media" onclick="openDesignerV4('Анна Смирнова')">
       <img src="${item.image}" alt="${item.title}">
       <button class="feed-heart" onclick="toggleFav('${item.id}',event)">${favorites.has(item.id)?'♥':'♡'}</button>
     </div>
     <div class="feed-caption">
       <div class="caption-main"><span class="caption-name">${item.title}</span></div>
       <div class="caption-sub" onclick="openDesignerV4('Анна Смирнова')">${item.subtitle} · Анна Смирнова</div>
     </div>
   </article>`;
 }
 return `<article class="feed-card" onclick="openProduct('${item.id}')">
   <div class="feed-media">
     <img src="${item.image}" alt="${item.name}">
     <button class="feed-heart" onclick="toggleFav('${item.id}',event)">${favorites.has(item.id)?'♥':'♡'}</button>
   </div>
   <div class="feed-caption">
     <div class="caption-main"><span class="caption-name">${item.name}</span><span class="caption-price">${item.priceLabel}</span></div>
     <div class="caption-sub" onclick="event.stopPropagation();openBrandV4('${item.brand}')">${item.type} · ${item.brand}</div>
   </div>
 </article>`;
}
function renderAdCarouselV4(){
 const ads=[
  ['Forma Dom','Новая коллекция мягкой мебели','assets/products/nube.webp'],
  ['METALNO','Архитектурные радиаторы','assets/products/model-a-h.webp'],
  ['Laminam','Новые поверхности 2026','assets/products/travertino-classico.jpg']
 ];
 return `<div class="ad-strip">${ads.map(([b,t,img])=>`<div class="ad-card" onclick="openBrandV4('${b}')"><img src="${img}"><div><small>Реклама</small><b>${b}</b><span>${t}</span></div><em>→</em></div>`).join('')}</div>`;
}

function openStoryV4(i){storyIndexV4=i;storyFrameV4=0;route='story';render();scrollTo(0,0)}
function storyMoveV4(d){
 const s=STORIES_V4[storyIndexV4];
 storyFrameV4+=d;
 if(storyFrameV4>=s.frames.length){storyIndexV4=(storyIndexV4+1)%STORIES_V4.length;storyFrameV4=0}
 if(storyFrameV4<0){storyFrameV4=0}
 render();
}
function renderStoryV4(){
 const s=STORIES_V4[storyIndexV4], f=s.frames[storyFrameV4];
 return `<div class="story-viewer">
   <img class="story-bg" src="${f.image}">
   <div class="story-progress">${s.frames.map((_,i)=>`<i class="${i<=storyFrameV4?'done':''}"></i>`).join('')}</div>
   <div class="story-top"><button onclick="go('home')">×</button><b>${s.title}</b><span></span></div>
   <button class="story-hit left" onclick="storyMoveV4(-1)"></button><button class="story-hit right" onclick="storyMoveV4(1)"></button>
   <div class="story-caption"><b>${f.caption}</b><button onclick="go('search')">Смотреть подборку</button></div>
 </div>`;
}

function renderProductV4(){
 const p=currentProduct;
 const sizes=p.bedSizes||p.sizes||['Стандарт'];
 return `<div class="product-hero v4-product-hero">
   <img src="${p.image}" alt="${p.name}">
   <button class="back" onclick="go('home')">‹</button>
   <div class="product-actions-top">
     <button onclick="shareProductV4('${p.id}')">↥</button>
     <button class="${favorites.has(p.id)?'saved':''}" onclick="toggleFav('${p.id}',event)">${favorites.has(p.id)?'♥':'♡'}</button>
   </div>
 </div>
 <div class="product-content">
   <button class="brand-inline" onclick="openBrandV4('${p.brand}')"><span>${p.brand}</span><em>›</em></button>
   <div class="eyebrow">${p.type}</div>
   <div class="product-title-row"><h1 class="product-name">${p.name}</h1><div class="product-big-price">${p.priceLabel}</div></div>

   <button class="v4-picker" onclick="openPickerV4('Отделка',${JSON.stringify(p.finishes||['Стандарт']).replace(/"/g,"&quot;")})">
     <span><small>Отделка</small><b>${(p.finishes||['Стандарт'])[0]}</b></span><em>⌄</em>
   </button>
   <button class="v4-picker" onclick="openPickerV4('${p.bedSizes?'Спальное место':'Размер / формат'}',${JSON.stringify(sizes).replace(/"/g,"&quot;")})">
     <span><small>${p.bedSizes?'Спальное место':'Размер / формат'}</small><b>${sizes[0]}</b></span><em>⌄</em>
   </button>

   <button class="btn primary" onclick="specModal()">Добавить в спецификацию</button>
   <button class="btn" onclick="requestCalc()">Запросить расчёт</button>
   <div class="info-row"><span>Срок производства</span><b>${p.production}</b></div>

   <div class="v4-accordions">
    ${accordionV4('Описание',`<p>${p.description}</p>`,true)}
    ${accordionV4('Характеристики',`<p>Материал: ${p.material||'—'}<br>Наличие: ${p.availability||'—'}<br>Цвет: ${p.color||'—'}</p>`)}
    ${accordionV4('Схема с размерами',`<div class="doc-preview"><div class="dimension-demo">↔ ${sizes[0]}</div><small>Поставщик может загрузить изображение или PDF.</small></div>`)}
    ${accordionV4('Инструкция',`<div class="doc-row">PDF · Инструкция по сборке <button>Открыть</button></div>`)}
    ${accordionV4('Рекомендации по уходу',`<p>Использовать мягкую сухую ткань. Не применять абразивные средства. Для текстиля рекомендована профессиональная химчистка.</p>`)}
    ${accordionV4('Отзывы',`<div class="review-mini"><b>4,9 ★</b><span>12 отзывов о товаре · 4,8 ★ о бренде</span></div>`)}
   </div>

   <div class="section-line"><h3>Похожие товары</h3><span style="font-size:11px;color:#888">Смотреть все</span></div>
   <div class="horizontal">${PRODUCTS.filter(x=>x.id!==p.id&&(x.category===p.category||x.type===p.type)).slice(0,6).map(x=>`<div class="mini" onclick="openProduct('${x.id}')"><img src="${x.image}"><div class="mn">${x.name}</div><div class="caption-sub">${x.priceLabel}</div></div>`).join('')}</div>
 </div>`;
}
function accordionV4(title,body,open=false){
 return `<details class="v4-accordion" ${open?'open':''}><summary>${title}<span>＋</span></summary><div>${body}</div></details>`;
}
function openPickerV4(title,items){
 const m=document.getElementById('modal');m.className='modal';
 m.innerHTML=`<div class="picker-overlay" onclick="if(event.target===this)closeModal()"><div class="v4-picker-sheet">
  <div class="picker-handle"></div><h3>${title}</h3>
  ${items.map((x,i)=>`<button class="${i===0?'selected':''}" onclick="closeModal()"><b>${x}</b><span>${i===0?'Выбрано':''}</span></button>`).join('')}
 </div></div>`;
}
function shareProductV4(id){
 const p=PRODUCTS.find(x=>x.id===id);
 const m=document.getElementById('modal');m.className='modal';
 m.innerHTML=`<div class="sheet"><div class="sheet-title"><h3>Поделиться ${p.name}</h3><button class="close" onclick="closeModal()">×</button></div>
 <div class="share-grid"><button onclick="currentChat='Forma Dom';messages.push({chat:currentChat,from:'me',product:'${id}',time:msgTime(),read:false});closeModal();route='chat';render()">↗<small>В чат</small></button><button onclick="navigator.clipboard?.writeText(location.href);closeModal()">⌁<small>Скопировать</small></button><button onclick="closeModal()">⋯<small>Ещё</small></button></div>
 </div>`;
}

function renderBrandV4(){
 const products=PRODUCTS.filter(p=>p.brand===currentBrandV4);
 const key='brand:'+currentBrandV4;
 return `<div class="public-profile">
   <div class="public-cover">${products[0]?`<img src="${products[0].image}">`:''}</div>
   <div class="public-profile-head">
     <div class="brand-avatar">${currentBrandV4.slice(0,2).toUpperCase()}</div>
     <div class="public-title"><h1>${currentBrandV4}</h1>${currentBrandV4==='Forma Dom'?'<span class="platform-member">Участник площадки</span>':''}<p>Современная мебель и предметы для интерьера</p></div>
   </div>
   <div class="public-actions">${followButtonV4(key)}<button class="v4-message" onclick="currentChat='${currentBrandV4}';route='chat';render()">Сообщение</button></div>
   ${isPartnerDesignerV4()&&currentBrandV4==='Forma Dom'?`<div class="partner-discount"><small>Ваша партнёрская скидка</small><b>15%</b></div>`:''}
   <div class="public-tabs">${[['projects','Проекты'],['products','Товары'],['about','О бренде']].map(([k,n])=>`<button class="${brandTabV4===k?'active':''}" onclick="brandTabV4='${k}';render()">${n}</button>`).join('')}</div>
   ${brandTabV4==='products'?`<div class="masonry">${products.map(feedCardV4).join('')}</div>`:brandTabV4==='projects'?renderBrandProjectsV4():renderBrandAboutV4()}
 </div>`;
}
function renderBrandProjectsV4(){
 return `<div class="project-pinterest">${DESIGNER_PROJECTS_V4.slice(0,2).map(p=>`<article><img src="${p.cover}"><b>${p.title}</b><small>Проект с ${currentBrandV4}</small></article>`).join('')}</div>`;
}
function renderBrandAboutV4(){
 return `<div class="about-brand">
  <div><h3>О бренде</h3><p>Собственное производство мебели и предметов интерьера. Работа с дизайнерами и частными заказами.</p></div>
  <div><h3>Условия сотрудничества</h3><p>Индивидуальные условия для партнёров, расчёт проектов, производство под размер. Персональная скидка отображается только партнёрским дизайнерам.</p></div>
  <div><h3>Адреса</h3><p>Шоурум · Москва<br>Производство · Московская область</p></div>
 </div>`;
}

function renderDesignerPublicV4(){
 const key='designer:'+currentDesignerV4;
 return `<div class="designer-public">
  <div class="designer-inst-head">
    <div class="designer-avatar">АС</div>
    <div class="designer-name"><h1>${currentDesignerV4} <span class="verified">✓</span></h1><p>Дизайнер интерьеров · Москва</p></div>
    <button class="gear-lite" onclick="openSettingsV4()">⚙</button>
  </div>
  <div class="stats"><div><b>24</b><small>Проекты</small></div><div><b>1 245</b><small>Подписчики</small></div><div><b>320</b><small>Подписки</small></div></div>
  <div class="public-actions">${followButtonV4(key)}<button class="v4-message" onclick="currentChat='${currentDesignerV4}';route='chat';render()">Сообщение</button></div>
  <div class="designer-bio">Жилые и общественные интерьеры. Москва / Европа.</div>
  <div class="public-tabs"><button class="${designerTabV4==='projects'?'active':''}" onclick="designerTabV4='projects';render()">Проекты</button><button class="${designerTabV4==='saved'?'active':''}" onclick="designerTabV4='saved';render()">Публикации</button></div>
  ${designerTabV4==='projects'?renderDesignerProjectsV4():`<div class="masonry">${VISUALS.map(feedCardV4).join('')}</div>`}
 </div>`;
}
function renderDesignerProjectsV4(){
 return `<div class="project-pinterest">${DESIGNER_PROJECTS_V4.map(p=>`<article onclick="openDesignerProjectV4('${p.id}')"><img src="${p.cover}"><b>${p.title}</b><small>${p.city}</small></article>`).join('')}</div>`;
}
function openDesignerProjectV4(id){currentProject=id;route='designerProject';render();scrollTo(0,0)}
function renderDesignerProjectV4(){
 const p=DESIGNER_PROJECTS_V4.find(x=>x.id===currentProject)||DESIGNER_PROJECTS_V4[0];
 const supplierAccess=(profileRole==='supplier'); 
 return `<div class="designer-project-page">
  <div class="project-toolbar"><button onclick="route='designerPublic';render()">‹ Назад</button><b>${p.title}</b><span></span></div>
  ${supplierAccess?`<div class="private-access"><span>Доступ поставщика к проекту</span><button onclick="alert('АР-проект будет скачан поставщику, которому дизайнер открыл доступ.')">⇩ Скачать АР</button></div>`:''}
  <div class="room-folders">${p.rooms.map(r=>`<section><h3>${r.name}</h3><div class="project-room-grid">${r.images.map(img=>`<img src="${img}">`).join('')}</div>${supplierAccess?'<button class="room-spec-link">Открыть спецификацию комнаты →</button>':''}</section>`).join('')}</div>
 </div>`;
}

function renderProfileV4(){
 return `<div class="profile-switch v4-role-switch">
   <button class="${profileRole==='designer'?'active':''}" onclick="profileRole='designer';profileTab='projects';render()">Дизайнер</button>
   <button class="${profileRole==='supplier'?'active':''}" onclick="profileRole='supplier';profileTab='cards';render()">Поставщик</button>
   <button class="${profileRole==='moderator'?'active':''}" onclick="profileRole='moderator';profileTab='moderation';render()">Модератор</button>
 </div>${profileRole==='designer'?designerProfileV4():profileRole==='supplier'?supplierProfileV4():moderatorProfileV4()}`;
}
function designerProfileV4(){
 return `<div class="profile-settings-line"><button onclick="openDesignerV4('Анна Смирнова')">Посмотреть публичный профиль</button><button onclick="openSettingsV4()">⚙</button></div>${designerProfile()}`;
}
function supplierProfileV4(){
 let tabs=['cards','requests','analytics','marks'];
 let names={cards:'Товары',requests:'Запросы',analytics:'Аналитика',marks:'Отметки'};
 return `<div class="profile-settings-line"><button onclick="openBrandV4('Forma Dom')">Посмотреть страницу бренда</button><button onclick="openSettingsV4()">⚙</button></div>
 <div class="profile-head"><div class="avatar">FD</div><h2>Forma Dom</h2><div class="meta">Поставщик мебели · Москва</div><div class="profile-description">Современная мебель собственного производства.</div></div>
 <div class="profile-tabs supplier-tabs" style="grid-template-columns:repeat(4,1fr)">${tabs.map(t=>`<button class="profile-tab ${profileTab===t?'active':''}" onclick="profileTab='${t}';render()">${names[t]}</button>`).join('')}</div>
 ${profileTab==='cards'?renderSupplierCardsV4():profileTab==='analytics'?renderSupplierAnalyticsV4():profileTab==='requests'?renderSupplierRequests():renderSupplierMarks()}`;
}
function renderSupplierCardsV4(){
 const own=PRODUCTS.filter(p=>p.brand==='Forma Dom');
 return `<div class="supplier-section">
   <button class="add-product-main" onclick="openProductEditorV4()">＋ Добавить товар</button>
   <div class="supplier-headline"><b>Карточки товаров</b><span>${own.length} товаров</span></div>
   <div class="supplier-card-grid">${own.map(p=>`
    <article class="supplier-product-card">
      <div class="supplier-product-img" onclick="openProduct('${p.id}')"><img src="${p.image}"></div>
      <div class="supplier-product-copy"><div><b>${p.name}</b><span>${p.priceLabel}</span></div><small>${p.type}</small></div>
      <button class="product-analytics-link" onclick="openProductAnalyticsV4('${p.id}')">Аналитика товара →</button>
    </article>`).join('')}</div>
 </div>`;
}

const SUPPLIER_ANALYTICS_V4={
 '7d':{impressions:18420,opens:6240,saves:920,specs:428,requests:84,offers:61},
 '1m':{impressions:76480,opens:24790,saves:3890,specs:1834,requests:362,offers:271},
 '6m':{impressions:398700,opens:128440,saves:19720,specs:9560,requests:1890,offers:1427},
 '1y':{impressions:781300,opens:255620,saves:39480,specs:19140,requests:3780,offers:2870}
};
function renderSupplierAnalyticsV4(){
 const a=analyticsPeriod==='custom'?{impressions:52340,opens:17180,saves:2580,specs:1210,requests:242,offers:181}:SUPPLIER_ANALYTICS_V4[analyticsPeriod];
 const metrics=[['Показы в ленте',a.impressions],['Открытия карточек',a.opens],['Сохранения',a.saves],['Добавления в спецификацию',a.specs],['Запросы расчёта',a.requests],['Предложения отправлены',a.offers]];
 return `<div class="supplier-section analytics-section">
  <div class="analytics-periods">${[['7d','7 дней'],['1m','Месяц'],['6m','Полгода'],['1y','Год'],['custom','Свой период']].map(([k,n])=>`<button class="${analyticsPeriod===k?'active':''}" onclick="analyticsPeriod='${k}';render()">${n}</button>`).join('')}</div>
  ${analyticsPeriod==='custom'?`<div class="custom-period"><label>С <input type="date" value="2026-08-01"></label><label>По <input type="date" value="2026-08-31"></label></div>`:''}
  <div class="analytics-summary">${metrics.map(([n,v])=>`<div class="metric-card"><small>${n}</small><b>${new Intl.NumberFormat('ru-RU').format(v)}</b><span>динамика к прошлому периоду</span></div>`).join('')}</div>
  <div class="analytics-funnel"><div class="supplier-headline"><b>Воронка взаимодействия</b></div>
   ${metrics.map(([n,v],i)=>`<div class="funnel-row"><div><span>${n}</span><b>${new Intl.NumberFormat('ru-RU').format(v)}</b></div><div class="funnel-track"><i style="width:${Math.max(4,Math.round(v/a.impressions*100))}%"></i></div></div>`).join('')}
  </div>
  <div class="analytics-extra">
   <div><b>Топ товаров</b><span>Nube · Sora · Shad</span></div>
   <div><b>Высокие просмотры / низкая конверсия</b><span>LO-RA · Core</span></div>
   <div><b>Среднее время ответа</b><span>1 ч 24 мин</span></div>
  </div>
 </div>`;
}
function renderProductAnalyticsV4(){
 const p=PRODUCTS.find(x=>x.id===selectedProductAnalyticsV4)||PRODUCTS[0];
 const seed=(p.name.length*37)%400;
 const a={impressions:8320+seed*10,opens:2870+seed*3,saves:524+seed,specs:218+Math.round(seed/2),requests:44+Math.round(seed/9),offers:31+Math.round(seed/12)};
 return `<div class="project-toolbar"><button onclick="route='profile';profileRole='supplier';profileTab='cards';render()">‹ Товары</button><b>Аналитика ${p.name}</b><span></span></div>
 <div class="product-analytics-head"><img src="${p.image}"><div><b>${p.name}</b><small>${p.type} · ${p.priceLabel}</small></div></div>
 <div class="analytics-summary">${[['Показы',a.impressions],['Открытия',a.opens],['Сохранения',a.saves],['В спецификацию',a.specs],['Запросы расчёта',a.requests],['Предложения',a.offers]].map(([n,v])=>`<div class="metric-card"><small>${n}</small><b>${new Intl.NumberFormat('ru-RU').format(v)}</b></div>`).join('')}</div>
 <div class="chart-demo"><b>Динамика за 30 дней</b><div class="bars">${[44,67,51,83,70,92,76,88,61,97,82,91].map(h=>`<i style="height:${h}%"></i>`).join('')}</div></div>`;
}

function openProductEditorV4(){productEditStepV4=1;uploadedProductPhotoV4='';aiProcessedPhotoV4='';photoQualityV4=null;route='productEditor';render();scrollTo(0,0)}
function renderProductEditorV4(){
 return `<div class="product-editor">
  <div class="project-toolbar"><button onclick="route='profile';profileRole='supplier';profileTab='cards';render()">‹ Назад</button><b>Новый товар</b><span>${productEditStepV4}/3</span></div>
  <div class="editor-progress"><i style="width:${productEditStepV4/3*100}%"></i></div>
  ${productEditStepV4===1?renderProductEditorMediaV4():productEditStepV4===2?renderProductEditorInfoV4():renderProductEditorPreviewV4()}
 </div>`;
}
function renderProductEditorMediaV4(){
 return `<div class="editor-card"><h2>Фотографии товара</h2><p>Загрузите основное изображение. Система проверит его качество и предложит обработку.</p>
  <label class="editor-upload">${uploadedProductPhotoV4?`<img src="${aiProcessedPhotoV4||uploadedProductPhotoV4}">`:`<span>＋</span><b>Загрузить фотографию</b><small>JPG, PNG, WEBP</small>`}<input type="file" accept="image/*" hidden onchange="productPhotoUploadedV4(event)"></label>
  ${photoQualityV4?renderPhotoQualityV4():''}
  ${uploadedProductPhotoV4?`<button class="ai-process-btn" onclick="openAIStudioV4()"><span>✦</span><div><b>Обработка ИИ</b><small>Улучшить карточку по правилам Среды</small></div><em>›</em></button>`:''}
  <button class="btn primary" ${uploadedProductPhotoV4?'':'disabled'} onclick="productEditStepV4=2;render()">Продолжить</button>
 </div>`;
}
function productPhotoUploadedV4(e){
 const f=e.target.files[0]; if(!f)return;
 uploadedProductPhotoV4=URL.createObjectURL(f); aiProcessedPhotoV4='';
 const img=new Image(); img.onload=()=>{photoQualityV4={score:82,notes:['Хорошая резкость','Достаточное разрешение','Можно улучшить фон и выровнять свет']};render()}; img.src=uploadedProductPhotoV4;
}
function renderPhotoQualityV4(){
 return `<div class="photo-quality ${photoQualityV4.score>=80?'good':'warn'}"><div><b>${photoQualityV4.score}/100</b><span>${photoQualityV4.score>=80?'Фото соответствует требованиям':'Фото требует улучшения'}</span></div><ul>${photoQualityV4.notes.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
}
function openAIStudioV4(){
 const m=document.getElementById('modal');m.className='modal';
 m.innerHTML=`<div class="ai-studio">
  <div class="sheet-title"><div><small>среда · AI</small><h3>Обработка изображения</h3></div><button class="close" onclick="closeModal()">×</button></div>
  <div class="ai-before-after"><div><small>Исходное</small><img src="${uploadedProductPhotoV4}"></div><div><small>Результат</small>${aiProcessedPhotoV4?`<img src="${aiProcessedPhotoV4}">`:`<div class="ai-placeholder">✦<span>Здесь появится обработанное фото</span></div>`}</div></div>
  <div class="ai-rules"><b>Правила обработки</b>
   ${['Улучшить свет и баланс белого','Очистить фон','Сохранить форму и пропорции товара','Не менять материал и конструкцию','Привести композицию к стилю Среды'].map((x,i)=>`<label><input type="checkbox" checked> ${x}</label>`).join('')}
  </div>
  <div class="ai-presets"><button>Белый фон</button><button>Нейтральный интерьер</button><button>Улучшить исходное</button></div>
  <button class="btn primary" onclick="runAIProcessingV4()">✦ Обработать ИИ</button>
  <small class="ai-note">В рабочей версии сюда подключается image API. Для поставщика название модели ИИ не отображается.</small>
 </div>`;
}
function runAIProcessingV4(){
 aiProcessedPhotoV4=uploadedProductPhotoV4;
 photoQualityV4={score:96,notes:['Свет выровнен','Композиция соответствует карточке','Форма и материал изделия сохранены']};
 closeModal();render();
}
function renderProductEditorInfoV4(){
 return `<div class="editor-card"><h2>Информация о товаре</h2>
 ${[['Название','Например, Nube'],['Категория','Мягкая мебель'],['Цена','497 000'],['Срок производства','6–8 недель']].map(([l,p])=>`<label class="editor-field"><span>${l}</span><input placeholder="${p}"></label>`).join('')}
 <label class="editor-field"><span>Описание</span><textarea placeholder="Описание товара"></textarea></label>
 <div class="editor-docs"><h3>Документы и материалы</h3><button>＋ Схема с размерами</button><button>＋ Инструкция / PDF</button><button>＋ Рекомендации по уходу</button></div>
 <button class="btn primary" onclick="productEditStepV4=3;render()">Предпросмотр</button></div>`;
}
function renderProductEditorPreviewV4(){
 return `<div class="editor-card"><h2>Карточка готова к модерации</h2>
  <div class="editor-preview-product"><img src="${aiProcessedPhotoV4||uploadedProductPhotoV4||'assets/products/nube.webp'}"><div><b>Новый товар</b><small>Forma Dom · Мягкая мебель</small><strong>Цена будет указана поставщиком</strong></div></div>
  <div class="quality-pass">✓ Фотография соответствует требованиям Среды</div>
  <button class="btn primary" onclick="alert('Товар отправлен модератору');route='profile';profileRole='supplier';profileTab='cards';render()">Отправить на модерацию</button>
  <button class="btn" onclick="productEditStepV4=2;render()">Вернуться к редактированию</button>
 </div>`;
}

function moderatorProfileV4(){
 return `<div class="moderator">
  <div class="moderator-head"><div><small>Личный кабинет</small><h2>Модератор</h2></div><span class="moderation-badge">7 новых</span></div>
  <div class="public-tabs"><button class="${moderatorTabV4==='products'?'active':''}" onclick="moderatorTabV4='products';render()">Товары</button><button class="${moderatorTabV4==='brands'?'active':''}" onclick="moderatorTabV4='brands';render()">Бренды</button><button class="${moderatorTabV4==='designers'?'active':''}" onclick="moderatorTabV4='designers';render()">Верификация</button></div>
  ${moderatorTabV4==='products'?renderModerationProductsV4():moderatorTabV4==='brands'?renderModerationBrandsV4():renderModerationDesignersV4()}
 </div>`;
}
function renderModerationProductsV4(){
 return `<div class="moderation-list">${[
 ['Nube Compact','Forma Dom','assets/products/nube.webp','Фото · цена · категория · характеристики'],
 ['MODEL V','METALNO','assets/products/model-a-h.webp','Фото · документы · описание'],
 ['Travertino Light','Laminam','assets/products/travertino-classico.jpg','Фото · материал · декор']
 ].map(x=>`<article><img src="${x[2]}"><div><b>${x[0]}</b><small>${x[1]}</small><p>${x[3]}</p></div><div class="moderation-actions"><button onclick="this.closest('article').remove()">Отклонить</button><button class="approve" onclick="this.closest('article').remove()">Одобрить</button></div></article>`).join('')}</div>`;
}
function renderModerationBrandsV4(){
 return `<div class="moderation-list"><article><div class="brand-avatar">NB</div><div><b>New Brand</b><small>Регистрация бренда</small><p>Карточка компании загружена · адрес производства указан</p></div><div class="moderation-actions"><button>Отклонить</button><button class="approve">Одобрить</button></div></article></div>`;
}
function renderModerationDesignersV4(){
 return `<div class="moderation-list"><article><div class="brand-avatar">ЕК</div><div><b>Елена Крылова</b><small>Запрос на подтверждение</small><p>Портфолио · сайт · соцсети</p></div><div class="moderation-actions"><button>Отклонить</button><button class="approve">Выдать галочку</button></div></article></div>`;
}

function renderSettingsV4(){
 const items=[
  ['profile','Изменить данные','Имя, фото, описание, контакты'],
  ['privacy','Видимость проектов','Публичные проекты и доступ поставщиков'],
  ['notifications','Уведомления','Настроить события и push'],
  ['security','Безопасность','Вход и активные сессии'],
  ['blacklist','Чёрный список','Заблокированные пользователи и бренды'],
  ['history','Вы смотрели','История просмотренных товаров'],
  ['support','Чат поддержки','Связаться с командой Среды']
 ];
 return `<div class="settings-page"><div class="project-toolbar"><button onclick="go('profile')">‹ Назад</button><b>Настройки</b><span></span></div>
 ${items.map(([k,n,d])=>`<button class="settings-row" onclick="settingsSectionV4='${k}';openSettingsDetailV4('${n}','${d}')"><span><b>${n}</b><small>${d}</small></span><em>›</em></button>`).join('')}
 <button class="settings-row danger"><span><b>Выйти</b></span></button></div>`;
}
function openSettingsDetailV4(title,desc){
 const m=document.getElementById('modal');m.className='modal';
 m.innerHTML=`<div class="sheet"><div class="sheet-title"><h3>${title}</h3><button class="close" onclick="closeModal()">×</button></div><p class="settings-desc">${desc}</p><div class="settings-demo-box">В полноценной версии здесь находится соответствующая форма настроек.</div><button class="btn primary" onclick="closeModal()">Готово</button></div>`;
}

function openNotifications(){
 const m=document.getElementById('modal');m.className='modal';
 m.innerHTML=`<div class="sheet notifications-sheet"><div class="sheet-title"><h3>Уведомления</h3><button class="close" onclick="closeModal()">×</button></div>
 ${[
  ['Forma Dom обновил стоимость Nube','497 000 ₽ → 523 000 ₽','2 мин'],
  ['Запрос на расчёт принят','Shad · Квартира на Патриках','1 ч'],
  ['Core отгружен','Оставьте отзыв о товаре и работе бренда','вчера'],
  ['Новый подписчик','Studio Line подписался на вас','вчера']
 ].map(x=>`<div class="notification-row"><i></i><div><b>${x[0]}</b><span>${x[1]}</span></div><small>${x[2]}</small></div>`).join('')}</div>`;
}

function renderFavoritesV4(){
 const items=PRODUCTS.filter(p=>favorites.has(p.id));
 return `<div class="favorites-v4">
  <div class="favorites-head"><div><h2>Избранное</h2><small>Товары сохраняются даже после снятия с публикации</small></div><button onclick="createFavoriteFolderV4()">＋ Папка</button></div>
  <div class="favorite-folders"><button>Все товары <span>${items.length}</span></button><button>Гостиная <span>8</span></button><button>Проект Патрики <span>12</span></button><button>Для клиента <span>5</span></button></div>
  <div class="feed-tabs">${['Все','Мебель','Свет','Материалы','Сантехника'].map((x,i)=>`<button class="${i===0?'active':''}">${x}</button>`).join('')}</div>
  <div class="masonry">${items.length?items.map(feedCardV4).join(''):'<div class="empty">Нажмите ♡ у товара, чтобы сохранить его.</div>'}</div>
 </div>`;
}
function createFavoriteFolderV4(){
 const name=prompt('Название папки'); if(name) alert(`Папка «${name}» создана`);
}

function render(){
 const v=document.getElementById('view');
 if(route==='home')v.innerHTML=renderHomeV4();
 else if(route==='product')v.innerHTML=renderProductV4();
 else if(route==='search')v.innerHTML=renderSearch();
 else if(route==='favorites')v.innerHTML=renderFavoritesV4();
 else if(route==='chats')v.innerHTML=renderChats();
 else if(route==='chat')v.innerHTML=renderChat();
 else if(route==='profile')v.innerHTML=renderProfileV4();
 else if(route==='history')v.innerHTML=renderHistory();
 else if(route==='brand')v.innerHTML=renderBrandV4();
 else if(route==='designerPublic')v.innerHTML=renderDesignerPublicV4();
 else if(route==='designerProject')v.innerHTML=renderDesignerProjectV4();
 else if(route==='story')v.innerHTML=renderStoryV4();
 else if(route==='settings')v.innerHTML=renderSettingsV4();
 else if(route==='productEditor')v.innerHTML=renderProductEditorV4();
 else if(route==='productAnalytics')v.innerHTML=renderProductAnalyticsV4();
}

render();
