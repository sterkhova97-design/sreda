
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
let supplierRequestFilter='Все';
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
  sredaAlertV5(title + '\n\nРаздел открыт в прототипе.');
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
   <div class="section-line"><h3>Популярные запросы</h3><button class="filter-launch icon-filter-v52" onclick="openFilters()" aria-label="Фильтры"><img src="assets/icons/filter.png" alt=""></button></div>
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
   sredaAlertV5('В этом браузере запись голосовых недоступна.');
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
   sredaAlertV5('Разрешите доступ к микрофону в настройках браузера.');
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
 const requests=[
  {name:'Nube',project:'Квартира на Патриках',date:'сегодня, 12:40',status:'Новые'},
  {name:'Shad',project:'Дом в Подмосковье',date:'вчера',status:'В работе'},
  {name:'Core × 4',project:'Офисное пространство',date:'08.08',status:'Расчёт отправлен'}
 ];
 const statuses=['Все','Новые','В работе','Расчёт отправлен','Завершённые'];
 const shown=supplierRequestFilter==='Все'?requests:requests.filter(r=>r.status===supplierRequestFilter);
 return `<div class="supplier-section supplier-requests-compact">
   <div class="supplier-headline"><b>Запросы на расчёт</b><span>${requests.length}</span></div>
   <div class="request-folders">${statuses.map(st=>`<button class="${supplierRequestFilter===st?'active':''}" onclick="supplierRequestFilter='${st}';render()"><span>${st}</span><small>${st==='Все'?requests.length:requests.filter(r=>r.status===st).length}</small></button>`).join('')}</div>
   <div class="request-filter-row"><span>${supplierRequestFilter}</span><button onclick="supplierRequestFilter='Все';render()">Сбросить</button></div>
   <div class="supplier-list telegram-list">
    ${shown.length?shown.map(r=>`<div class="supplier-list-row telegram-row"><div class="request-avatar">${r.name.slice(0,2).toUpperCase()}</div><div class="request-main"><b>${r.name}</b><small>${r.project}</small></div><div class="request-meta"><small>${r.date}</small><span>${r.status}</span></div></div>`).join(''):`<div class="request-empty">В этой папке пока нет запросов</div>`}
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
let productDraftCategoryV4='Мягкая мебель';
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
  {kind:'promo',title:'Финальная распродажа',brand:'среда.',image:'assets/ads/final-sale.jpg'},
  {kind:'brand',title:'Новая коллекция мягкой мебели',brand:'Forma Dom',image:'assets/products/nube.webp'},
  {kind:'brand',title:'Архитектурные радиаторы',brand:'METALNO',image:'assets/products/model-a-h.webp'}
 ];
 return `<div class="ad-carousel-wrap">
   <div class="ad-wide-track">${ads.map((a,i)=>`<button class="ad-wide-card" onclick="${a.kind==='promo'?`openPromoV4()`:`openBrandV4('${a.brand}')`}">
     <img src="${a.image}" alt="${a.title}">
     ${i===0?'':`<span class="ad-wide-copy"><small>Реклама</small><b>${a.brand}</b><em>${a.title}</em></span>`}
   </button>`).join('')}</div>
   <div class="ad-dots">${ads.map((_,i)=>`<i class="${i===0?'active':''}"></i>`).join('')}</div>
 </div>`;
}
function openPromoV4(){
 const m=document.getElementById('modal');m.className='modal';
 m.innerHTML=`<div class="sheet promo-sheet">
   <div class="sheet-title"><div><small>Реклама</small><h3>Финальная распродажа</h3></div><button class="close" onclick="closeModal()">×</button></div>
   <img class="promo-hero" src="assets/ads/final-sale.jpg" alt="Финальная распродажа">
   <p>Специальная подборка товаров участников площадки.</p>
   <button class="btn primary" onclick="closeModal();selectedCategory='Все';go('home')">Перейти к товарам</button>
 </div>`;
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
 const supplierAccess=(profileRole==='supplier'); const canDownloadProject=(profileRole==='supplier'||profileRole==='designer'); 
 return `<div class="designer-project-page">
  <div class="project-toolbar"><button onclick="route='designerPublic';render()">‹ Назад</button><b>${p.title}</b><span></span></div>
  ${supplierAccess?`<div class="private-access"><span>Доступ поставщика к проекту</span><button onclick="sredaAlertV5('Доступ к АР-проекту открыт.')">⇩ Скачать АР</button></div>`:''}
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
 <label class="editor-field"><span>Название</span><input placeholder="Например, Nube"></label>
 <div class="editor-field"><span>Категория</span>
   <button class="editor-select" onclick="openCategoryPickerV4()"><b>${productDraftCategoryV4}</b><em>⌄</em></button>
 </div>
 <label class="editor-field"><span>Цена</span><input placeholder="497 000" inputmode="numeric"></label>
 <label class="editor-field"><span>Срок производства</span><input placeholder="6–8 недель"></label>
 <label class="editor-field"><span>Описание</span><textarea placeholder="Описание товара"></textarea></label>
 <div class="editor-docs"><h3>Документы и материалы</h3><button>＋ Схема с размерами</button><button>＋ Инструкция / PDF</button><button>＋ Рекомендации по уходу</button></div>
 <button class="btn primary" onclick="productEditStepV4=3;render()">Предпросмотр</button></div>`;
}
function openCategoryPickerV4(){
 const cats=CATEGORIES.filter(x=>x!=='Все');
 const m=document.getElementById('modal');m.className='modal';
 m.innerHTML=`<div class="picker-overlay" onclick="if(event.target===this)closeModal()"><div class="v4-picker-sheet category-sheet">
   <div class="picker-handle"></div><h3>Категория</h3>
   ${cats.map(x=>`<button class="${x===productDraftCategoryV4?'selected':''}" onclick="productDraftCategoryV4='${x}';closeModal();render()"><b>${x}</b><span>${x===productDraftCategoryV4?'Выбрано':''}</span></button>`).join('')}
 </div></div>`;
}
function renderProductEditorPreviewV4(){
 return `<div class="editor-card"><h2>Карточка готова к модерации</h2>
  <div class="editor-preview-product"><img src="${aiProcessedPhotoV4||uploadedProductPhotoV4||'assets/products/nube.webp'}"><div><b>Новый товар</b><small>Forma Dom · ${productDraftCategoryV4}</small><strong>Цена будет указана поставщиком</strong></div></div>
  <div class="quality-pass">✓ Фотография соответствует требованиям Среды</div>
  <button class="btn primary" onclick="toastV5('Товар отправлен модератору');route='profile';profileRole='supplier';profileTab='cards';render()">Отправить на модерацию</button>
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
 const pending=[
  {title:'Nube Compact',brand:'Forma Dom',image:'assets/products/nube.webp',check:'Фото · цена · категория · характеристики',productId:'nube'},
  {title:'MODEL V',brand:'METALNO',image:'assets/products/model-a-h.webp',check:'Фото · документы · описание',productId:'modelah'},
  {title:'Travertino Light',brand:'Laminam',image:'assets/products/travertino-classico.jpg',check:'Фото · материал · декор',productId:'travertino'}
 ];
 return `<div class="moderation-list">${pending.map(x=>`<article class="moderation-product" onclick="openProduct('${x.productId}')">
   <img src="${x.image}">
   <div><b>${x.title}</b><small>${x.brand}</small><p>${x.check}</p><span class="moderation-open">Открыть карточку →</span></div>
   <div class="moderation-actions">
     <button onclick="event.stopPropagation();this.closest('article').remove()">Отклонить</button>
     <button class="approve" onclick="event.stopPropagation();this.closest('article').remove()">Одобрить</button>
   </div>
 </article>`).join('')}</div>`;
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
  <div class="favorites-head"><div><h2>Избранное</h2><small>Товары сохраняются даже после снятия с публикации</small></div><button class="favorite-new-folder" onclick="createFavoriteFolderV4()">＋ Папка</button></div>
  <div class="favorite-folders"><button class="active">Все товары <span>${items.length}</span></button><button>Гостиная <span>8</span></button><button>Проект Патрики <span>12</span></button><button>Для клиента <span>5</span></button></div>
  <div class="favorites-category-tabs">${['Все','Мебель','Свет','Материалы','Сантехника'].map((x,i)=>`<button class="${i===0?'active':''}">${x}</button>`).join('')}</div>
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


/* =========================================================
   SREDA v5 — unified functional prototype
   One web app, separate mobile and desktop compositions
   ========================================================= */

const V5_BREAKPOINT = 900;
let accountMenuOpenV5=false;
let desktopNotificationOpenV5=false;
let desktopBrandFilterV5='Все';
let moderationSectionV5='verification';
let moderationStatusV5='pending';
let moderationTypeV5='all';
let favoriteFoldersV5=JSON.parse(localStorage.getItem('sreda:favoriteFolders')||'["Гостиная","Проект Патрики","Для клиента"]');
let favoriteCategoryV5='Все';
let supportTicketsV5=[
 {id:'SR-1042',user:'Анна Смирнова',role:'Дизайнер',subject:'Не загружается PDF проекта',status:'Новый',date:'Сегодня, 14:21'},
 {id:'SR-1038',user:'Forma Dom',role:'Поставщик',subject:'Вопрос по модерации товара',status:'В работе',date:'Сегодня, 11:05'},
 {id:'SR-1021',user:'Ирина Волкова',role:'Частный клиент',subject:'Как скрыть проект?',status:'Закрыт',date:'29 авг.'}
];
let verificationArchiveV5=[
 {name:'Studio Line',type:'Бренд',decision:'Принято',date:'30 авг.',comment:'Данные компании подтверждены.'},
 {name:'Мария Орлова',type:'Дизайнер',decision:'Отклонено',date:'29 авг.',comment:'Нужно дополнить портфолио реализованными проектами.'}
];

function isDesktopV5(){ return window.innerWidth>=V5_BREAKPOINT; }

function shellSyncV5(){
  const desktop=isDesktopV5();
  document.body.classList.toggle('is-desktop',desktop);
  document.body.classList.toggle('is-mobile',!desktop);
  document.body.classList.toggle('mobile-home',!desktop && route==='home');
  document.body.classList.toggle('mobile-inner',!desktop && route!=='home' && route!=='story');
  renderDesktopCategoriesV5();
  if(desktop){ document.querySelector('.bottom-nav')?.classList.add('desktop-hidden'); }
  else { document.querySelector('.bottom-nav')?.classList.remove('desktop-hidden'); }
}

function renderDesktopCategoriesV5(){
 const host=document.getElementById('desktopCategories'); if(!host)return;
 host.innerHTML=CATEGORIES.map(c=>`<button class="${selectedCategory===c?'active':''}" onclick="selectedCategory='${c}';go('home')">${c}</button>`).join('');
}
function desktopSearchV5(e){
 e.preventDefault();
 const v=(document.getElementById('desktopSearchInput')?.value||'').trim();
 route='search'; setNav(); render();
 setTimeout(()=>{ const inp=document.getElementById('q'); if(inp){inp.value=v; searchNow();}},0);
}
function openDesktopChatsV5(){ route='chats'; setNav(); closeDesktopOverlaysV5(); render(); scrollTo(0,0); }
function closeDesktopOverlaysV5(){
 accountMenuOpenV5=false; desktopNotificationOpenV5=false;
 const r=document.getElementById('desktopOverlayRoot'); if(r)r.innerHTML='';
}
function toggleAccountMenuV5(){
 if(!isDesktopV5())return go('profile');
 accountMenuOpenV5=!accountMenuOpenV5; desktopNotificationOpenV5=false;
 renderDesktopOverlayV5();
}
function renderDesktopOverlayV5(){
 const root=document.getElementById('desktopOverlayRoot'); if(!root)return;
 if(accountMenuOpenV5){
  const roleName=profileRole==='supplier'?'Поставщик':profileRole==='moderator'?'Модератор':'Дизайнер';
  const links=profileRole==='supplier'
   ? [['profile','Профиль бренда'],['cards','Товары'],['add','Добавить товар'],['requests','Запросы на расчёт'],['orders','Заказы'],['analytics','Аналитика']]
   : profileRole==='moderator'
   ? [['verification','Верификация'],['analytics','Аналитика'],['support','Поддержка']]
   : [['profile','Мой профиль'],['projects','Проекты'],['specs','Спецификации'],['orders','Заказы'],['favorites','Избранное'],['history','Вы смотрели']];
  root.innerHTML=`<div class="desktop-popover-shade" onclick="closeDesktopOverlaysV5()"></div>
   <aside class="account-popover">
    <div class="account-now"><div class="account-avatar">${profileRole==='supplier'?'FD':profileRole==='moderator'?'М':'АС'}</div><div><small>Сейчас:</small><b>${profileRole==='supplier'?'Forma Dom':profileRole==='moderator'?'Модератор':'Анна Смирнова'}</b><span>${roleName}</span></div></div>
    <div class="account-group"><small>Личный кабинет</small>
    ${links.map(([k,n])=>`<button onclick="accountNavigateV5('${k}')">${n}<span>›</span></button>`).join('')}</div>
    <div class="account-group"><small>Аккаунт</small>
      <button onclick="closeDesktopOverlaysV5();openSettingsV4()">Настройки<span>›</span></button>
      <button onclick="closeDesktopOverlaysV5();openSupportV5()">Поддержка<span>›</span></button>
      <button>Выйти</button>
    </div>
   </aside>`;
 } else if(desktopNotificationOpenV5){
  root.innerHTML=desktopNotificationsHTMLV5();
 } else root.innerHTML='';
}
function accountNavigateV5(k){
 closeDesktopOverlaysV5();
 if(profileRole==='moderator'){
   route='profile'; profileTab='moderation'; moderationSectionV5=k; render(); return;
 }
 if(k==='profile'){route='profile';render();return}
 if(k==='add'){openProductEditorV4();return}
 if(k==='favorites'){go('favorites');return}
 if(k==='history'){route='search';render();return}
 route='profile'; profileTab=k; render();
}
function desktopNotificationsHTMLV5(){
 const rows=[
  ['price','Forma Dom обновил стоимость Nube','497 000 ₽ → 523 000 ₽','2 мин'],
  ['calc','Расчёт по Shad готов','Квартира на Патриках','1 ч'],
  ['review','Core отгружен','Оставьте отзыв о товаре и бренде','вчера'],
  ['follow','Новый подписчик','Studio Line подписался на вас','вчера'],
  ['comment','Новый комментарий','Проект «Квартира на Патриках»','2 дн.']
 ];
 return `<div class="desktop-popover-shade" onclick="closeDesktopOverlaysV5()"></div>
 <aside class="notification-popover">
   <div class="popover-title"><h3>Уведомления</h3><button onclick="closeDesktopOverlaysV5()">×</button></div>
   <div class="notice-section-label">Сейчас</div>
   ${rows.map((x,i)=>`<button class="desktop-notice ${i<2?'unread':''}" onclick="notificationActionV5('${x[0]}')">
     <span class="notice-avatar">${i===0?'FD':i===1?'SH':i===2?'C':'●'}</span>
     <span class="notice-copy"><b>${x[1]}</b><small>${x[2]}</small></span><time>${x[3]}</time>
   </button>`).join('')}
   <button class="all-activity">Посмотреть всю активность <span>›</span></button>
 </aside>`;
}
function notificationActionV5(kind){
 closeDesktopOverlaysV5();
 if(kind==='price'){openProduct('nube');return}
 if(kind==='calc'){currentProject='Квартира на Патриках';route='designerProject';render();return}
 route='profile';render();
}

function customDialogV5({title,subtitle='',input=false,placeholder='',primary='Готово',secondary='Отмена',onPrimary=null}={}){
 const m=document.getElementById('modal'); m.className='modal';
 m.innerHTML=`<div class="sreda-dialog-overlay" onclick="if(event.target===this)closeModal()">
   <div class="sreda-dialog">
    <div class="sreda-dialog-head"><h3>${title}</h3><button onclick="closeModal()">×</button></div>
    ${subtitle?`<p>${subtitle}</p>`:''}
    ${input?`<label><span>${placeholder||'Введите значение'}</span><input id="sredaDialogInput" autocomplete="off"></label>`:''}
    <div class="sreda-dialog-actions"><button class="secondary" onclick="closeModal()">${secondary}</button><button class="primary" id="sredaDialogPrimary">${primary}</button></div>
   </div></div>`;
 const btn=document.getElementById('sredaDialogPrimary');
 btn.onclick=()=>{const val=document.getElementById('sredaDialogInput')?.value?.trim(); if(input&&!val)return; closeModal(); if(onPrimary)onPrimary(val)};
 setTimeout(()=>document.getElementById('sredaDialogInput')?.focus(),50);
}

function sredaAlertV5(text){customDialogV5({title:'среда.',subtitle:String(text),primary:'Хорошо',secondary:'Закрыть'});}
function sredaPromptLegacyV5(label){
 customDialogV5({title:'Новая папка',input:true,placeholder:label||'Введите значение',primary:'Создать',onPrimary:(v)=>toastV5(`Создано: ${v}`)});
 return null;
}
function toastV5(text){
 let t=document.getElementById('sredaToastV5');
 if(!t){t=document.createElement('div');t.id='sredaToastV5';t.className='sreda-toast';document.body.appendChild(t)}
 t.textContent=text;t.classList.add('show');clearTimeout(t._tm);t._tm=setTimeout(()=>t.classList.remove('show'),1800);
}

function createFavoriteFolderV4(){
 customDialogV5({title:'Новая папка',input:true,placeholder:'Название папки',primary:'Создать',onPrimary:(name)=>{
   favoriteFoldersV5.push(name);localStorage.setItem('sreda:favoriteFolders',JSON.stringify(favoriteFoldersV5));render();toastV5(`Папка «${name}» создана`);
 }});
}
function favoriteCategoryTabsV5(){
 const cats=['Все','Мебель','Свет','Материалы','Сантехника'];
 return `<div class="mobile-category-tabs favorites-category-tabs">${cats.map(x=>`<button class="${favoriteCategoryV5===x?'active':''}" onclick="favoriteCategoryV5='${x}';render()">${x}</button>`).join('')}</div>`;
}
function favCategoryMatchV5(p){
 if(favoriteCategoryV5==='Все')return true;
 if(favoriteCategoryV5==='Мебель')return ['Мягкая мебель','Стулья','Столы','Корпусная мебель'].includes(p.category);
 if(favoriteCategoryV5==='Свет')return p.category==='Освещение';
 if(favoriteCategoryV5==='Сантехника')return p.category==='Сантехника';
 return ['Напольные покрытия','Настенные покрытия','Ткани','Декор'].includes(p.category);
}
function renderFavoritesV4(){
 const items=PRODUCTS.filter(p=>favorites.has(p.id)&&favCategoryMatchV5(p));
 return `<div class="favorites-v4 mobile-gutter">
  <div class="favorites-head"><div><h2>Избранное</h2><small>Товары сохраняются даже после снятия с публикации</small></div><button class="favorite-new-folder" onclick="createFavoriteFolderV4()">＋ Папка</button></div>
  <div class="favorite-folders"><button class="active">Все товары <span>${PRODUCTS.filter(p=>favorites.has(p.id)).length}</span></button>${favoriteFoldersV5.map((f,i)=>`<button>${f} <span>${[8,12,5,3][i]||0}</span></button>`).join('')}</div>
  ${favoriteCategoryTabsV5()}
  <div class="masonry">${items.length?items.map(feedCardV4).join(''):`<div class="favorite-empty">Нажмите ♡ у товара,<br>чтобы сохранить его.</div>`}</div>
 </div>`;
}

function mobileBackV5(action){
 return `<button class="mobile-back-v5" onclick="${action||"history.back()"}" aria-label="Назад"><img src="assets/icons/back.png" alt=""></button>`;
}

function renderProductV4(){
 const p=currentProduct; const sizes=p.bedSizes||p.sizes||['Стандарт'];
 const mobile=`<div class="mobile-product-v5">
  <div class="product-hero v4-product-hero"><img src="${p.image}" alt="${p.name}">${mobileBackV5("go('home')")}
    <div class="product-actions-top"><button onclick="shareProductV4('${p.id}')">↥</button><button class="${favorites.has(p.id)?'saved':''}" onclick="toggleFav('${p.id}',event)">${favorites.has(p.id)?'♥':'♡'}</button></div>
  </div>
  <div class="product-content mobile-gutter">${productDetailsV5(p,sizes)}</div></div>`;
 const desktop=`<div class="desktop-product-page">
   <div class="desktop-product-gallery">
     <button class="desktop-back" onclick="go('home')">‹</button>
     <img class="desktop-main-product-img" src="${p.image}" alt="${p.name}">
     <div class="desktop-thumb-row"><img src="${p.image}"><img src="${findVisualForProductV5(p)}"><img src="${p.image}"></div>
   </div>
   <aside class="desktop-product-info">
     <button class="desktop-brand-link" onclick="openBrandV4('${p.brand}')">${p.brand}<span>›</span></button>
     <small>${p.type}</small>
     <div class="desktop-product-title"><h1>${p.name}</h1><strong>${p.priceLabel}</strong></div>
     ${pickerButtonHTMLV5('Отделка',(p.finishes||['Стандарт'])[0],p.finishes||['Стандарт'])}
     ${pickerButtonHTMLV5(p.bedSizes?'Спальное место':'Размер / формат',sizes[0],sizes)}
     <div class="desktop-product-cta"><button class="primary" onclick="specModal()">Добавить в спецификацию</button><button onclick="requestCalc()">Запросить расчёт</button></div>
     <div class="desktop-meta"><span>Срок производства</span><b>${p.production}</b></div>
     <div class="desktop-inline-icons"><button onclick="shareProductV4('${p.id}')">↗ Поделиться</button><button onclick="toggleFav('${p.id}',event)">${favorites.has(p.id)?'♥ Сохранено':'♡ В избранное'}</button></div>
     <div class="v4-accordions desktop-product-accordions">
       ${accordionV4('Описание',`<p>${p.description}</p>`,true)}
       ${accordionV4('Характеристики',`<p>Материал: ${p.material||'—'}<br>Наличие: ${p.availability||'—'}<br>Цвет: ${p.color||'—'}</p>`)}
       ${accordionV4('Схема с размерами',`<div class="doc-preview"><div class="dimension-demo">↔ ${sizes[0]}</div><small>Изображение или PDF поставщика.</small></div>`)}
       ${accordionV4('Инструкция',`<div class="doc-row">PDF · Инструкция <button>Открыть</button></div>`)}
       ${accordionV4('Рекомендации по уходу',`<p>Использовать мягкую сухую ткань. Для текстиля рекомендована профессиональная химчистка.</p>`)}
       ${accordionV4('Отзывы',`<div class="review-mini"><b>4,9 ★</b><span>12 отзывов о товаре · 4,8 ★ о бренде</span></div>`)}
     </div>
   </aside>
   <section class="desktop-similar"><h2>Похожие товары</h2><div class="desktop-product-grid">${PRODUCTS.filter(x=>x.id!==p.id&&(x.category===p.category||x.type===p.type)).slice(0,4).map(desktopProductCardV5).join('')}</div></section>
 </div>`;
 return isDesktopV5()?desktop:mobile;
}
function productDetailsV5(p,sizes){
 return `<button class="brand-inline" onclick="openBrandV4('${p.brand}')"><span>${p.brand}</span><em>›</em></button>
   <div class="eyebrow">${p.type}</div><div class="product-title-row"><h1 class="product-name">${p.name}</h1><div class="product-big-price">${p.priceLabel}</div></div>
   ${pickerButtonHTMLV5('Отделка',(p.finishes||['Стандарт'])[0],p.finishes||['Стандарт'])}
   ${pickerButtonHTMLV5(p.bedSizes?'Спальное место':'Размер / формат',sizes[0],sizes)}
   <button class="btn primary" onclick="specModal()">Добавить в спецификацию</button><button class="btn" onclick="requestCalc()">Запросить расчёт</button>
   <div class="info-row"><span>Срок производства</span><b>${p.production}</b></div>
   <section class="mobile-product-description-v52"><h3>Описание</h3><p>${p.description}</p></section>
   <div class="v4-accordions product-ref-accordions-v52">
    ${accordionV4('Характеристики',`<p>Материал: ${p.material||'—'}<br>Наличие: ${p.availability||'—'}<br>Цвет: ${p.color||'—'}</p>`)}
    ${accordionV4('Схема с размерами',`<div class="doc-preview"><div class="dimension-demo">↔ ${sizes[0]}</div></div>`)}
    ${accordionV4('Инструкция',`<div class="doc-row">PDF · Инструкция <button>Открыть</button></div>`)}
    ${accordionV4('Рекомендации по уходу',`<p>Использовать мягкую сухую ткань.</p>`)}
    ${accordionV4('Отзывы',`<div class="review-mini"><b>4,9 ★</b><span>12 отзывов</span></div>`)}
   </div>`;
}
function pickerButtonHTMLV5(label,value,items){
 return `<button class="v4-picker" onclick='openPickerV4(${JSON.stringify(label)},${JSON.stringify(items)})'><span><small>${label}</small><b>${value}</b></span><em>⌄</em></button>`;
}
function findVisualForProductV5(p){
 const v=VISUALS.find(x=>(x.subtitle||'').includes(p.brand)); return v?.image||p.image;
}
function desktopProductCardV5(p){
 return `<article class="desktop-card" onclick="openProduct('${p.id}')"><div><img src="${p.image}"><button onclick="event.stopPropagation();toggleFav('${p.id}',event)">${favorites.has(p.id)?'♥':'♡'}</button></div><h3>${p.name}</h3><span>${p.type} · ${p.brand}</span><b>${p.priceLabel}</b></article>`;
}

function renderBrandV4(){
 const products=PRODUCTS.filter(p=>p.brand===currentBrandV4);
 const key='brand:'+currentBrandV4;
 if(isDesktopV5()){
  return `<div class="desktop-brand-page">
   <header class="desktop-brand-head">
    <div class="desktop-brand-identity"><div class="brand-avatar">${currentBrandV4.slice(0,2).toUpperCase()}</div><div><h1>${currentBrandV4}</h1>${currentBrandV4==='Forma Dom'?'<span class="platform-member">Участник площадки</span>':''}</div></div>
    <div class="desktop-brand-actions"><button onclick="currentChat='${currentBrandV4}';route='chat';render()">Отправить сообщение</button>${followButtonV4(key)}</div>
   </header>
   ${isPartnerDesignerV4()&&currentBrandV4==='Forma Dom'?`<div class="desktop-partner-note">Ваша партнёрская скидка <b>15%</b></div>`:''}
   <nav class="desktop-brand-tabs">${[['products','Товары'],['projects','Проекты'],['about','О бренде']].map(([k,n])=>`<button class="${brandTabV4===k?'active':''}" onclick="brandTabV4='${k}';render()">${n}</button>`).join('')}</nav>
   ${brandTabV4==='products'?`${desktopBrandFiltersV5(products)}<div class="desktop-brand-masonry">${products.filter(brandFilterMatchV5).map(desktopProductCardV5).join('')}</div>`:brandTabV4==='projects'?renderBrandProjectsV5():renderBrandAboutV4()}
  </div>`;
 }
 return `<div class="public-profile mobile-brand-v5">
   <div class="mobile-brand-head mobile-gutter">
     <div class="brand-avatar">${currentBrandV4.slice(0,2).toUpperCase()}</div>
     <div class="public-title"><h1>${currentBrandV4}</h1>${currentBrandV4==='Forma Dom'?'<span class="platform-member">Участник площадки</span>':''}</div>
   </div>
   <div class="public-actions mobile-gutter">${followButtonV4(key)}<button class="v4-message" onclick="currentChat='${currentBrandV4}';route='chat';render()">Сообщение</button></div>
   ${isPartnerDesignerV4()&&currentBrandV4==='Forma Dom'?`<div class="partner-discount mobile-gutter"><small>Ваша партнёрская скидка</small><b>15%</b></div>`:''}
   <div class="public-tabs mobile-gutter">${[['products','Товары'],['projects','Проекты'],['about','О бренде']].map(([k,n])=>`<button class="${brandTabV4===k?'active':''}" onclick="brandTabV4='${k}';render()">${n}</button>`).join('')}</div>
   ${brandTabV4==='products'?`<div class="masonry mobile-gutter">${products.map(feedCardV4).join('')}</div>`:brandTabV4==='projects'?renderBrandProjectsV4():renderBrandAboutV4()}
 </div>`;
}
function desktopBrandFiltersV5(products){
 const types=['Все',...new Set(products.map(p=>p.type))];
 return `<div class="desktop-brand-filters">
   ${types.map(x=>`<button class="${desktopBrandFilterV5===x?'active':''}" onclick="desktopBrandFilterV5='${x}';render()">${x}</button>`).join('')}
   <button onclick="openFilters()">Материал⌄</button><button onclick="openFilters()">Размер⌄</button><button onclick="openFilters()">Цена⌄</button><button onclick="openFilters()">Наличие⌄</button>
 </div>`;
}
function brandFilterMatchV5(p){return desktopBrandFilterV5==='Все'||p.type===desktopBrandFilterV5}
function renderBrandProjectsV5(){
 return `<div class="desktop-project-masonry">${DESIGNER_PROJECTS_V4.map(p=>`<article><img src="${p.cover}"><h3>${p.title}</h3><span>${p.city}</span></article>`).join('')}</div>`;
}

function renderDesignerPublicV4(){
 return renderDesignerProfileUnifiedV5(false);
}
function designerProfileV4(){
 return renderDesignerProfileUnifiedV5(true);
}
function renderDesignerProfileUnifiedV5(own){
 const key='designer:'+currentDesignerV4;
 if(isDesktopV5()){
  return `<div class="desktop-designer-profile">
    <header class="desktop-designer-head"><div class="designer-avatar">АС</div><div><h1>Анна Смирнова <span class="verified">✓</span></h1><p>Дизайнер интерьеров · Москва</p></div>
    <div class="desktop-designer-actions">${own?`<button onclick="openDesignerV4('Анна Смирнова')">Публичный профиль</button><button onclick="openSettingsV4()">Редактировать профиль</button>`:`${followButtonV4(key)}<button onclick="currentChat='Анна Смирнова';route='chat';render()">Сообщение</button>`}</div></header>
    <div class="desktop-designer-stats"><div><b>24</b><span>Проекты</span></div><div><b>1 245</b><span>Подписчики</span></div><div><b>320</b><span>Подписки</span></div></div>
    ${own?`<div class="desktop-profile-quick"><button onclick="profileTab='analytics';render()">Аналитика</button><button onclick="openSettingsV4()">Редактировать</button><button onclick="shareProfileV5()">Поделиться профилем</button></div>`:''}
    <p class="desktop-bio">Жилые и общественные интерьеры. Москва / Европа.</p>
    <div class="desktop-designer-tabs"><button class="${designerTabV4==='projects'?'active':''}" onclick="designerTabV4='projects';render()">Проекты</button><button class="${designerTabV4==='saved'?'active':''}" onclick="designerTabV4='saved';render()">Публикации</button></div>
    ${designerTabV4==='projects'?renderDesignerProjectsV5():`<div class="desktop-brand-masonry">${VISUALS.map(desktopVisualCardV5).join('')}</div>`}
  </div>`;
 }
 return `<div class="mobile-profile-unified mobile-gutter">
   ${own?`<div class="mobile-role-tabs"><button class="${profileRole==='designer'?'active':''}" onclick="profileRole='designer';render()">Дизайнер</button><button onclick="profileRole='supplier';render()">Поставщик</button><button onclick="profileRole='moderator';render()">Модератор</button></div>`:''}
   <div class="mobile-profile-top-actions">${own?`<span></span><button class="hamburger-v5" onclick="openSettingsV4()">☰</button>`:''}</div>
   <div class="mobile-profile-avatar">АС</div>
   <h1>Анна Смирнова <span class="verified">✓</span></h1><p class="mobile-profile-sub">Дизайнер интерьеров · Москва</p>
   <div class="stats mobile-stats"><div><b>24</b><small>Проекты</small></div><div><b>1 245</b><small>Подписчики</small></div><div><b>320</b><small>Подписки</small></div></div>
   ${own?`<div class="mobile-profile-quick"><button onclick="profileTab='analytics';render()">Аналитика</button><button onclick="openSettingsV4()">Редактировать</button><button onclick="shareProfileV5()">Поделиться профилем</button></div>`:`<div class="public-actions">${followButtonV4(key)}<button class="v4-message" onclick="currentChat='Анна Смирнова';route='chat';render()">Сообщение</button></div>`}
   <p class="mobile-profile-bio">Жилые и общественные интерьеры. Москва / Европа.</p>
   <div class="public-tabs mobile-profile-tabs"><button class="${designerTabV4==='projects'?'active':''}" onclick="designerTabV4='projects';render()">Проекты</button><button class="${designerTabV4==='saved'?'active':''}" onclick="designerTabV4='saved';render()">Публикации</button></div>
   ${designerTabV4==='projects'?renderDesignerProjectsV4():`<div class="masonry mobile-profile-grid">${VISUALS.map(feedCardV4).join('')}</div>`}
 </div>`;
}
function renderDesignerProjectsV5(){return `<div class="desktop-project-masonry">${DESIGNER_PROJECTS_V4.map(p=>`<article onclick="openDesignerProjectV4('${p.id}')"><img src="${p.cover}"><h3>${p.title}</h3><span>${p.city}</span></article>`).join('')}</div>`}
function desktopVisualCardV5(v){return `<article class="desktop-card"><div><img src="${v.image}"><button>♡</button></div><h3>${v.title}</h3><span>${v.subtitle||''}</span></article>`}
function shareProfileV5(){toastV5('Ссылка на профиль готова к отправке')}

function renderDesignerProjectV4(){
 const p=DESIGNER_PROJECTS_V4.find(x=>x.id===currentProject)||DESIGNER_PROJECTS_V4[0];
 const supplierAccess=(profileRole==='supplier'); const canDownloadProject=(profileRole==='supplier'||profileRole==='designer');
 if(isDesktopV5()){
  return `<div class="desktop-project-page-v5"><header>${mobileBackV5("route='designerPublic';render()")}<h1>${p.title}</h1>${canDownloadProject?`<button onclick="downloadProjectV5('${p.title}')">↓ Скачать проект</button>`:'<span></span>'}</header>
   ${p.rooms.map(r=>`<section><h2>${r.name}</h2><div class="desktop-room-grid">${r.images.map(img=>`<img src="${img}">`).join('')}</div>${supplierAccess?'<button>Открыть спецификацию комнаты →</button>':''}</section>`).join('')}</div>`;
 }
 return `<div class="designer-project-page mobile-gutter">
  <div class="mobile-project-toolbar">${mobileBackV5("route='designerPublic';render()")}<b>${p.title}</b>${canDownloadProject?`<button class="download-project-mobile" onclick="downloadProjectV5('${p.title}')">↓ Проект</button>`:'<span></span>'}</div>
  <div class="room-folders">${p.rooms.map(r=>`<section><h3>${r.name}</h3><div class="project-room-grid">${r.images.map(img=>`<img src="${img}">`).join('')}</div>${supplierAccess?'<button class="room-spec-link">Открыть спецификацию комнаты →</button>':''}</section>`).join('')}</div>
 </div>`;
}
function downloadProjectV5(name){
 const blob=new Blob([`Архитектурный проект: ${name}\nДемо-файл прототипа Среда.`],{type:'text/plain;charset=utf-8'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${name}-АР.txt`;a.click();URL.revokeObjectURL(a.href);
 toastV5('Проект скачан');
}

function supplierProfileV4(){
 if(isDesktopV5()) return supplierDesktopV5();
 return supplierMobileV5();
}
function supplierMobileV5(){
 let tabs=['cards','requests','analytics','marks']; let names={cards:'Товары',requests:'Запросы',analytics:'Аналитика',marks:'Отметки'};
 return `<div class="mobile-supplier-profile mobile-gutter">
   <div class="mobile-role-tabs"><button onclick="profileRole='designer';render()">Дизайнер</button><button class="active">Поставщик</button><button onclick="profileRole='moderator';render()">Модератор</button></div>
   <div class="mobile-profile-top-actions"><span></span><button class="hamburger-v5" onclick="openSettingsV4()">☰</button></div>
   <div class="mobile-profile-avatar brand-avatar-mobile">FD</div><h1>Forma Dom</h1><p class="mobile-profile-sub">Поставщик мебели · Москва</p>
   <div class="mobile-profile-quick"><button onclick="profileTab='analytics';render()">Аналитика</button><button onclick="openSettingsV4()">Редактировать</button><button onclick="shareProfileV5()">Поделиться профилем</button></div>
   <div class="profile-tabs supplier-tabs">${tabs.map(t=>`<button class="profile-tab ${profileTab===t?'active':''}" onclick="profileTab='${t}';render()">${names[t]}</button>`).join('')}</div>
   ${profileTab==='cards'?renderSupplierCardsV4():profileTab==='analytics'?renderSupplierAnalyticsV4():profileTab==='requests'?renderSupplierRequests():renderSupplierMarks()}
 </div>`;
}
function supplierDesktopV5(){
 const tabs=[['cards','Товары'],['requests','Запросы'],['orders','Заказы'],['analytics','Аналитика']];
 return `<div class="desktop-cabinet">
   <header class="desktop-cabinet-title"><div><small>Личный кабинет поставщика</small><h1>Forma Dom</h1></div><div><button onclick="openProductEditorV4()">＋ Добавить товар</button><button onclick="openSettingsV4()">Редактировать профиль</button></div></header>
   <nav class="desktop-cabinet-tabs">${tabs.map(([k,n])=>`<button class="${profileTab===k?'active':''}" onclick="profileTab='${k}';render()">${n}</button>`).join('')}</nav>
   ${profileTab==='cards'?renderSupplierCardsV4():profileTab==='analytics'?renderSupplierAnalyticsV4():profileTab==='requests'?renderSupplierRequests():renderOrdersV5()}
 </div>`;
}
function renderOrdersV5(){return `<div class="desktop-list-card"><h2>Заказы</h2>${[['№ 1284','Nube · Квартира на Патриках','В производстве'],['№ 1279','Shad · Спальня','Отгружено · Оставить отзыв']].map(x=>`<div><span><b>${x[0]}</b><small>${x[1]}</small></span><strong>${x[2]}</strong></div>`).join('')}</div>`}

function analyticsDownloadButtonV5(kind='Аналитика'){
 return `<button class="excel-download" onclick="downloadAnalyticsExcelV5('${kind}')">↓ Скачать Excel</button>`;
}
function downloadAnalyticsExcelV5(kind){
 const rows=[['Показатель','Значение'],['Показы',76480],['Открытия',24790],['Сохранения',3890],['Добавления в спецификацию',1834],['Запросы расчёта',362],['Предложения',271]];
 const html=`<html><meta charset="utf-8"><table>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table></html>`;
 const blob=new Blob([html],{type:'application/vnd.ms-excel'});
 const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`Среда-${kind}.xls`; a.click(); URL.revokeObjectURL(a.href); toastV5('Аналитика скачана');
}
const _renderSupplierAnalyticsV4=renderSupplierAnalyticsV4;
renderSupplierAnalyticsV4=function(){
 const base=_renderSupplierAnalyticsV4();
 return `<div class="analytics-download-row">${analyticsDownloadButtonV5('аналитика-поставщика')}</div>${base}`;
}
const _renderProductAnalyticsV4=renderProductAnalyticsV4;
renderProductAnalyticsV4=function(){return `<div class="analytics-download-row">${analyticsDownloadButtonV5('аналитика-товара')}</div>${_renderProductAnalyticsV4()}`}

function moderatorProfileV4(){
 if(isDesktopV5()) return moderatorDesktopV5();
 return moderatorMobileV5();
}
function moderatorMobileV5(){
 return `<div class="moderator mobile-gutter"><div class="mobile-role-tabs"><button onclick="profileRole='designer';render()">Дизайнер</button><button onclick="profileRole='supplier';render()">Поставщик</button><button class="active">Модератор</button></div>
 <div class="moderator-head"><div><small>Личный кабинет</small><h2>Модератор</h2></div><span class="moderation-badge">7 новых</span></div>
 ${moderatorNavV5()}${moderatorSectionContentV5()}</div>`;
}
function moderatorDesktopV5(){
 return `<div class="desktop-moderator-v5">
  <header><div><small>Личный кабинет</small><h1>Модератор</h1></div><span>7 новых</span></header>
  ${moderatorNavV5()}${moderatorSectionContentV5()}
 </div>`;
}
function moderatorNavV5(){
 return `<nav class="moderator-main-nav"><button class="${moderationSectionV5==='verification'?'active':''}" onclick="moderationSectionV5='verification';render()">Верификация</button><button class="${moderationSectionV5==='analytics'?'active':''}" onclick="moderationSectionV5='analytics';render()">Аналитика</button><button class="${moderationSectionV5==='support'?'active':''}" onclick="moderationSectionV5='support';render()">Поддержка</button></nav>`;
}
function moderatorSectionContentV5(){
 if(moderationSectionV5==='analytics')return moderatorAnalyticsV5();
 if(moderationSectionV5==='support')return moderatorSupportV5();
 return moderatorVerificationV5();
}
function moderatorVerificationV5(){
 const pending=[
  {name:'Nube Compact',type:'Товар',brand:'Forma Dom',img:'assets/products/nube.webp',productId:'nube'},
  {name:'METALNO',type:'Бренд',brand:'Адрес производства · карточка компании',img:'assets/products/model-a-h.webp'},
  {name:'Елена Крылова',type:'Дизайнер',brand:'Портфолио · сайт · соцсети',img:''},
  {name:'Travertino Light',type:'Товар',brand:'Laminam · материал · декор',img:'assets/products/travertino-classico.jpg',productId:'travertino'}
 ].filter(x=>moderationTypeV5==='all'||x.type===moderationTypeV5);
 return `<div class="moderation-toolbar">
  <div>${['all','Товар','Бренд','Дизайнер','Поставщик'].map(x=>`<button class="${moderationTypeV5===x?'active':''}" onclick="moderationTypeV5='${x}';render()">${x==='all'?'Все':x==='Товар'?'Товары':x==='Бренд'?'Бренды':x==='Дизайнер'?'Дизайнеры':'Поставщики'}</button>`).join('')}</div>
  <div><button class="${moderationStatusV5==='pending'?'active':''}" onclick="moderationStatusV5='pending';render()">На рассмотрении</button><button class="${moderationStatusV5==='archive'?'active':''}" onclick="moderationStatusV5='archive';render()">Архив</button></div></div>
  ${moderationStatusV5==='archive'?`<div class="verification-table">${verificationArchiveV5.map(x=>`<article><div><b>${x.name}</b><small>${x.type} · ${x.date}</small></div><strong class="${x.decision==='Принято'?'ok':'bad'}">${x.decision}</strong><p>${x.comment}</p></article>`).join('')}</div>`:
  `<div class="verification-table">${pending.map(x=>`<article class="verification-request" ${x.productId?`onclick="openProduct('${x.productId}')"`:''}>${x.img?`<img src="${x.img}">`:`<div class="request-avatar">${x.name[0]}</div>`}<div><b>${x.name}</b><small>${x.type}</small><p>${x.brand}</p></div><div class="verify-actions"><button onclick="event.stopPropagation();moderationDecisionV5('${x.name}','Отклонено')">Отклонить</button><button onclick="event.stopPropagation();moderationDecisionV5('${x.name}','Принято')">Принять</button></div></article>`).join('')}</div>`}`;
}
function moderationDecisionV5(name,decision){
 customDialogV5({title:decision==='Принято'?'Принять заявку':'Отклонить заявку',subtitle:`${name}. Добавьте комментарий к решению.`,input:true,placeholder:'Комментарий модератора',primary:decision==='Принято'?'Принять':'Отклонить',onPrimary:(comment)=>{
  verificationArchiveV5.unshift({name,type:'Заявка',decision,date:'сегодня',comment});toastV5('Решение сохранено');render();
 }});
}
function moderatorAnalyticsV5(){
 return `<div class="moderator-analytics">${analyticsDownloadButtonV5('аналитика-платформы')}
 <div class="analytics-summary">${[['Новые пользователи','428'],['Активные пользователи','4 812'],['Бренды','184'],['Товары','3 942'],['Добавлено в спецификации','12 840'],['Запросы расчёта','1 624']].map(x=>`<div class="metric-card"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}</div>
 <div class="analytics-extra"><div><b>Ручные позиции дизайнеров</b><span>Шторы · столярные изделия · искусство</span></div><div><b>Чего не хватает в каталоге</b><span>Декоративный свет · двери · текстиль на заказ</span></div></div></div>`;
}
function moderatorSupportV5(){
 return `<div class="support-admin"><div class="support-filter"><button class="active">Все</button><button>Новые</button><button>В работе</button><button>Закрытые</button></div>
 ${supportTicketsV5.map(t=>`<article onclick="openSupportTicketV5('${t.id}')"><div><b>${t.subject}</b><small>${t.id} · ${t.user} · ${t.role}</small></div><span>${t.status}</span><time>${t.date}</time></article>`).join('')}</div>`;
}
function openSupportTicketV5(id){
 const t=supportTicketsV5.find(x=>x.id===id); if(!t)return;
 customDialogV5({title:`${t.id} · ${t.subject}`,subtitle:`${t.user} (${t.role})\n\n«Здравствуйте! Подскажите, пожалуйста, как решить этот вопрос в сервисе?»`,input:true,placeholder:'Ответ пользователю',primary:'Отправить ответ',onPrimary:()=>toastV5('Ответ отправлен')});
}
function openSupportV5(){
 route='support';closeDesktopOverlaysV5();render();scrollTo(0,0);
}
function renderSupportV5(){
 return `<div class="support-page mobile-gutter">${mobileBackV5("go('profile')")}<h1>Поддержка Среды</h1><p>Задайте вопрос о работе сервиса.</p>
 <div class="support-quick">${['Работа с сервисом','Товары и спецификации','Проекты','Сообщения','Аккаунт и верификация'].map(x=>`<button>${x}<span>›</span></button>`).join('')}</div>
 <button class="btn primary" onclick="openSupportQuestionV5()">Задать вопрос поддержке</button><button class="btn">Мои обращения</button></div>`;
}
function openSupportQuestionV5(){
 customDialogV5({title:'Вопрос поддержке',subtitle:'Опишите вопрос. К обращению в рабочей версии можно будет приложить скриншот или файл.',input:true,placeholder:'Ваш вопрос',primary:'Отправить',onPrimary:()=>toastV5('Обращение SR-1047 создано')});
}

function renderSettingsV4(){
 const groups=[
  ['Ваш аккаунт',[['profile','Изменить данные','Имя, фото, описание, контакты','◎'],['security','Безопасность','Пароль и активные сессии','○']]],
  ['Как вы используете Среду',[['history','Вы смотрели','История просмотренных товаров','↶'],['notifications','Уведомления','Настроить события и push','♢']]],
  ['Приватность',[['privacy','Видимость проектов','Публичные проекты и доступ поставщиков','▣'],['blacklist','Чёрный список','Заблокированные пользователи и бренды','⊘']]],
  ['Помощь',[['support','Поддержка','Связаться с командой Среды','?']]]
 ];
 return `<div class="settings-page insta-settings mobile-gutter">
  <div class="settings-mobile-head">${mobileBackV5("go('profile')")}<b>Настройки</b><span></span></div>
  ${groups.map(([g,items])=>`<section><h3>${g}</h3>${items.map(([k,n,d,ic])=>`<button class="insta-setting-row" onclick="${k==='support'?'openSupportV5()':`settingsSectionV4='${k}';openSettingsDetailV4('${n}','${d}')`}"><i>${ic}</i><span><b>${n}</b><small>${d}</small></span><em>›</em></button>`).join('')}</section>`).join('')}
  <button class="insta-setting-row logout"><i>↪</i><span><b>Выйти</b></span></button>
 </div>`;
}


const renderChatsLegacyV5 = renderChats;
const renderChatLegacyV5 = renderChat;
renderChats = function(){
 if(!isDesktopV5()) return renderChatsLegacyV5();
 const chats=[
  ['Forma Dom','Расчёт по Nube готов','14:48','2'],['Nube','Отправлена карточка товара','14:36',''],['METALNO','Срок производства 4 недели','13:42','1'],['Анна Смирнова','Спасибо!','12:18',''],['Проект Патрики','Групповой чат · 4 участника','вчера','3']
 ];
 return `<div class="desktop-messenger">
  <aside class="desktop-chat-list"><div class="desktop-chat-list-head"><h2>Чаты</h2><button onclick="toastV5('Создание группы')">＋</button></div><div class="desktop-chat-search">⌕ <input placeholder="Поиск"></div>
  <div class="desktop-chat-folders"><button class="active">Все чаты</button><button>Проекты</button><button>Поставщики</button><button>＋ Папка</button></div>
  ${chats.map((x,i)=>`<button class="desktop-chat-row ${i===0?'active':''}" onclick="currentChat='${x[0]}';route='chat';render()"><span class="chat-avatar">${x[0].slice(0,2)}</span><span><b>${x[0]}</b><small>${x[1]}</small></span><time>${x[2]}${x[3]?`<i>${x[3]}</i>`:''}</time></button>`).join('')}</aside>
  <section class="desktop-chat-empty"><span>Выберите чат</span></section></div>`;
}
renderChat = function(){
 if(!isDesktopV5()) return renderChatLegacyV5();
 const msgs=messages.filter(m=>m.chat===currentChat);
 return `<div class="desktop-messenger desktop-messenger-open">
  <aside class="desktop-chat-list">${renderChats().match(/<aside class="desktop-chat-list">([\s\S]*?)<\/aside>/)?.[1]||''}</aside>
  <section class="desktop-chat-pane">
   <header><div class="chat-avatar">${currentChat.slice(0,2).toUpperCase()}</div><div><b>${currentChat}</b><small>в сети</small></div><button onclick="openSharedMedia()">⋯</button></header>
   <div class="desktop-message-scroll">${msgs.length?msgs.map(chatMessageHTML).join(''):`<div class="desktop-chat-date">Сегодня</div><div class="bubble"><div class="bubble-text">Здравствуйте! Чем можем помочь?</div><span class="msg-time">12:40</span></div>`}</div>
   <div class="desktop-composer"><button onclick="toggleAttachPanel()">⌕</button><input id="msgInput" placeholder="Сообщение..." onkeydown="if(event.key==='Enter')sendMsg()"><button onclick="sendMsg()">➤</button></div>
  </section></div>`;
}

function openNotifications(){
 if(isDesktopV5()){
   desktopNotificationOpenV5=!desktopNotificationOpenV5;accountMenuOpenV5=false;renderDesktopOverlayV5();return;
 }
 const m=document.getElementById('modal');m.className='modal';
 m.innerHTML=`<div class="sheet notifications-sheet"><div class="sheet-title"><h3>Уведомления</h3><button class="close" onclick="closeModal()">×</button></div>
 ${[['Forma Dom обновил стоимость Nube','497 000 ₽ → 523 000 ₽','2 мин'],['Запрос на расчёт принят','Shad · Квартира на Патриках','1 ч'],['Core отгружен','Оставьте отзыв о товаре и бренде','вчера'],['Новый подписчик','Studio Line подписался на вас','вчера']].map(x=>`<div class="notification-row"><i></i><div><b>${x[0]}</b><span>${x[1]}</span></div><small>${x[2]}</small></div>`).join('')}</div>`;
}

/* expanded dynamic filters */
const MATERIAL_FILTERS_V5=['Камень','Кварцевый агломерат','Мрамор','Травертин','Оникс','Гранит','Ткань','Букле','Велюр','Рогожка','Шенилл','ЛДСП','МДФ','Массив','Шпон дуба','Шпон ореха','Корень','Дизайн-шпон','Эмаль','Нержавеющая сталь'];
function openFilters(){
 const m=document.getElementById('modal');m.className='modal';
 m.innerHTML=`<div class="sheet filters"><div class="sheet-title"><h3>Фильтры</h3><button class="close" onclick="closeModal()">×</button></div>
 ${filterSection('Категория','category',CATEGORIES)}
 ${filterSection('Материал','material',['Все',...MATERIAL_FILTERS_V5])}
 ${filterSection('Цвет','color',['Все','Светлый','Чёрный','Коричневый','Зелёный','Терракотовый','Белый'])}
 <div class="filter-block"><b>Размер</b><div class="dimension-filter-v5"><input placeholder="Ширина от"><input placeholder="до"><input placeholder="Глубина от"><input placeholder="до"><input placeholder="Высота от"><input placeholder="до"></div></div>
 <div class="filter-block"><b>Декор</b><div class="filter-options">${['Все','Однотонный','Геометрия','Флора','Абстракция'].map(x=>`<button class="filter-option">${x}</button>`).join('')}</div></div>
 <div class="price-range"><input id="minP" type="number" value="${filters.minPrice}" placeholder="Цена от"><input id="maxP" type="number" value="${filters.maxPrice}" placeholder="Цена до"></div>
 <button class="btn primary" onclick="applyFilters()">Показать</button><button class="btn" onclick="resetFilters()">Сбросить</button></div>`;
}

/* Mobile splash: only first load of current page session */
function initSplashV5(){
 const s=document.getElementById('mobileSplash'); if(!s)return;
 if(isDesktopV5()){s.remove();return}
 requestAnimationFrame(()=>s.classList.add('visible'));
 setTimeout(()=>{s.classList.add('hide');setTimeout(()=>s.remove(),350)},950);
}

/* Floating support only desktop */
function ensureSupportBubbleV5(){
 let b=document.getElementById('supportBubbleV5');
 if(isDesktopV5()){
  if(!b){b=document.createElement('button');b.id='supportBubbleV5';b.className='support-bubble-v5';b.textContent='?';b.onclick=openSupportV5;document.body.appendChild(b)}
 } else b?.remove();
}

/* Shared mobile gutters and shell are updated after every render */
const renderCoreV5 = render;
render = function(){
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
 else if(route==='support')v.innerHTML=renderSupportV5();
 shellSyncV5();ensureSupportBubbleV5();
};
window.addEventListener('resize',()=>{const before=document.body.classList.contains('is-desktop');shellSyncV5();const after=document.body.classList.contains('is-desktop');if(before!==after)render()});
setTimeout(initSplashV5,0);

render();


/* ==================== SREDA v6.0 consolidated UX ==================== */
let productReturnV6 = null;
let projectPostV6 = null;
let projectMenuOpenV6 = false;
let moderatorHistoryTitleV6 = '';
let selectedSupportTicketV6 = null;
let supportStatusFilterV6 = 'Все';
let customAnalyticsOpenV6 = false;

function iconV6(name, alt=''){ return `<img class="v6-icon" src="assets/icons/${name}-v6.png" alt="${alt}">`; }
function v6Escape(s){ return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

const openProductBaseV6 = openProduct;
openProduct = function(id){
  if(route==='profile' && profileRole==='moderator'){
    productReturnV6={route:'profile',role:'moderator',section:moderationSectionV5,type:moderationTypeV5,status:moderationStatusV5};
  } else if(route==='designerProject'){
    productReturnV6={route:'designerProject'};
  } else {
    productReturnV6={route:route};
  }
  return openProductBaseV6(id);
};
function productBackV6(){
  if(productReturnV6?.role==='moderator'){
    profileRole='moderator'; moderationSectionV5=productReturnV6.section||'verification';
    moderationTypeV5=productReturnV6.type||'all'; moderationStatusV5=productReturnV6.status||'pending';
    route='profile'; render(); scrollTo(0,0); return;
  }
  if(productReturnV6?.route==='designerProject'){route='designerProject';render();return;}
  go('home');
}

/* Desktop picker is a compact dropdown; mobile stays a bottom sheet. */
function pickerButtonHTMLV5(label,value,items){
 return `<button class="v4-picker" onclick='openPickerV6(this,${JSON.stringify(label)},${JSON.stringify(items)})'><span><small>${label}</small><b>${value}</b></span><em>⌄</em></button>`;
}
function openPickerV6(anchor,title,items){
 if(!isDesktopV5()) return openPickerV4(title,items);
 document.querySelector('.desktop-picker-v6')?.remove();
 const r=anchor.getBoundingClientRect();
 const box=document.createElement('div'); box.className='desktop-picker-v6';
 box.style.left=`${Math.max(12,r.left)}px`; box.style.top=`${r.bottom+6}px`; box.style.width=`${r.width}px`;
 box.innerHTML=`<small>${v6Escape(title)}</small>${items.map((x,i)=>`<button onclick="this.closest('.desktop-picker-v6').remove()">${v6Escape(x)}${i===0?'<span>✓</span>':''}</button>`).join('')}`;
 document.body.appendChild(box);
 setTimeout(()=>document.addEventListener('pointerdown',function close(e){if(!box.contains(e.target)&&e.target!==anchor){box.remove();document.removeEventListener('pointerdown',close)}}, {capture:true}),0);
}

/* Centered specification modal + custom radio state */
specModal = function(){
 const m=document.getElementById('modal');m.className='modal v6-spec-modal';
 m.innerHTML=`<div class="sheet v6-spec-sheet"><div class="sheet-title"><h3>Добавить в спецификацию</h3><button class="close" onclick="closeModal()">×</button></div>
 ${Object.keys(specData).map((x,i)=>`<label class="project-card v6-project-radio"><span><b>${x}</b><small>${i===0?'Москва, 120 м²':i===1?'Московская обл., 250 м²':'Москва, 300 м²'}</small></span><input type="radio" name="p" ${i===0?'checked':''}><i></i></label>`).join('')}
 <button class="btn v6-modal-action">＋ Создать новый проект</button>
 <div class="field"><label>Помещение</label><select class="v6-room-select"><option>Гостиная</option><option>Спальня</option><option>Ванная</option><option>Кабинет</option></select></div>
 <button class="btn primary v6-modal-action" onclick="closeModal()">Добавить</button></div>`;
};

/* Product card */
renderProductV4 = function(){
 const p=currentProduct; const sizes=p.bedSizes||p.sizes||['Стандарт'];
 const mobile=`<div class="mobile-product-v6">
  <div class="product-hero v4-product-hero">
    <img src="${p.image}" alt="${p.name}">
    <button class="mobile-product-back-v6" onclick="productBackV6()" aria-label="Назад">${iconV6('back','Назад')}</button>
    <div class="product-actions-top v6-product-actions">
      <button onclick="shareProductV4('${p.id}')" aria-label="Поделиться">${iconV6('share','Поделиться')}</button>
      <button class="fav-v6 ${favorites.has(p.id)?'is-favorite':''}" onclick="toggleFav('${p.id}',event)">${favorites.has(p.id)?'♥':'♡'}</button>
    </div>
  </div>
  <div class="product-content mobile-gutter">${productDetailsV5(p,sizes)}</div></div>`;
 const desktop=`<div class="desktop-product-page">
   <div class="desktop-product-gallery">
     <button class="desktop-back v6-desktop-back" onclick="productBackV6()">${iconV6('back','Назад')}</button>
     <img class="desktop-main-product-img" src="${p.image}" alt="${p.name}">
     <div class="desktop-thumb-row"><img src="${p.image}"><img src="${findVisualForProductV5(p)}"><img src="${p.image}"></div>
   </div>
   <aside class="desktop-product-info">
     <button class="desktop-brand-link" onclick="openBrandV4('${p.brand}')">${p.brand}<span>›</span></button>
     <small>${p.type}</small>
     <div class="desktop-product-title"><h1>${p.name}</h1><strong>${p.priceLabel}</strong></div>
     ${pickerButtonHTMLV5('Отделка',(p.finishes||['Стандарт'])[0],p.finishes||['Стандарт'])}
     ${pickerButtonHTMLV5(p.bedSizes?'Спальное место':'Размер / формат',sizes[0],sizes)}
     <div class="desktop-product-cta"><button class="primary" onclick="specModal()">Добавить в спецификацию</button><button onclick="requestCalc()">Запросить расчёт</button></div>
     <div class="desktop-meta"><span>Срок производства</span><b>${p.production}</b></div>
     <div class="desktop-inline-icons v6-desktop-save-only"><button class="${favorites.has(p.id)?'is-favorite':''}" onclick="toggleFav('${p.id}',event)">${favorites.has(p.id)?'♥ Сохранено':'♡ В избранное'}</button></div>
     <section class="desktop-description-v6"><h3>Описание</h3><p>${p.description}</p></section>
     <div class="v4-accordions desktop-product-accordions v6-clean-accordions">
       ${accordionV4('Характеристики',`<p>Материал: ${p.material||'—'}<br>Наличие: ${p.availability||'—'}<br>Цвет: ${p.color||'—'}</p>`)}
       ${accordionV4('Схема с размерами',`<div class="doc-preview"><div class="dimension-demo">↔ ${sizes[0]}</div><small>Изображение или PDF поставщика.</small></div>`)}
       ${accordionV4('Инструкция',`<div class="doc-row">PDF · Инструкция <button>Открыть</button></div>`)}
       ${accordionV4('Рекомендации по уходу',`<p>Использовать мягкую сухую ткань. Для текстиля рекомендована профессиональная химчистка.</p>`)}
       ${accordionV4('Отзывы',`<div class="review-mini"><b>4,9 ★</b><span>12 отзывов о товаре · 4,8 ★ о бренде</span></div>`)}
     </div>
   </aside>
   <section class="desktop-similar"><h2>Похожие товары</h2><div class="desktop-product-grid">${PRODUCTS.filter(x=>x.id!==p.id&&(x.category===p.category||x.type===p.type)).slice(0,4).map(desktopProductCardV5).join('')}</div></section>
 </div>`;
 return isDesktopV5()?desktop:mobile;
};

/* Brand profile – same visual grammar as personal profiles, no giant black bars. */
renderBrandV4 = function(){
 const products=PRODUCTS.filter(p=>p.brand===currentBrandV4), key='brand:'+currentBrandV4;
 const tabs=[['products','Товары'],['projects','Проекты'],['about','О бренде']];
 if(isDesktopV5()){
  return `<div class="desktop-brand-page v6-brand-page">
    <header class="desktop-brand-head"><div class="desktop-brand-identity"><div class="brand-avatar">${currentBrandV4.slice(0,2).toUpperCase()}</div><div><h1>${currentBrandV4}</h1>${currentBrandV4==='Forma Dom'?'<span class="platform-member">Участник площадки</span>':''}<p>Поставщик мебели · Москва</p></div></div>
    <div class="desktop-brand-actions"><button onclick="currentChat='${currentBrandV4}';route='chat';render()">Отправить сообщение</button>${followButtonV4(key)}</div></header>
    ${isPartnerDesignerV4()&&currentBrandV4==='Forma Dom'?`<div class="desktop-partner-note">Ваша партнёрская скидка <b>15%</b></div>`:''}
    <nav class="desktop-brand-tabs">${tabs.map(([k,n])=>`<button class="${brandTabV4===k?'active':''}" onclick="brandTabV4='${k}';render()">${n}</button>`).join('')}</nav>
    ${brandTabV4==='products'?`${desktopBrandFiltersV5(products)}<div class="desktop-brand-masonry">${products.filter(brandFilterMatchV5).map(desktopProductCardV5).join('')}</div>`:brandTabV4==='projects'?renderBrandProjectsV5():renderBrandAboutV4()}
  </div>`;
 }
 return `<div class="mobile-brand-profile-v6 mobile-gutter">
   <div class="mobile-brand-profile-head"><div class="mobile-profile-avatar brand-avatar-mobile">${currentBrandV4.slice(0,2).toUpperCase()}</div><div><h1>${currentBrandV4}</h1><p>Поставщик мебели · Москва</p>${currentBrandV4==='Forma Dom'?'<span class="platform-member">Участник площадки</span>':''}</div></div>
   <div class="mobile-brand-actions-v6"><button onclick="currentChat='${currentBrandV4}';route='chat';render()">Сообщение</button>${followButtonV4(key)}</div>
   ${isPartnerDesignerV4()&&currentBrandV4==='Forma Dom'?`<div class="partner-discount"><small>Ваша партнёрская скидка</small><b>15%</b></div>`:''}
   <div class="public-tabs">${tabs.map(([k,n])=>`<button class="${brandTabV4===k?'active':''}" onclick="brandTabV4='${k}';render()">${n}</button>`).join('')}</div>
   ${brandTabV4==='products'?`<div class="masonry">${products.map(feedCardV4).join('')}</div>`:brandTabV4==='projects'?renderBrandProjectsV4():renderBrandAboutV4()}
 </div>`;
};

/* Unified designer profile, restored specification */
renderDesignerProfileUnifiedV5 = function(own){
 const key='designer:'+currentDesignerV4;
 const verified=`<img class="verified-icon-v6" src="assets/icons/verified-v6.png" alt="Верифицирован">`;
 if(isDesktopV5()){
  return `<div class="desktop-designer-profile">
   <header class="desktop-designer-head"><div class="designer-avatar">АС</div><div><h1>Анна Смирнова ${verified}</h1><p>Дизайнер интерьеров · Москва</p></div>
   <div class="desktop-designer-actions">${own?`<button onclick="openDesignerV4('Анна Смирнова')">Публичный профиль</button><button onclick="openSettingsV4()">Редактировать профиль</button>`:`${followButtonV4(key)}<button onclick="currentChat='Анна Смирнова';route='chat';render()">Сообщение</button>`}</div></header>
   <div class="desktop-designer-stats"><div><b>24</b><span>Проекты</span></div><div><b>1 245</b><span>Подписчики</span></div><div><b>320</b><span>Подписки</span></div></div>
   ${own?`<div class="desktop-profile-quick"><button onclick="profileTab='analytics';render()">Аналитика</button><button onclick="openSettingsV4()">Редактировать</button><button onclick="shareProfileV5()">Поделиться профилем</button></div>`:''}
   <p class="desktop-bio">Жилые и общественные интерьеры. Москва / Европа.</p>
   <div class="desktop-designer-tabs"><button class="${designerTabV4==='projects'?'active':''}" onclick="designerTabV4='projects';render()">Проекты</button><button class="${designerTabV4==='saved'?'active':''}" onclick="designerTabV4='saved';render()">Публикации</button>${own?`<button class="${designerTabV4==='specs'?'active':''}" onclick="designerTabV4='specs';render()">Спецификация</button>`:''}</div>
   ${designerTabV4==='projects'?renderDesignerProjectsV5():designerTabV4==='specs'?renderSpecsRoot():`<div class="desktop-brand-masonry">${VISUALS.map(desktopVisualCardV5).join('')}</div>`}
  </div>`;
 }
 return `<div class="mobile-profile-unified mobile-gutter">
   ${own?`<div class="mobile-role-tabs v6-role-tabs"><button class="active" onclick="profileRole='designer';render()">Дизайнер</button><button onclick="profileRole='supplier';render()">Поставщик</button><button onclick="profileRole='moderator';render()">Модератор</button></div>`:''}
   <div class="mobile-profile-top-actions"><span></span>${own?`<button class="hamburger-v5" onclick="openSettingsV4()">☰</button>`:''}</div>
   <div class="mobile-profile-avatar">АС</div>
   <h1 class="v6-name-line">Анна Смирнова ${verified}</h1><p class="mobile-profile-sub">Дизайнер интерьеров · Москва</p>
   <div class="stats mobile-stats"><div><b>24</b><small>Проекты</small></div><div><b>1 245</b><small>Подписчики</small></div><div><b>320</b><small>Подписки</small></div></div>
   ${own?`<div class="mobile-profile-quick"><button onclick="profileTab='analytics';render()">Аналитика</button><button onclick="openSettingsV4()">Редактировать</button><button onclick="shareProfileV5()">Поделиться профилем</button></div>`:`<div class="public-actions">${followButtonV4(key)}<button class="v4-message" onclick="currentChat='Анна Смирнова';route='chat';render()">Сообщение</button></div>`}
   <p class="mobile-profile-bio">Жилые и общественные интерьеры. Москва / Европа.</p>
   <div class="public-tabs mobile-profile-tabs v6-icon-tabs">
     <button title="Проекты" class="${designerTabV4==='projects'?'active':''}" onclick="designerTabV4='projects';render()">${iconV6('projects-tab','Проекты')}</button>
     ${own?`<button title="Спецификация" class="${designerTabV4==='specs'?'active':''}" onclick="designerTabV4='specs';currentProject=null;render()">${iconV6('spec','Спецификация')}</button>`:''}
     <button class="${designerTabV4==='saved'?'active':''}" onclick="designerTabV4='saved';render()">Публикации</button>
   </div>
   ${designerTabV4==='projects'?renderDesignerProjectsV4():designerTabV4==='specs'?renderSpecsRoot():`<div class="masonry mobile-profile-grid">${VISUALS.map(feedCardV4).join('')}</div>`}
 </div>`;
};

/* Project page: compact masonry desktop, separate download row mobile, dots settings */
renderDesignerProjectV4 = function(){
 const p=DESIGNER_PROJECTS_V4.find(x=>x.id===currentProject)||DESIGNER_PROJECTS_V4[0];
 const supplierAccess=(profileRole==='supplier'), canDownload=(profileRole==='supplier'||profileRole==='designer');
 const imageHtml=(r)=>r.images.map((img,i)=>`<button class="project-image-button-v6" onclick="openProjectPostV6('${img}','${r.name}')"><img src="${img}"></button>`).join('');
 if(isDesktopV5()){
  return `<div class="desktop-project-page-v5 v6-project-desktop">
   <header><button class="mobile-back-v5" onclick="route='designerPublic';render()">${iconV6('back','Назад')}</button><h1>${p.title}</h1><span></span></header>
   ${canDownload?`<button class="project-download-row-v6" onclick="downloadProjectV5('${p.title}')">↓ Скачать проект</button>`:''}
   ${p.rooms.map(r=>`<section><h2>${r.name}</h2><div class="desktop-room-grid">${imageHtml(r)}</div>${supplierAccess?'<button class="room-spec-link">Открыть спецификацию комнаты →</button>':''}</section>`).join('')}
  </div>`;
 }
 return `<div class="designer-project-page mobile-gutter">
  <div class="mobile-project-toolbar v6-project-toolbar"><button class="mobile-back-v5" onclick="route='designerPublic';render()">${iconV6('back','Назад')}</button><b>${p.title}</b><button class="project-more-v6" onclick="projectMenuOpenV6=!projectMenuOpenV6;render()">${iconV6('more','Ещё')}</button></div>
  ${projectMenuOpenV6?`<div class="project-popover-v6"><button onclick="toastV5('Редактирование проекта')">Редактировать проект</button><button onclick="toastV5('Настройки видимости проекта')">Видимость проекта</button></div>`:''}
  ${canDownload?`<button class="project-download-row-v6" onclick="downloadProjectV5('${p.title}')">↓ Скачать проект</button>`:''}
  <div class="room-folders">${p.rooms.map(r=>`<section><h3>${r.name}</h3><div class="project-room-grid">${imageHtml(r)}</div>${supplierAccess?'<button class="room-spec-link">Открыть спецификацию комнаты →</button>':''}</section>`).join('')}</div>
 </div>`;
};
function openProjectPostV6(img,room){ projectPostV6={img,room}; route='projectPostV6'; render(); scrollTo(0,0); }
function renderProjectPostV6(){
 const p=DESIGNER_PROJECTS_V4.find(x=>x.id===currentProject)||DESIGNER_PROJECTS_V4[0], post=projectPostV6||{img:p.cover,room:'Гостиная'};
 const linked=PRODUCTS.filter(x=>['Forma Dom','METALNO'].includes(x.brand)).slice(0,3);
 const similar=PRODUCTS.filter(x=>!linked.includes(x)).slice(0,6);
 return `<div class="project-post-v6 mobile-gutter">
   <div class="project-post-head">${mobileBackV5("route='designerProject';render()")}<div><b>Анна Смирнова</b><small>${p.title} · ${post.room}</small></div><button>${iconV6('more','Ещё')}</button></div>
   <img class="project-post-image" src="${post.img}" alt="">
   <div class="project-social-v6"><button onclick="this.classList.toggle('liked');this.textContent=this.classList.contains('liked')?'♥':'♡'">♡</button><button onclick="document.getElementById('projectCommentV6').focus()">◯</button><button onclick="toastV5('Можно отправить в чат')">${iconV6('messages','Отправить')}</button><span>124 отметки «Нравится»</span></div>
   <div class="project-comments-v6"><p><b>anna.smirnova</b> ${p.title}, ${post.room}</p><button>Посмотреть все 18 комментариев</button><div><input id="projectCommentV6" placeholder="Добавить комментарий…"><button>Отправить</button></div></div>
   <section><h2>Товары на этой визуализации</h2><div class="horizontal">${linked.map(x=>`<div class="mini" onclick="openProduct('${x.id}')"><img src="${x.image}"><b>${x.name}</b><small>${x.priceLabel}</small></div>`).join('')}</div></section>
   <section><h2>Похожие товары</h2><div class="masonry">${similar.map(feedCardV4).join('')}</div></section>
 </div>`;
}

/* Supplier profile mobile icons, desktop consistency */
supplierMobileV5 = function(){
 const tabs=[['cards','products','Товары'],['requests','requests','Запросы'],['analytics','analytics','Аналитика'],['marks','projects-tab','Отметки']];
 return `<div class="mobile-supplier-profile mobile-gutter">
  <div class="mobile-role-tabs v6-role-tabs"><button onclick="profileRole='designer';render()">Дизайнер</button><button class="active">Поставщик</button><button onclick="profileRole='moderator';render()">Модератор</button></div>
  <div class="mobile-profile-top-actions"><span></span><button class="hamburger-v5" onclick="openSettingsV4()">☰</button></div>
  <div class="mobile-profile-avatar brand-avatar-mobile">FD</div><h1>Forma Dom</h1><p class="mobile-profile-sub">Поставщик мебели · Москва</p>
  <div class="mobile-profile-quick"><button onclick="profileTab='analytics';render()">Аналитика</button><button onclick="openSettingsV4()">Редактировать</button><button onclick="shareProfileV5()">Поделиться профилем</button></div>
  <div class="profile-tabs supplier-tabs v6-icon-tabs">${tabs.map(([t,ic,n])=>`<button title="${n}" class="profile-tab ${profileTab===t?'active':''}" onclick="profileTab='${t}';render()">${iconV6(ic,n)}</button>`).join('')}</div>
  ${profileTab==='cards'?renderSupplierCardsV4():profileTab==='analytics'?renderSupplierAnalyticsV4():profileTab==='requests'?renderSupplierRequests():renderSupplierMarks()}
 </div>`;
};

/* Orders: compact, 16px title/order/status + image + designer */
renderOrdersV5 = function(){
 const rows=[
  {no:'№ 1284',name:'Nube',project:'Квартира на Патриках',designer:'Анна Смирнова',status:'В производстве',img:'assets/products/nube.webp'},
  {no:'№ 1279',name:'Shad',project:'Спальня',designer:'Анна Смирнова',status:'Отгружено · Оставить отзыв',img:'assets/products/shad.webp'}
 ];
 return `<div class="orders-v6"><h2>Заказы</h2>${rows.map(x=>`<article><img src="${x.img}"><div><b>${x.no}</b><strong>${x.name}</strong><small>${x.project} · ${x.designer}</small></div><span>${x.status}</span></article>`).join('')}</div>`;
};

/* Universal analytics period controls */
function analyticsControlsV6(kind){
 return `<div class="analytics-controls-v6">
   <div class="analytics-periods-v6">${[['7d','7 дней'],['1m','30 дней'],['6m','Полгода'],['1y','Год'],['custom','Свой период']].map(([k,n])=>`<button class="${analyticsPeriod===k?'active':''}" onclick="analyticsPeriod='${k}';customAnalyticsOpenV6=${k==='custom'};render()">${n}</button>`).join('')}</div>
   ${analyticsPeriod==='custom'?`<div class="analytics-dates-v6"><label>С<input type="date" value="2026-08-01"></label><label>По<input type="date" value="2026-08-31"></label></div>`:''}
   <button class="excel-download" onclick="downloadAnalyticsExcelV5('${kind}')">↓ Скачать</button>
 </div>`;
}
const supplierAnalyticsBaseV6 = _renderSupplierAnalyticsV4;
renderSupplierAnalyticsV4 = function(){ return `${analyticsControlsV6('аналитика-поставщика')}${supplierAnalyticsBaseV6()}`; };
const productAnalyticsBaseV6 = _renderProductAnalyticsV4;
renderProductAnalyticsV4 = function(){ return `<div class="product-analytics-wrap">${analyticsControlsV6('аналитика-товара')}${productAnalyticsBaseV6()}</div>`; };

/* Moderator mobile as settings-like list, desktop full analytics/history/support */
moderatorMobileV5 = function(){
 return `<div class="moderator mobile-gutter">
   <div class="mobile-role-tabs v6-role-tabs"><button onclick="profileRole='designer';render()">Дизайнер</button><button onclick="profileRole='supplier';render()">Поставщик</button><button class="active">Модератор</button></div>
   <div class="moderator-head"><div><small>Личный кабинет</small><h2>Модератор</h2></div><span class="moderation-badge">7 новых</span></div>
   <div class="moderator-list-v6">
    <button onclick="moderationSectionV5='verification';render()"><span><b>Верификация</b><small>Товары, бренды и пользователи</small></span><em>›</em></button>
    <button onclick="moderationSectionV5='analytics';render()"><span><b>Аналитика</b><small>Активность и ошибки приложения</small></span><em>›</em></button>
    <button onclick="moderationSectionV5='support';render()"><span><b>Поддержка</b><small>Запросы пользователей</small></span><em>›</em></button>
   </div>${moderationSectionV5==='verification'?moderatorVerificationMobileV6():moderationSectionV5==='analytics'?moderatorAnalyticsV5():moderatorSupportV5()}
 </div>`;
};
function moderatorVerificationMobileV6(){
 const items=[['Все','all'],['Товары','Товар'],['Бренды','Бренд'],['Дизайнеры','Дизайнер'],['Поставщики','Поставщик'],['На рассмотрении','pending'],['Архив','archive']];
 return `<div class="moderator-sublist-v6">${items.map(([n,k])=>`<button onclick="${k==='pending'||k==='archive'?`moderationStatusV5='${k}'`:`moderationTypeV5='${k}'`};render()"><span>${n}</span><em>›</em></button>`).join('')}</div><div class="moderator-mobile-results-v6">${moderatorVerificationV5()}</div>`;
}

moderatorAnalyticsV5 = function(){
 const metrics=[['Новые пользователи','428'],['Активные пользователи','4 812'],['Бренды','184'],['Товары','3 942'],['Добавлено в спецификации','12 840'],['Запросы расчёта','1 624'],['Ошибки приложения','37']];
 return `<div class="moderator-analytics">${analyticsControlsV6('аналитика-платформы')}
   <div class="analytics-summary">${metrics.map(x=>`<button class="metric-card" onclick="openModeratorHistoryV6('${x[0]}')"><small>${x[0]}</small><b>${x[1]}</b></button>`).join('')}</div>
   <div class="analytics-extra"><div><b>Ручные позиции дизайнеров</b><span>Шторы · столярные изделия · искусство</span></div><div><b>Чего не хватает в каталоге</b><span>Декоративный свет · двери · текстиль на заказ</span></div></div>
 </div>`;
};
function openModeratorHistoryV6(title){ moderatorHistoryTitleV6=title; route='moderatorHistoryV6'; render(); scrollTo(0,0); }
function renderModeratorHistoryV6(){
 const isErrors=moderatorHistoryTitleV6==='Ошибки приложения';
 const rows=isErrors?[
  ['TypeError','Карточка товара','Анна Смирнова','iPhone / Safari','31.08.2026','21:42','Ошибка открытия PDF'],
  ['NetworkError','Сообщения','Forma Dom','Chrome / macOS','31.08.2026','19:18','Не загрузилось вложение'],
  ['UI overflow','Фильтры','Анна Смирнова','iPhone / Safari','31.08.2026','18:53','Нижнее меню перекрыло кнопку']
 ]:[
  ['Действие','Анна Смирнова','Дизайнер','Nube · Квартира на Патриках','31.08.2026','14:42'],
  ['Действие','Forma Dom','Поставщик','Shad','31.08.2026','13:18'],
  ['Действие','Елена Крылова','Дизайнер','Core','30.08.2026','18:05']
 ];
 return `<div class="moderator-history-v6">${mobileBackV5("profileRole='moderator';moderationSectionV5='analytics';route='profile';render()")}<h1>${moderatorHistoryTitleV6}</h1>${analyticsControlsV6('история')}
 <div class="history-table-v6">${rows.map(r=>`<div>${r.map((c,i)=>`<span class="c${i}">${c}</span>`).join('')}</div>`).join('')}</div></div>`;
}

/* Moderator support = Telegram-like ticket messenger */
moderatorSupportV5 = function(){
 const filtered=supportTicketsV5.filter(t=>supportStatusFilterV6==='Все'||t.status===supportStatusFilterV6);
 if(isDesktopV5()){
  const selected=selectedSupportTicketV6||filtered[0]?.id, t=supportTicketsV5.find(x=>x.id===selected);
  return `<div class="support-messenger-v6">
   <aside><div class="support-status-tabs-v6">${['Все','Новый','В работе','Закрыт'].map(s=>`<button class="${supportStatusFilterV6===s?'active':''}" onclick="supportStatusFilterV6='${s}';render()">${s}</button>`).join('')}</div>
   ${filtered.map(x=>`<button class="ticket-row-v6 ${selected===x.id?'active':''}" onclick="selectedSupportTicketV6='${x.id}';render()"><b>${x.id}</b><span>${x.subject}</span><small>${x.user} · ${x.date}</small><em>${x.status}</em></button>`).join('')}</aside>
   ${t?supportConversationV6(t):'<section class="support-empty-v6">Выберите обращение</section>'}
  </div>`;
 }
 return `<div class="support-mobile-v6"><div class="support-status-tabs-v6">${['Все','Новый','В работе','Закрыт'].map(s=>`<button class="${supportStatusFilterV6===s?'active':''}" onclick="supportStatusFilterV6='${s}';render()">${s}</button>`).join('')}</div>
 ${filtered.map(x=>`<button class="ticket-row-v6" onclick="selectedSupportTicketV6='${x.id}';openSupportTicketV5('${x.id}')"><b>${x.id}</b><span>${x.subject}</span><small>${x.user} · ${x.date}</small><em>${x.status}</em></button>`).join('')}</div>`;
};
function supportConversationV6(t){
 return `<section class="support-conversation-v6"><header><div><b>${t.id} · ${t.subject}</b><small>${t.user} · ${t.role}</small></div><select><option>${t.status}</option><option>Новый</option><option>В работе</option><option>Ожидаем пользователя</option><option>Решён</option><option>Закрыт</option></select></header>
 <div class="support-messages-v6"><div class="support-bubble incoming">Здравствуйте! Подскажите, пожалуйста, как решить этот вопрос в сервисе?<small>12:40</small></div><div class="support-bubble outgoing">Здравствуйте! Проверяем обращение.<small>12:44 ✓✓</small></div></div>
 <div class="support-composer-v6"><label>＋<input type="file" accept="image/*,.pdf" hidden onchange="toastV5('Файл прикреплён')"></label><input placeholder="Сообщение..."><button>↑</button></div></section>`;
}
openSupportTicketV5 = function(id){
 const t=supportTicketsV5.find(x=>x.id===id); if(!t)return;
 const m=document.getElementById('modal');m.className='modal';
 m.innerHTML=`<div class="sheet support-ticket-sheet-v6"><div class="sheet-title"><div><h3>${t.id} · ${t.subject}</h3><small>${t.user} · ${t.role}</small></div><button class="close" onclick="closeModal()">×</button></div>
 <div class="support-messages-v6"><div class="support-bubble incoming">Здравствуйте! Подскажите, пожалуйста, как решить этот вопрос в сервисе?<small>12:40</small></div></div>
 <select class="support-status-select-v6"><option>${t.status}</option><option>В работе</option><option>Ожидаем пользователя</option><option>Решён</option><option>Закрыт</option></select>
 <div class="support-composer-v6"><label>＋<input type="file" accept="image/*,.pdf" hidden onchange="toastV5('Файл прикреплён')"></label><input placeholder="Сообщение..."><button onclick="toastV5('Ответ отправлен')">↑</button></div></div>`;
};

/* Filters: all sections expandable, compact range rows */
openFilters = function(){
 const m=document.getElementById('modal');m.className='modal';
 const section=(title,body,open='')=>`<details class="filter-detail-v6" ${open}><summary>${title}<span>⌄</span></summary><div>${body}</div></details>`;
 m.innerHTML=`<div class="sheet filters v6-filter-sheet"><div class="sheet-title"><h3>Фильтры</h3><button class="close" onclick="closeModal()">×</button></div>
 ${section('Категория',filterSectionBodyV6('category',CATEGORIES))}
 ${section('Материал',filterSectionBodyV6('material',['Все',...MATERIAL_FILTERS_V5]))}
 ${section('Цвет',filterSectionBodyV6('color',['Все','Светлый','Чёрный','Коричневый','Зелёный','Терракотовый','Белый']))}
 ${section('Размер',`<div class="range-grid-v6"><label>Ширина<input placeholder="от"><input placeholder="до"></label><label>Глубина<input placeholder="от"><input placeholder="до"></label><label>Высота<input placeholder="от"><input placeholder="до"></label></div>`)}
 ${section('Декор',`<div class="filter-options">${['Все','Однотонный','Геометрия','Флора','Абстракция'].map(x=>`<button class="filter-option">${x}</button>`).join('')}</div>`)}
 ${section('Цена',`<div class="price-range-v6"><input id="minP" type="number" value="${filters.minPrice}" placeholder="от, ₽"><input id="maxP" type="number" value="${filters.maxPrice}" placeholder="до, ₽"></div>`)}
 <div class="filter-actions-v6"><button class="btn primary" onclick="applyFilters()">Показать</button><button class="btn" onclick="resetFilters()">Сбросить</button></div></div>`;
};
function filterSectionBodyV6(key,arr){ return `<div class="filter-options">${arr.map(x=>`<button class="filter-option" onclick="setFilter('${key}','${String(x).replace(/'/g,"\\'")}',this)">${x}</button>`).join('')}</div>`; }

/* Notifications mobile safe area */
openNotifications = function(){
 if(isDesktopV5()){ desktopNotificationOpenV5=!desktopNotificationOpenV5; accountMenuOpenV5=false; renderDesktopOverlayV5(); return; }
 const m=document.getElementById('modal');m.className='modal';
 m.innerHTML=`<div class="sheet notifications-sheet v6-safe-sheet"><div class="sheet-title"><h3>Уведомления</h3><button class="close" onclick="closeModal()">×</button></div>
 ${[['Forma Dom обновил стоимость Nube','497 000 ₽ → 523 000 ₽','2 мин'],['Запрос на расчёт принят','Shad · Квартира на Патриках','1 ч'],['Core отгружен','Оставьте отзыв о товаре и бренде','вчера'],['Новый подписчик','Studio Line подписался на вас','вчера']].map(x=>`<div class="notification-row"><i></i><div><b>${x[0]}</b><span>${x[1]}</span></div><small>${x[2]}</small></div>`).join('')}</div>`;
};

/* Favorites category typography + robust active-heart classes applied after render */
function enhanceV6(){
 document.querySelectorAll('.feed-heart,.desktop-card button,.product-actions-top button,.desktop-inline-icons button').forEach(b=>{
   if((b.textContent||'').trim().startsWith('♥')) b.classList.add('is-favorite');
 });
}
const renderBeforeV6 = render;
render = function(){
 const v=document.getElementById('view');
 if(route==='projectPostV6') v.innerHTML=renderProjectPostV6();
 else if(route==='moderatorHistoryV6') v.innerHTML=renderModeratorHistoryV6();
 else renderBeforeV6();
 shellSyncV5(); ensureSupportBubbleV5(); setTimeout(enhanceV6,0);
};


/* ==================== SREDA v6.1 project desktop layout ==================== */
function desktopProjectCategoriesV61(){
  if(!isDesktopV5()) return '';
  return `<div class="desktop-project-categories-v61">
    ${CATEGORIES.map((c,i)=>`<button class="${i===0?'active':''}" onclick="go('home')">${c}</button>`).join('')}
    <div class="desktop-project-search-v61"><input placeholder="Поиск"><img src="assets/icons/search-v6.png" alt=""></div>
  </div>`;
}

renderDesignerProjectV4 = function(){
 const p=DESIGNER_PROJECTS_V4.find(x=>x.id===currentProject)||DESIGNER_PROJECTS_V4[0];
 const supplierAccess=(profileRole==='supplier'), canDownload=(profileRole==='supplier'||profileRole==='designer');

 const allRoomCards = p.rooms.map((r,ri)=>`
   <section class="project-room-section-v61">
     <div class="project-room-title-v61"><h2>${r.name}</h2></div>
     <div class="project-pinterest-grid-v61">
       ${r.images.map((img,i)=>`
         <button class="project-pin-v61 ${((i+ri)%3===1)?'tall':''} ${((i+ri)%4===2)?'wide':''}" onclick="openProjectPostV6('${img}','${r.name}')">
           <img src="${img}" alt="${r.name}">
         </button>`).join('')}
     </div>
     ${supplierAccess?'<button class="room-spec-link">Открыть спецификацию комнаты →</button>':''}
   </section>`).join('');

 if(isDesktopV5()){
  return `${desktopProjectCategoriesV61()}
  <div class="desktop-project-page-v61">
    <div class="project-topline-v61">
      <button class="project-back-v61" onclick="route='designerPublic';render()">${iconV6('back','Назад')}</button>
      <div class="project-title-block-v61">
        <h1>${p.title}</h1>
        ${canDownload?`<button class="project-download-v61" onclick="downloadProjectV5('${p.title}')">↓ Скачать проект</button>`:''}
      </div>
      <button class="project-more-v61" onclick="projectMenuOpenV6=!projectMenuOpenV6;render()">${iconV6('more','Ещё')}</button>
      ${projectMenuOpenV6?`<div class="project-popover-v6 project-popover-desktop-v61"><button onclick="toastV5('Редактирование проекта')">Редактировать проект</button><button onclick="toastV5('Настройки видимости проекта')">Видимость проекта</button></div>`:''}
    </div>
    ${allRoomCards}
  </div>`;
 }

 return `<div class="designer-project-page mobile-gutter">
  <div class="mobile-project-toolbar v6-project-toolbar"><button class="mobile-back-v5" onclick="route='designerPublic';render()">${iconV6('back','Назад')}</button><b>${p.title}</b><button class="project-more-v6" onclick="projectMenuOpenV6=!projectMenuOpenV6;render()">${iconV6('more','Ещё')}</button></div>
  ${projectMenuOpenV6?`<div class="project-popover-v6"><button onclick="toastV5('Редактирование проекта')">Редактировать проект</button><button onclick="toastV5('Настройки видимости проекта')">Видимость проекта</button></div>`:''}
  ${canDownload?`<button class="project-download-row-v6" onclick="downloadProjectV5('${p.title}')">↓ Скачать проект</button>`:''}
  <div class="room-folders">${p.rooms.map(r=>`<section><h3>${r.name}</h3><div class="project-room-grid">${r.images.map(img=>`<button class="project-image-button-v6" onclick="openProjectPostV6('${img}','${r.name}')"><img src="${img}"></button>`).join('')}</div>${supplierAccess?'<button class="room-spec-link">Открыть спецификацию комнаты →</button>':''}</section>`).join('')}</div>
 </div>`;
};


/* ==================== SREDA v6.3 desktop compact categories ==================== */
const DESKTOP_CATEGORY_GROUPS_V63 = [
  ['Мебель', ['Стулья','Столы','Комоды','Тумбы','Шкафы','Буфеты','Кровати','Диваны','Кресла','Журнальные столики','Гардеробные','Банкетки','Пуфы']],
  ['Напольные покрытия', ['Инженерная доска','Керамогранит','Микроцемент','Ковролин']],
  ['Настенные покрытия', ['Обои','Краска','Фреска','Штукатурка','Керамогранит','Лепнина']],
  ['Сантехника', ['Раковина','Мойки','Смесители','Душевые стойки','Душевые комплекты','Унитазы','Ванны','Инсталляции','Кнопки','Гиг. душ','Трап','Душевое ограждение']],
  ['Текстиль', ['Ковры','Шторы','Ткани']],
  ['Декор', ['Подушки','Вазы','Скатерти','Посуда','Скульптуры','Картины']],
  ['Освещение', ['Люстры','Бра','Торшер','Встроенные треки','Встроенные точки','Настенные','Подвесные']],
  ['Двери', ['Скрытые','Раздвижные','Классические','Стеклянные перегородки','Входные','Фурнитура']],
  ['Техника', ['Варочная панель','Духовой шкаф','Холодильник','Посудомоечная машина','Стиральная машина','Сушильная машина','Винный холодильник']],
  ['Услуги', ['Строительная бригада','Сантехника','Монтаж дверей','Монтаж мебели']]
];
let desktopCatOpenV63 = null;

function desktopTopCategoriesV63(){
  return `<div class="desktop-catbar-v63">
    <button class="desktop-cat-main-v63 active" onclick="go('home')">Все</button>
    ${DESKTOP_CATEGORY_GROUPS_V63.map(([name,items],idx)=>`
      <div class="desktop-cat-group-v63">
        <button class="desktop-cat-main-v63" onclick="desktopCatOpenV63=desktopCatOpenV63===${idx}?null:${idx};render()">
          ${name}<span class="desktop-cat-chevron-v63">⌄</span>
        </button>
        ${desktopCatOpenV63===idx?`
          <div class="desktop-cat-dropdown-v63">
            ${items.map(item=>`<button onclick="desktopCatOpenV63=null; toastV5('${item}');">${item}</button>`).join('')}
          </div>`:''}
      </div>`).join('')}
    <div class="desktop-cat-search-v63">
      <input placeholder="Поиск" onkeydown="if(event.key==='Enter'){q=this.value;go('search')}">
      <button onclick="q=this.previousElementSibling.value;go('search')"><img src="assets/icons/search-v6.png" alt="Поиск"></button>
    </div>
  </div>`;
}

/* Replace the desktop project category row with the same compact grouped bar */
desktopProjectCategoriesV61 = function(){
  return isDesktopV5() ? desktopTopCategoriesV63() : '';
};

/* Desktop home header categories override */
function desktopHomeCategoryBarV63(){
  if(!isDesktopV5()) return '';
  return desktopTopCategoriesV63();
}


const renderV63Base = render;
render = function(){
  renderV63Base();
  if(!isDesktopV5()) return;
  const v=document.getElementById('view');
  if(!v) return;
  const shouldShow=['home','search','designerPublic','brand','designerProject'].includes(route);
  if(shouldShow && !v.querySelector('.desktop-catbar-v63')){
    v.insertAdjacentHTML('afterbegin', desktopTopCategoriesV63());
  }
};


/* ==================== SREDA v6.4 REVIEW CONSOLIDATION ==================== */

/* ---------- modal / fullscreen navigation state ---------- */
let commentsOpenV64 = false;
const closeModalV64Base = closeModal;
closeModal = function(){
  closeModalV64Base();
  commentsOpenV64 = false;
  document.body.classList.remove('modal-no-nav-v64');
};

/* ---------- settings: one clean Instagram-like list, same icons desktop/mobile ---------- */
function settingsIconV64(file, alt=''){
  return `<img class="settings-icon-v64" src="assets/icons/${file}" alt="${alt}">`;
}
renderSettingsV4 = function(){
 const groups = [
  ['Ваш аккаунт', [
    ['profile','Изменить данные','Имя, фото, описание, контакты','settings-edit-v64.png'],
    ['security','Безопасность','Пароль и активные сессии','settings-security-v64.png']
  ]],
  ['Как вы используете Среду', [
    ['history','Вы смотрели','История просмотренных товаров','settings-history-v64.png'],
    ['notifications','Уведомления','Настроить события и push','notification-plain-v64.png']
  ]],
  ['Приватность', [
    ['privacy','Видимость проектов','Публичные проекты и доступ поставщиков','settings-visibility-v64.png'],
    ['blacklist','Чёрный список','Заблокированные пользователи и бренды','settings-blacklist-v64.png']
  ]],
  ['Помощь', [
    ['support','Поддержка','Связаться с командой Среды','settings-support-v64.png']
  ]]
 ];
 return `<div class="settings-page-v64">
   <div class="settings-title-v64">
     ${mobileBackV5("go('profile')")}
     <h1>Настройки</h1>
   </div>
   ${groups.map(([name,items])=>`
     <section class="settings-group-v64">
       <h2>${name}</h2>
       ${items.map(([k,n,d,ic])=>`
        <button class="settings-row-v64" onclick="${k==='support'?'openSupportV5()':`settingsSectionV4='${k}';openSettingsDetailV4('${n}','${d}')`}">
          ${settingsIconV64(ic,n)}
          <span><b>${n}</b><small>${d}</small></span><em>›</em>
        </button>`).join('')}
     </section>`).join('')}
   <section class="settings-group-v64 settings-logout-group-v64">
     <button class="settings-row-v64 settings-logout-v64">
       ${settingsIconV64('settings-logout-v64.png','Выйти')}
       <span><b>Выйти</b></span>
     </button>
   </section>
 </div>`;
};

/* ---------- analytics: exactly one period row ---------- */
function analyticsControlsV64(kind){
 const periods=[['7d','7 дней'],['1m','Месяц'],['6m','Полгода'],['1y','Год'],['custom','Свой период']];
 return `<div class="analytics-controls-v64">
   <div class="analytics-periods-v64">
     ${periods.map(([k,n])=>`<button class="${analyticsPeriod===k?'active':''}" onclick="analyticsPeriod='${k}';render()">${n}</button>`).join('')}
   </div>
   ${analyticsPeriod==='custom'?`<div class="analytics-dates-v64"><input type="date" value="2026-08-01"><span>—</span><input type="date" value="2026-08-31"></div>`:''}
   <button class="analytics-download-v64" onclick="downloadAnalyticsExcelV5('${kind}')">↓ Скачать</button>
 </div>`;
}
renderSupplierAnalyticsV4 = function(){
 const a=analyticsPeriod==='custom'?{impressions:52340,opens:17180,saves:2580,specs:1210,requests:242,offers:181}:SUPPLIER_ANALYTICS_V4[analyticsPeriod];
 const metrics=[['Показы в ленте',a.impressions],['Открытия карточек',a.opens],['Сохранения',a.saves],['Добавления в спецификацию',a.specs],['Запросы расчёта',a.requests],['Предложения отправлены',a.offers]];
 return `<div class="supplier-section analytics-section-v64">
   ${analyticsControlsV64('аналитика-поставщика')}
   <div class="analytics-summary">${metrics.map(([n,v])=>`<div class="metric-card"><small>${n}</small><b>${new Intl.NumberFormat('ru-RU').format(v)}</b><span>динамика к прошлому периоду</span></div>`).join('')}</div>
   <div class="analytics-funnel"><div class="supplier-headline"><b>Воронка взаимодействия</b></div>
   ${metrics.map(([n,v])=>`<div class="funnel-row"><div><span>${n}</span><b>${new Intl.NumberFormat('ru-RU').format(v)}</b></div><div class="funnel-track"><i style="width:${Math.max(4,Math.round(v/a.impressions*100))}%"></i></div></div>`).join('')}</div>
   <div class="analytics-extra"><div><b>Топ товаров</b><span>Nube · Sora · Shad</span></div><div><b>Высокие просмотры / низкая конверсия</b><span>LO-RA · Core</span></div><div><b>Среднее время ответа</b><span>1 ч 24 мин</span></div></div>
 </div>`;
};
renderProductAnalyticsV4 = function(){
 const p=PRODUCTS.find(x=>x.id===selectedProductAnalyticsV4)||PRODUCTS[0];
 const seed=(p.name.length*37)%400;
 const a={impressions:8320+seed*10,opens:2870+seed*3,saves:524+seed,specs:218+Math.round(seed/2),requests:44+Math.round(seed/9),offers:31+Math.round(seed/12)};
 return `<div class="product-analytics-v64">${mobileBackV5("route='profile';profileRole='supplier';profileTab='cards';render()")}
   <h1>Аналитика ${p.name}</h1>${analyticsControlsV64('аналитика-товара')}
   <div class="product-analytics-head"><img src="${p.image}"><div><b>${p.name}</b><small>${p.type} · ${p.priceLabel}</small></div></div>
   <div class="analytics-summary">${[['Показы',a.impressions],['Открытия',a.opens],['Сохранения',a.saves],['В спецификацию',a.specs],['Запросы расчёта',a.requests],['Предложения',a.offers]].map(([n,v])=>`<div class="metric-card"><small>${n}</small><b>${new Intl.NumberFormat('ru-RU').format(v)}</b></div>`).join('')}</div>
 </div>`;
};

/* moderator analytics also uses the same clean range row */
moderatorAnalyticsV5 = function(){
 const metrics=[['Новые пользователи','428'],['Активные пользователи','4 812'],['Бренды','184'],['Товары','3 942'],['Добавлено в спецификации','12 840'],['Запросы расчёта','1 624'],['Ошибки приложения','37']];
 return `<div class="moderator-analytics">${analyticsControlsV64('аналитика-платформы')}
   <div class="analytics-summary">${metrics.map(x=>`<button class="metric-card" onclick="openModeratorHistoryV6('${x[0]}')"><small>${x[0]}</small><b>${x[1]}</b></button>`).join('')}</div>
   <div class="analytics-extra"><div><b>Ручные позиции дизайнеров</b><span>Шторы · столярные изделия · искусство</span></div><div><b>Чего не хватает в каталоге</b><span>Декоративный свет · двери · текстиль на заказ</span></div></div>
 </div>`;
};

/* ---------- supplier requests: compact Telegram-like list, normal typography ---------- */
renderSupplierRequests = function(){
 const requests=[
  {name:'Nube',project:'Квартира на Патриках',date:'сегодня, 12:40',status:'Новые'},
  {name:'Shad',project:'Дом в Подмосковье',date:'вчера',status:'В работе'},
  {name:'Core × 4',project:'Офисное пространство',date:'08.08',status:'Расчёт отправлен'}
 ];
 const statuses=['Все','Новые','В работе','Расчёт отправлен','Завершённые'];
 const shown=supplierRequestFilter==='Все'?requests:requests.filter(r=>r.status===supplierRequestFilter);
 return `<div class="supplier-requests-v64">
   <div class="supplier-headline-v64"><b>Запросы на расчёт</b><span>${requests.length}</span></div>
   <div class="request-folders-v64">${statuses.map(st=>`<button class="${supplierRequestFilter===st?'active':''}" onclick="supplierRequestFilter='${st}';render()">${st}<small>${st==='Все'?requests.length:requests.filter(r=>r.status===st).length}</small></button>`).join('')}</div>
   <div class="request-list-v64">${shown.map(r=>`<button class="request-row-v64">
     <div class="request-avatar-v64">${r.name.slice(0,2).toUpperCase()}</div>
     <div><b>${r.name}</b><small>${r.project}</small></div>
     <div class="request-status-v64"><time>${r.date}</time><span>${r.status}</span></div>
   </button>`).join('')}</div>
 </div>`;
};

/* ---------- favorites: plain + icon only ---------- */
renderFavoritesV4 = function(){
 const items=PRODUCTS.filter(p=>favorites.has(p.id)&&favCategoryMatchV5(p));
 return `<div class="favorites-v4 mobile-gutter">
   <div class="favorites-head-v64"><div><h2>Избранное</h2><small>Товары сохраняются даже после снятия с публикации</small></div>
     <button class="favorite-plus-v64" onclick="createFavoriteFolderV4()" aria-label="Новая папка"><img src="assets/icons/plus-v64.png" alt=""></button>
   </div>
   <div class="favorite-folders"><button class="active">Все товары <span>${PRODUCTS.filter(p=>favorites.has(p.id)).length}</span></button>${favoriteFoldersV5.map((f,i)=>`<button>${f} <span>${[8,12,5,3][i]||0}</span></button>`).join('')}</div>
   ${favoriteCategoryTabsV5()}
   <div class="masonry">${items.length?items.map(feedCardV4).join(''):`<div class="favorite-empty">Нажмите ♡ у товара,<br>чтобы сохранить его.</div>`}</div>
 </div>`;
};

/* ---------- product detail: remove separator/arrow under brand ---------- */
function productDetailsV64(p,sizes){
 return `<button class="brand-inline-v64" onclick="openBrandV4('${p.brand}')"><span>${p.brand}</span></button>
   <div class="eyebrow">${p.type}</div><div class="product-title-row"><h1 class="product-name">${p.name}</h1><div class="product-big-price">${p.priceLabel}</div></div>
   ${pickerButtonHTMLV5('Отделка',(p.finishes||['Стандарт'])[0],p.finishes||['Стандарт'])}
   ${pickerButtonHTMLV5(p.bedSizes?'Спальное место':'Размер / формат',sizes[0],sizes)}
   <button class="btn primary" onclick="specModal()">Добавить в спецификацию</button><button class="btn" onclick="requestCalc()">Запросить расчёт</button>
   <div class="info-row"><span>Срок производства</span><b>${p.production}</b></div>
   <section class="mobile-product-description-v64"><h3>Описание</h3><p>${p.description}</p></section>
   <div class="v4-accordions product-ref-accordions-v64">
    ${accordionV4('Характеристики',`<p>Материал: ${p.material||'—'}<br>Наличие: ${p.availability||'—'}<br>Цвет: ${p.color||'—'}</p>`)}
    ${accordionV4('Схема с размерами',`<div class="doc-preview"><div class="dimension-demo">↔ ${sizes[0]}</div></div>`)}
    ${accordionV4('Инструкция',`<div class="doc-row">PDF · Инструкция <button>Открыть</button></div>`)}
    ${accordionV4('Рекомендации по уходу',`<p>Использовать мягкую сухую ткань.</p>`)}
    ${accordionV4('Отзывы',`<div class="review-mini"><b>4,9 ★</b><span>12 отзывов</span></div>`)}
   </div>`;
}
const renderProductV64Base = renderProductV4;
renderProductV4 = function(){
 const p=currentProduct, sizes=p.bedSizes||p.sizes||['Стандарт'];
 if(isDesktopV5()) return renderProductV64Base();
 return `<div class="mobile-product-v64">
   <div class="product-hero v4-product-hero"><img src="${p.image}" alt="${p.name}">
     <button class="mobile-product-back-v6" onclick="productBackV6()" aria-label="Назад">${iconV6('back','Назад')}</button>
     <div class="product-actions-top v6-product-actions">
       <button onclick="shareProductV4('${p.id}')" aria-label="Поделиться">${iconV6('share','Поделиться')}</button>
       <button class="fav-v6 ${favorites.has(p.id)?'is-favorite':''}" onclick="toggleFav('${p.id}',event)">${favorites.has(p.id)?'♥':'♡'}</button>
     </div>
   </div>
   <div class="product-content mobile-gutter">${productDetailsV64(p,sizes)}</div>
 </div>`;
};

/* ---------- filter: compact vertical range rows ---------- */
openFilters = function(){
 const m=document.getElementById('modal');m.className='modal';
 const details=(title,body,open='')=>`<details class="filter-detail-v64" ${open}><summary>${title}<span>⌄</span></summary><div>${body}</div></details>`;
 m.innerHTML=`<div class="sheet filters filter-sheet-v64"><div class="sheet-title"><h3>Фильтры</h3><button class="close" onclick="closeModal()">×</button></div>
 ${details('Категория',filterSectionBodyV6('category',CATEGORIES))}
 ${details('Материал',filterSectionBodyV6('material',['Все',...MATERIAL_FILTERS_V5]),'open')}
 ${details('Цвет',filterSectionBodyV6('color',['Все','Светлый','Чёрный','Коричневый','Зелёный','Терракотовый','Белый']),'open')}
 ${details('Размер',`<div class="range-list-v64">
   <label><span>Ширина</span><input placeholder="от"><input placeholder="до"></label>
   <label><span>Глубина</span><input placeholder="от"><input placeholder="до"></label>
   <label><span>Высота</span><input placeholder="от"><input placeholder="до"></label>
 </div>`,'open')}
 ${details('Декор',`<div class="filter-options">${['Все','Однотонный','Геометрия','Флора','Абстракция'].map(x=>`<button class="filter-option">${x}</button>`).join('')}</div>`)}
 ${details('Цена',`<div class="price-range-v64"><input id="minP" type="number" value="${filters.minPrice}" placeholder="от"><input id="maxP" type="number" value="${filters.maxPrice}" placeholder="до"></div>`)}
 <div class="filter-actions-v64"><button class="btn primary" onclick="applyFilters()">Показать</button><button class="btn" onclick="resetFilters()">Сбросить</button></div>
 </div>`;
};

/* ---------- project publication + comments ---------- */
function openProjectCommentsV64(){
 commentsOpenV64 = true;
 document.body.classList.add('modal-no-nav-v64');
 const m=document.getElementById('modal');m.className='modal comments-modal-v64';
 m.innerHTML=`<div class="comments-sheet-v64">
   <div class="comments-handle-v64"></div><div class="comments-title-v64"><b>Комментарии</b><button onclick="closeModal()">×</button></div>
   <div class="comments-list-v64">
    ${[
      ['ЕК','Елена Крылова','Очень нравится сочетание материалов ❤️','22 мин.','18'],
      ['АС','Алексей Серов','Подскажите, пожалуйста, что за кровать?','1 ч.','4'],
      ['МО','Мария Орлова','Красивый проект. Особенно спальня.','3 ч.','7']
    ].map(c=>`<div class="comment-row-v64"><div class="comment-avatar-v64">${c[0]}</div><div><p><b>${c[1]}</b> <small>${c[3]}</small><br>${c[2]}</p><button>Ответить</button></div><button class="comment-like-v64">♡<small>${c[4]}</small></button></div>`).join('')}
   </div>
   <div class="comment-reactions-v64"><span>❤️</span><span>🙌</span><span>🔥</span><span>👏</span><span>🥲</span><span>😍</span><span>😮</span><span>😂</span></div>
   <div class="comment-composer-v64"><div class="comment-avatar-v64">АС</div><input placeholder="Добавить комментарий…"><button>Отправить</button></div>
 </div>`;
}
renderProjectPostV6 = function(){
 const p=DESIGNER_PROJECTS_V4.find(x=>x.id===currentProject)||DESIGNER_PROJECTS_V4[0], post=projectPostV6||{img:p.cover,room:'Гостиная'};
 const linked=PRODUCTS.filter(x=>['Forma Dom','METALNO'].includes(x.brand)).slice(0,3);
 const similar=PRODUCTS.filter(x=>!linked.includes(x)).slice(0,6);
 return `<div class="project-post-v64 mobile-gutter">
   <div class="project-post-head">${mobileBackV5("route='designerProject';render()")}<div><b>Анна Смирнова</b><small>${p.title} · ${post.room}</small></div><button>${iconV6('more','Ещё')}</button></div>
   <img class="project-post-image" src="${post.img}" alt="">
   <div class="project-social-v6">
     <button onclick="this.classList.toggle('liked');this.textContent=this.classList.contains('liked')?'♥':'♡'">♡</button>
     <button onclick="openProjectCommentsV64()">◯</button>
     <button onclick="toastV5('Можно отправить в чат')">${iconV6('messages','Отправить')}</button><span>124 отметки «Нравится»</span>
   </div>
   <div class="project-comments-preview-v64"><p><b>anna.smirnova</b> ${p.title}, ${post.room}</p><button onclick="openProjectCommentsV64()">Посмотреть все 18 комментариев</button></div>
   <section><h2>Товары на этой визуализации</h2><div class="horizontal linked-products-v64">${linked.map(x=>`<div class="mini" onclick="openProduct('${x.id}')"><img src="${x.image}"><b>${x.name}</b></div>`).join('')}</div></section>
   <section><h2>Похожие товары</h2><div class="masonry">${similar.map(feedCardV4).join('')}</div></section>
 </div>`;
};

/* ---------- shell: hide app bottom nav in chat, story and comments ---------- */
const shellSyncV64Base = shellSyncV5;
shellSyncV5 = function(){
 shellSyncV64Base();
 const nav=document.querySelector('.bottom-nav');
 if(!isDesktopV5() && (route==='chat'||route==='story'||commentsOpenV64)) nav?.classList.add('route-hidden-v64');
 else nav?.classList.remove('route-hidden-v64');
};

/* ---------- chat opens as a clean fullscreen page on mobile ---------- */
const renderChatV64DesktopBase = renderChat;
renderChat = function(){
 if(isDesktopV5()) return renderChatV64DesktopBase();
 const rel=messages.filter(m=>!m.chat||m.chat===currentChat);
 return `<section class="telegram-chat chat-fullscreen-v64">
   <header class="chat-head-v64">
     <button class="plain-back-v64" onclick="go('chats')">${iconV6('back','Назад')}</button>
     <div class="chat-avatar">${currentChat.slice(0,2).toUpperCase()}</div>
     <div class="chat-head-main"><b>${currentChat}</b><small>в сети</small></div>
     <button class="chat-more" onclick="openSharedMedia()">•••</button>
   </header>
   <div class="messages messages-v64">${rel.length?rel.map(chatMessageHTML).join(''):`<div class="bubble"><div class="bubble-text">Здравствуйте! Напишите, что вас интересует.</div><small class="msg-time">сейчас</small></div>`}</div>
   ${attachmentPanelOpen?renderAttachPanel():''}
   <div class="composer composer-v64">
     <button class="composer-icon" onclick="toggleAttachPanel()">＋</button>
     <input id="msg" placeholder="${voiceRecording?'Идёт запись…':'Сообщение'}" onkeydown="if(event.key==='Enter')sendMsg()">
     <button class="mic-btn ${voiceRecording?'recording':''}" onclick="toggleVoice()">${voiceRecording?'■':'◉'}</button>
     <button class="send-btn" onclick="sendMsg()">↑</button>
   </div>
   <input id="photoInput" type="file" accept="image/*" multiple hidden onchange="sendAttachments(this.files,'image')">
   <input id="videoInput" type="file" accept="video/*" multiple hidden onchange="sendAttachments(this.files,'video')">
   <input id="fileInput" type="file" multiple hidden onchange="sendAttachments(this.files,'file')">
 </section>`;
};

/* ---------- brand resident icon: markup stays, CSS converts label to icon ---------- */

/* ---------- render final wrapper keeps nav state synchronized after every route ---------- */
const renderV64Base = render;
render = function(){
 renderV64Base();
 shellSyncV5();
 setTimeout(()=>{ shellSyncV5(); },0);
};


/* ==================== SREDA v6.5 desktop nav + grid stability ==================== */
const DESKTOP_NAV_V65 = [
  ['Мебель',['Стулья','Столы','Комоды','Тумбы','Шкафы','Буфеты','Кровати','Диваны','Кресла','Журнальные столики','Гардеробные','Банкетки','Пуфы']],
  ['Напольные покрытия',['Инженерная доска','Керамогранит','Микроцемент','Ковролин']],
  ['Настенные покрытия',['Обои','Краска','Фреска','Штукатурка','Керамогранит','Лепнина']],
  ['Сантехника',['Раковина','Мойки','Смесители','Душевые стойки','Душевые комплекты','Унитазы','Ванны','Инсталляции','Кнопки','Гиг. душ','Трап','Душевое ограждение']],
  ['Текстиль',['Ковры','Шторы','Ткани']],
  ['Декор',['Подушки','Вазы','Скатерти','Посуда','Скульптуры','Картины']],
  ['Освещение',['Люстры','Бра','Торшер','Встроенные треки','Встроенные точки','Настенные','Подвесные']],
  ['Двери',['Скрытые','Раздвижные','Классические','Стеклянные перегородки','Входные','Фурнитура']],
  ['Техника',['Варочная панель','Духовой шкаф','Холодильник','Посудомоечная машина','Стиральная машина','Сушильная машина','Винный холодильник']],
  ['Услуги',['Строительная бригада','Сантехника','Монтаж дверей','Монтаж мебели']]
];

function mountDesktopNavV65(){
  const host=document.getElementById('desktopCompactNavV65');
  if(!host || !isDesktopV5()) return;
  host.innerHTML=`<div class="desktop-compact-nav-v65">
    <button class="desktop-nav-top-v65 active" onclick="selectedCategory='Все';go('home')">Все</button>
    ${DESKTOP_NAV_V65.map(([name,items])=>`
      <details class="desktop-nav-group-v65">
        <summary>${name}<span>⌄</span></summary>
        <div class="desktop-nav-menu-v65">
          ${items.map(item=>`<button onclick="selectedCategory='${item}';go('home');this.closest('details').removeAttribute('open')">${item}</button>`).join('')}
        </div>
      </details>`).join('')}
    <form class="desktop-inline-search-v65" onsubmit="event.preventDefault();q=this.querySelector('input').value;go('search')">
      <input placeholder="Поиск">
      <button aria-label="Найти"><img src="assets/icons/search-v6.png" alt=""></button>
    </form>
  </div>`;
}

/* Never inject a second category row into page content. */
desktopProjectCategoriesV61 = function(){ return ''; };
desktopHomeCategoryBarV63 = function(){ return ''; };

/* Stable desktop brand/product grids instead of CSS multi-columns. */
const renderBrandV65Base = renderBrandV4;
renderBrandV4 = function(){
  const out = renderBrandV65Base();
  return out;
};

const renderV65Base = render;
render = function(){
  renderV65Base();
  mountDesktopNavV65();
  document.querySelectorAll('#view > .desktop-catbar-v63, #view > .desktop-project-categories-v61').forEach(el=>el.remove());
};

/* Mount once on initial load too. */
setTimeout(mountDesktopNavV65,0);


/* ==================== SREDA v6.6 — consolidated responsive review ==================== */
const V66_BACK_ICON='assets/icons/back-v66.png';
const V66_PRINT_ICON='assets/icons/print-v66.png';
const V66_SHARE_ICON='assets/icons/share-v66.png';
const V66_DROP_ICON='assets/icons/dropdown-v66.png';
let attachmentsTabV66='Фото';

function backIconV66(label='Назад'){
  return `<img src="${V66_BACK_ICON}" alt="${label}" class="back-icon-v66">`;
}
function shareIconV66(){ return `<img src="${V66_SHARE_ICON}" alt="Поделиться" class="share-icon-v66">`; }
function dropdownIconV66(){ return `<img src="${V66_DROP_ICON}" alt="" class="dropdown-icon-v66">`; }

/* All old back button renderers become the same icon-only control. */
mobileBackV5 = function(action){
 return `<button class="mobile-back-v5 back-only-v66" onclick="${action||"history.back()"}" aria-label="Назад">${backIconV66()}</button>`;
};

/* Desktop nav: only one row. Hover submenus, search at row end. */
function mountDesktopNavV65(){
 const host=document.getElementById('desktopCompactNavV65');
 if(!host || !isDesktopV5()) return;
 host.innerHTML=`<div class="desktop-compact-nav-v65 desktop-compact-nav-v66">
   <button class="desktop-nav-top-v65 active" onclick="selectedCategory='Все';go('home')">Все</button>
   ${DESKTOP_NAV_V65.map(([name,items])=>`
     <div class="desktop-nav-group-v66">
       <button class="desktop-nav-group-button-v66">${name}${dropdownIconV66()}</button>
       <div class="desktop-nav-menu-v65 desktop-nav-menu-v66">
         ${items.map(item=>`<button onclick="selectedCategory='${item}';go('home')">${item}</button>`).join('')}
       </div>
     </div>`).join('')}
   <form class="desktop-inline-search-v65 desktop-inline-search-v66" onsubmit="event.preventDefault();q=this.querySelector('input').value;go('search')">
     <input placeholder="Поиск">
     <button aria-label="Найти"><img src="assets/icons/search-v6.png" alt=""></button>
   </form>
 </div>`;
}

/* Home: desktop no longer renders the obsolete second category row. */
const renderHomeV66Base = renderHomeV4;
renderHomeV4 = function(){
 let html=renderHomeV66Base();
 if(isDesktopV5()) html=html.replace(/<div class="feed-tabs">[\s\S]*?<\/div>\s*(?=<div class="stories">)/,'');
 return html;
};

/* Shared chip component used by favorites, request filters, moderator filters. */
function chipV66(text,active,onclick,count=''){
 return `<button class="ui-chip-v66 ${active?'active':''}" onclick="${onclick}">${text}${count!==''?` <small>${count}</small>`:''}</button>`;
}

/* Favorites: no subtitle; folders styled like popular queries; + centered on heading. */
renderFavoritesV4 = function(){
 const items=PRODUCTS.filter(p=>favorites.has(p.id)&&favCategoryMatchV5(p));
 const countAll=PRODUCTS.filter(p=>favorites.has(p.id)).length;
 return `<div class="favorites-v4 mobile-gutter page-gutter-v66">
   <div class="favorites-head-v66"><h2>Избранное</h2>
     <button class="favorite-plus-v66" onclick="createFavoriteFolderV4()" aria-label="Новая папка"><img src="assets/icons/plus-v66.png" alt=""></button>
   </div>
   <div class="favorite-folders favorite-folder-chips-v66">
    ${chipV66('Все товары',true,'void(0)',countAll)}
    ${favoriteFoldersV5.map((f,i)=>chipV66(f,false,'void(0)',[8,12,5,3][i]||0)).join('')}
   </div>
   ${favoriteCategoryTabsV5()}
   <div class="masonry">${items.length?items.map(feedCardV4).join(''):`<div class="favorite-empty">Нажмите ♡ у товара,<br>чтобы сохранить его.</div>`}</div>
 </div>`;
};

/* Product picker arrow uses supplied icon. */
pickerButtonHTMLV5 = function(label,value,items){
 return `<button class="v4-picker picker-v66" onclick='openPickerV6(this,${JSON.stringify(label)},${JSON.stringify(items)})'>
   <span><small>${label}</small><b>${value}</b></span>${dropdownIconV66()}</button>`;
};

/* Product desktop: icon-only favorite on image, no share in details, clean brand row. */
const renderProductV66Before = renderProductV4;
renderProductV4 = function(){
 const p=currentProduct, sizes=p.bedSizes||p.sizes||['Стандарт'];
 if(!isDesktopV5()) return renderProductV66Before();
 return `<div class="desktop-product-page desktop-product-v66">
   <div class="desktop-product-gallery">
     <button class="desktop-back back-only-v66" onclick="productBackV6()">${backIconV66()}</button>
     <div class="desktop-product-main-v66"><img class="desktop-main-product-img" src="${p.image}" alt="${p.name}">
       <button class="desktop-image-fav-v66 ${favorites.has(p.id)?'is-favorite':''}" onclick="toggleFav('${p.id}',event)">${favorites.has(p.id)?'♥':'♡'}</button>
     </div>
     <div class="desktop-thumb-row"><img src="${p.image}"><img src="${findVisualForProductV5(p)}"><img src="${p.image}"></div>
   </div>
   <aside class="desktop-product-info">
     <button class="desktop-brand-link brand-clean-v66" onclick="openBrandV4('${p.brand}')">${p.brand}</button>
     <small>${p.type}</small>
     <div class="desktop-product-title"><h1>${p.name}</h1><strong>${p.priceLabel}</strong></div>
     ${pickerButtonHTMLV5('Отделка',(p.finishes||['Стандарт'])[0],p.finishes||['Стандарт'])}
     ${pickerButtonHTMLV5(p.bedSizes?'Спальное место':'Размер / формат',sizes[0],sizes)}
     <div class="desktop-product-cta"><button class="primary" onclick="specModal()">Добавить в спецификацию</button><button onclick="requestCalc()">Запросить расчёт</button></div>
     <div class="desktop-meta"><span>Срок производства</span><b>${p.production}</b></div>
     <section class="desktop-description-v6"><h3>Описание</h3><p>${p.description}</p></section>
     <div class="v4-accordions desktop-product-accordions v6-clean-accordions">
       ${accordionV4('Характеристики',`<p>Материал: ${p.material||'—'}<br>Наличие: ${p.availability||'—'}<br>Цвет: ${p.color||'—'}</p>`)}
       ${accordionV4('Схема с размерами',`<div class="doc-preview"><div class="dimension-demo">↔ ${sizes[0]}</div></div>`)}
       ${accordionV4('Инструкция',`<div class="doc-row">PDF · Инструкция <button>Открыть</button></div>`)}
       ${accordionV4('Рекомендации по уходу',`<p>Использовать мягкую сухую ткань.</p>`)}
       ${accordionV4('Отзывы',`<div class="review-mini"><b>4,9 ★</b><span>12 отзывов</span></div>`)}
     </div>
   </aside>
 </div>`;
};

/* Filters: unified dropdown arrow; compact ranges. */
openFilters = function(){
 const m=document.getElementById('modal');m.className='modal';
 const details=(title,body,open='')=>`<details class="filter-detail-v66" ${open}><summary>${title}${dropdownIconV66()}</summary><div>${body}</div></details>`;
 m.innerHTML=`<div class="sheet filters filter-sheet-v66">
   <div class="sheet-title"><h3>Фильтры</h3><button class="close" onclick="closeModal()">×</button></div>
   <div class="filter-scroll-v66">
    ${details('Категория',filterSectionBodyV6('category',CATEGORIES))}
    ${details('Материал',filterSectionBodyV6('material',['Все',...MATERIAL_FILTERS_V5]))}
    ${details('Цвет',filterSectionBodyV6('color',['Все','Светлый','Чёрный','Коричневый','Зелёный','Терракотовый','Белый']))}
    ${details('Размер',`<div class="range-list-v66">
      <label><span>Ширина</span><input placeholder="от"><em>—</em><input placeholder="до"></label>
      <label><span>Глубина</span><input placeholder="от"><em>—</em><input placeholder="до"></label>
      <label><span>Высота</span><input placeholder="от"><em>—</em><input placeholder="до"></label>
    </div>`)}
    ${details('Декор',`<div class="filter-options">${['Все','Однотонный','Геометрия','Флора','Абстракция'].map(x=>`<button class="filter-option">${x}</button>`).join('')}</div>`)}
    ${details('Цена',`<div class="price-range-v66"><input id="minP" type="number" value="${filters.minPrice}" placeholder="от"><span>—</span><input id="maxP" type="number" value="${filters.maxPrice}" placeholder="до"></div>`)}
   </div>
   <div class="filter-actions-v66"><button class="btn primary" onclick="applyFilters()">Показать</button><button class="btn" onclick="resetFilters()">Сбросить</button></div>
 </div>`;
};

/* Profile share becomes icon and both role profiles use same mobile header geometry. */
function profileShareButtonV66(){
 return `<button class="profile-share-icon-v66" onclick="shareProfileV5()" aria-label="Поделиться профилем">${shareIconV66()}</button>`;
}
const designerProfileBaseV66 = renderDesignerProfileUnifiedV5;
renderDesignerProfileUnifiedV5 = function(own){
 if(isDesktopV5()) return designerProfileBaseV66(own);
 const key='designer:'+currentDesignerV4;
 const verified=`<img class="verified-icon-v6" src="assets/icons/verified-v6.png" alt="Верифицирован">`;
 return `<div class="mobile-profile-unified mobile-gutter page-gutter-v66">
   ${own?`<div class="mobile-role-tabs role-tabs-single-v66"><button class="active" onclick="profileRole='designer';render()">Дизайнер</button><button onclick="profileRole='supplier';render()">Поставщик</button><button onclick="profileRole='moderator';render()">Модератор</button></div>`:''}
   <div class="mobile-profile-corner-v66">${own?`<button class="hamburger-v5" onclick="openSettingsV4()">☰</button>${profileShareButtonV66()}`:''}</div>
   <div class="mobile-profile-avatar">АС</div>
   <h1 class="v6-name-line">Анна Смирнова ${verified}</h1><p class="mobile-profile-sub">Дизайнер интерьеров · Москва</p>
   <div class="stats mobile-stats"><div><b>24</b><small>Проекты</small></div><div><b>1 245</b><small>Подписчики</small></div><div><b>320</b><small>Подписки</small></div></div>
   ${own?`<div class="mobile-profile-quick profile-quick-v66"><button onclick="profileTab='analytics';render()">Аналитика</button><button onclick="openSettingsV4()">Редактировать</button></div>`:`<div class="public-actions">${followButtonV4(key)}<button class="v4-message" onclick="currentChat='Анна Смирнова';route='chat';render()">Сообщение</button></div>`}
   <p class="mobile-profile-bio">Жилые и общественные интерьеры. Москва / Европа.</p>
   <div class="public-tabs mobile-profile-tabs full-width-tabs-v66">
     <button title="Проекты" class="${designerTabV4==='projects'?'active':''}" onclick="designerTabV4='projects';render()">${iconV6('projects-tab','Проекты')}</button>
     ${own?`<button title="Спецификация" class="${designerTabV4==='specs'?'active':''}" onclick="designerTabV4='specs';currentProject=null;render()">${iconV6('spec','Спецификация')}</button>`:''}
     <button class="${designerTabV4==='saved'?'active':''}" onclick="designerTabV4='saved';render()">Публикации</button>
   </div>
   ${profileTab==='orders'?renderDesignerOrdersV66():designerTabV4==='projects'?renderDesignerProjectsV4():designerTabV4==='specs'?renderSpecsRoot():`<div class="masonry mobile-profile-grid">${VISUALS.map(feedCardV4).join('')}</div>`}
 </div>`;
};

supplierMobileV5 = function(){
 const tabs=[['cards','products','Товары'],['requests','requests','Запросы'],['analytics','analytics','Аналитика'],['marks','projects-tab','Отметки']];
 return `<div class="mobile-supplier-profile mobile-gutter page-gutter-v66">
  <div class="mobile-role-tabs role-tabs-single-v66"><button onclick="profileRole='designer';render()">Дизайнер</button><button class="active">Поставщик</button><button onclick="profileRole='moderator';render()">Модератор</button></div>
  <div class="mobile-profile-corner-v66"><button class="hamburger-v5" onclick="openSettingsV4()">☰</button>${profileShareButtonV66()}</div>
  <div class="mobile-profile-avatar brand-avatar-mobile">FD</div><h1>Forma Dom</h1><p class="mobile-profile-sub">Поставщик мебели · Москва</p>
  <div class="mobile-profile-quick profile-quick-v66"><button onclick="profileTab='analytics';render()">Аналитика</button><button onclick="openSettingsV4()">Редактировать</button></div>
  <div class="profile-tabs supplier-tabs full-width-tabs-v66">${tabs.map(([t,ic,n])=>`<button title="${n}" class="profile-tab ${profileTab===t?'active':''}" onclick="profileTab='${t}';render()">${iconV6(ic,n)}</button>`).join('')}</div>
  ${profileTab==='cards'?renderSupplierCardsV4():profileTab==='analytics'?renderSupplierAnalyticsV4():profileTab==='requests'?renderSupplierRequests():renderSupplierMarks()}
 </div>`;
};

/* Designer orders are an actual page/list. */
function renderDesignerOrdersV66(){
 const rows=[
  {no:'№ 1284',project:'Квартира на Патриках',supplier:'Forma Dom',item:'Nube',sum:'523 000 ₽',date:'28.08.2026',status:'В производстве'},
  {no:'№ 1279',project:'Спальня',supplier:'Forma Dom',item:'Shad',sum:'230 000 ₽',date:'20.08.2026',status:'Отгружено'},
  {no:'№ 1268',project:'Дом в Подмосковье',supplier:'METALNO',item:'MODEL A H',sum:'52 000 ₽',date:'11.08.2026',status:'Ожидает оплаты'}
 ];
 return `<section class="designer-orders-v66"><h2>Заказы</h2>${rows.map(x=>`<article>
  <div><b>${x.no}</b><strong>${x.item}</strong><small>${x.project} · ${x.supplier}<br>${x.date} · ${x.sum}</small></div>
  <span class="order-status-v66 status-${x.status==='Отгружено'?'shipped':x.status==='Ожидает оплаты'?'pay':'production'}">${x.status}</span>
  ${x.status==='Отгружено'?'<button class="review-order-v66">Оставить отзыв</button>':''}
 </article>`).join('')}</section>`;
}
const accountNavigateV66Base=accountNavigateV5;
accountNavigateV5 = function(k){
 if(profileRole==='designer' && k==='orders'){
  closeDesktopOverlaysV5(); route='profile'; profileTab='orders'; render(); return;
 }
 accountNavigateV66Base(k);
};

/* Supplier requests match messenger row scale and open chat. */
renderSupplierRequests = function(){
 const requests=[
  {name:'Nube',project:'Квартира на Патриках',date:'12:40',day:'сегодня',status:'Новые',chat:'Forma Dom'},
  {name:'Shad',project:'Дом в Подмосковье',date:'11:15',day:'вчера',status:'В работе',chat:'Shad'},
  {name:'Core × 4',project:'Офисное пространство',date:'18:05',day:'08.08',status:'Расчёт отправлен',chat:'Core'}
 ];
 const statuses=['Все','Новые','В работе','Расчёт отправлен','Завершённые'];
 const shown=supplierRequestFilter==='Все'?requests:requests.filter(r=>r.status===supplierRequestFilter);
 return `<div class="supplier-requests-v66">
   <div class="supplier-headline-v66"><b>Запросы на расчёт</b><span>${requests.length}</span></div>
   <div class="request-folders-v66">${statuses.map(st=>chipV66(st,supplierRequestFilter===st,`supplierRequestFilter='${st}';render()`,st==='Все'?requests.length:requests.filter(r=>r.status===st).length)).join('')}</div>
   <div class="request-list-v66">${shown.map(r=>`<button class="request-row-v66" onclick="currentChat='${r.chat}';route='chat';render()">
     <div class="request-avatar-v66">${r.name.slice(0,2).toUpperCase()}</div>
     <div class="request-main-v66"><b>${r.name}</b><small>${r.project}</small></div>
     <div class="request-meta-v66"><time>${r.day} · ${r.date}</time><span>${r.status}</span></div>
   </button>`).join('')}</div>
 </div>`;
};

/* Desktop supplier gets designer-like wide profile layout. */
supplierDesktopV5 = function(){
 const tabs=[['cards','Товары'],['requests','Запросы'],['orders','Заказы'],['analytics','Аналитика']];
 return `<div class="desktop-cabinet desktop-cabinet-v66">
   <header class="desktop-profile-head-v66">
    <div class="desktop-profile-avatar-v66">FD</div>
    <div><small>Личный кабинет поставщика</small><h1>Forma Dom</h1><p>Поставщик мебели · Москва</p></div>
    <div class="desktop-profile-actions-v66"><button onclick="openProductEditorV4()">＋ Добавить товар</button><button onclick="openSettingsV4()">Редактировать профиль</button><button class="desktop-share-icon-v66" onclick="shareProfileV5()">${shareIconV66()}</button></div>
   </header>
   <nav class="desktop-cabinet-tabs">${tabs.map(([k,n])=>`<button class="${profileTab===k?'active':''}" onclick="profileTab='${k}';render()">${n}</button>`).join('')}</nav>
   ${profileTab==='cards'?renderSupplierCardsV4():profileTab==='analytics'?renderSupplierAnalyticsV4():profileTab==='requests'?renderSupplierRequests():renderOrdersV5()}
 </div>`;
};

/* Orders: colored status badges. */
renderOrdersV5 = function(){
 const rows=[
  {no:'№ 1284',name:'Nube',project:'Квартира на Патриках',designer:'Анна Смирнова',status:'В производстве',img:'assets/products/nube.webp'},
  {no:'№ 1279',name:'Shad',project:'Спальня',designer:'Анна Смирнова',status:'Отгружено',img:'assets/products/shad.webp'}
 ];
 return `<div class="orders-v66"><h2>Заказы</h2>${rows.map(x=>`<article><img src="${x.img}"><div><b>${x.no}</b><strong>${x.name}</strong><small>${x.project} · ${x.designer}</small></div><span class="order-status-v66 ${x.status==='Отгружено'?'status-shipped':'status-production'}">${x.status}</span>${x.status==='Отгружено'?'<button class="review-order-v66">Оставить отзыв</button>':''}</article>`).join('')}</div>`;
};

/* Desktop and mobile chat list: readable avatars, unread numeric bubble only. */
renderChats = function(){
 const chats=[
  ['Forma Dom','Расчёт по Nube готов','14:48','2'],['Nube','Отправлена карточка товара','14:36',''],['METALNO','Срок производства 4 недели','13:42','1'],['Анна Смирнова','Спасибо!','12:18',''],['Проект Патрики','Групповой чат · 4 участника','вчера','3']
 ];
 if(!isDesktopV5()){
  return `<div class="mobile-chat-list-v66">${chats.map(x=>`<button class="mobile-chat-row-v66" onclick="openChat('${x[0]}')"><span class="chat-avatar-v66">${x[0].slice(0,2)}</span><span><b>${x[0]}</b><small>${x[1]}</small></span><time>${x[2]}${x[3]?`<i>${x[3]}</i>`:''}</time></button>`).join('')}</div>`;
 }
 return `<div class="desktop-messenger desktop-messenger-v66">
  <aside class="desktop-chat-list"><div class="desktop-chat-list-head"><h2>Чаты</h2><button class="plain-plus-v66" onclick="toastV5('Создание группы')">＋</button></div>
   <div class="desktop-chat-search-v66"><input placeholder="Поиск"></div>
   <div class="desktop-chat-folders-v66">${['Все чаты','Проекты','Поставщики'].map((x,i)=>chipV66(x,i===0,'void(0)')).join('')}<button class="folder-plus-v66">＋</button></div>
   ${chats.map((x,i)=>`<button class="desktop-chat-row ${i===0?'active':''}" onclick="currentChat='${x[0]}';route='chat';render()"><span class="chat-avatar-v66">${x[0].slice(0,2)}</span><span><b>${x[0]}</b><small>${x[1]}</small></span><time>${x[2]}${x[3]?`<i>${x[3]}</i>`:''}</time></button>`).join('')}
  </aside><section class="desktop-chat-empty"><span>Выберите чат</span></section></div>`;
};

/* Attachments are a separate screen like Telegram. */
openSharedMedia = function(){
 attachmentsTabV66='Фото';
 route='attachmentsV66';
 render();
};
function renderAttachmentsV66(){
 const tabs=['Фото','Видео','Файлы','Ссылки'];
 const media=messages.filter(m=>m.chat===currentChat&&m.attachment);
 return `<section class="attachments-page-v66 page-gutter-v66">
   <header class="attachments-head-v66"><button class="back-only-v66" onclick="route='chat';render()">${backIconV66()}</button><div><b>${currentChat}</b><small>Вложения</small></div><span></span></header>
   <nav class="attachments-tabs-v66">${tabs.map(t=>`<button class="${attachmentsTabV66===t?'active':''}" onclick="attachmentsTabV66='${t}';render()">${t}</button>`).join('')}</nav>
   <div class="attachments-content-v66">${attachmentsTabV66==='Фото'
    ? `<div class="attachments-photo-grid-v66">${media.filter(m=>m.attachment?.type==='image').map(m=>`<img src="${m.attachment.url}" alt="">`).join('')||'<p>Фотографий пока нет</p>'}</div>`
    : attachmentsTabV66==='Видео'
    ? `<div>${media.filter(m=>m.attachment?.type==='video').map(m=>`<video controls src="${m.attachment.url}"></video>`).join('')||'<p>Видео пока нет</p>'}</div>`
    : attachmentsTabV66==='Файлы'
    ? `<div>${media.filter(m=>m.attachment&&!['image','video'].includes(m.attachment.type)).map(m=>`<div class="attachment-file-row-v66"><b>${m.attachment.name||'Файл'}</b><small>${m.attachment.meta||''}</small></div>`).join('')||'<p>Файлов пока нет</p>'}</div>`
    : '<p>Ссылок пока нет</p>'}
   </div>
 </section>`;
}

/* Responsive clean chat. */
function renderChatV66(){
 const rel=messages.filter(m=>!m.chat||m.chat===currentChat);
 if(isDesktopV5()){
  const listHTML=renderChats().match(/<aside class="desktop-chat-list">([\s\S]*?)<\/aside>/)?.[1]||'';
  return `<div class="desktop-messenger desktop-messenger-open desktop-messenger-v66">
   <aside class="desktop-chat-list">${listHTML}</aside>
   <section class="desktop-chat-pane">
    <header><div class="chat-avatar-v66">${currentChat.slice(0,2).toUpperCase()}</div><div><b>${currentChat}</b><small>в сети</small></div><button onclick="openSharedMedia()">•••</button></header>
    <div class="desktop-message-scroll">${rel.length?rel.map(chatMessageHTML).join(''):'<div class="desktop-chat-date">Начало переписки</div>'}</div>
    <div class="desktop-composer"><button>＋</button><input id="msg" placeholder="Сообщение" onkeydown="if(event.key==='Enter')sendMsg()"><button onclick="sendMsg()">↑</button></div>
   </section></div>`;
 }
 return `<section class="telegram-chat chat-fullscreen-v66">
   <header class="chat-head-v66">
     <button class="back-only-v66" onclick="go('chats')">${backIconV66()}</button>
     <div class="chat-avatar-v66">${currentChat.slice(0,2).toUpperCase()}</div>
     <div class="chat-head-main"><b>${currentChat}</b><small>в сети</small></div>
     <button class="chat-more-v66" onclick="openSharedMedia()">•••</button>
   </header>
   <div class="messages messages-v66">${rel.length?rel.map(chatMessageHTML).join(''):`<div class="bubble"><div class="bubble-text">Здравствуйте! Напишите, что вас интересует.</div><small class="msg-time">сейчас</small></div>`}</div>
   <div class="composer composer-v66"><button class="composer-icon" onclick="toggleAttachPanel()">＋</button><input id="msg" placeholder="Сообщение" onkeydown="if(event.key==='Enter')sendMsg()"><button class="mic-btn">◉</button><button class="send-btn" onclick="sendMsg()">↑</button></div>
 </section>`;
}
renderChat = renderChatV66;

/* Project desktop cards: half-height; proper responsive grid. */
renderDesignerProjectsV5 = function(){
 return `<div class="desktop-project-grid-v66">${DESIGNER_PROJECTS_V4.map(p=>`<article onclick="openDesignerProjectV4('${p.id}')"><img src="${p.cover}"><h3>${p.title}</h3><span>${p.city}</span></article>`).join('')}</div>`;
};

/* Story title can use 2 complete lines. */
const openStoryV66Base=openStoryV4;

/* Settings separators and global back icons. */
const renderSettingsV66Base=renderSettingsV4;

/* Main render route extension and nav hiding. */
const renderV66Base=render;
render = function(){
 const v=document.getElementById('view');
 if(route==='attachmentsV66') v.innerHTML=renderAttachmentsV66();
 else renderV66Base();
 mountDesktopNavV65();
 document.querySelectorAll('#view > .feed-tabs').forEach(el=>{if(isDesktopV5())el.remove()});
 const nav=document.querySelector('.bottom-nav');
 if(!isDesktopV5() && ['chat','story','attachmentsV66'].includes(route)) nav?.classList.add('route-hidden-v66');
 else nav?.classList.remove('route-hidden-v66');
};

/* Re-render on viewport resize so both mobile and desktop remain responsive. */
let resizeTimerV66=null;
window.addEventListener('resize',()=>{
 clearTimeout(resizeTimerV66);
 resizeTimerV66=setTimeout(()=>{shellSyncV5();render();},120);
});

/* ==================== SREDA v6.7 — verified cleanup ==================== */
const designerProfileBaseV67 = renderDesignerProfileUnifiedV5;
renderDesignerProfileUnifiedV5 = function(own){
  if(!isDesktopV5()) return designerProfileBaseV67(own);
  const key='designer:'+currentDesignerV4;
  const verified=`<img class="verified-icon-v6" src="assets/icons/verified-v6.png" alt="Верифицирован">`;
  return `<div class="desktop-designer-profile desktop-designer-profile-v67">
    <header class="desktop-designer-head"><div class="designer-avatar">АС</div><div><h1>Анна Смирнова ${verified}</h1><p>Дизайнер интерьеров · Москва</p></div>
      <div class="desktop-designer-actions">${own?`<button onclick="openDesignerV4('Анна Смирнова')">Публичный профиль</button><button onclick="openSettingsV4()">Редактировать профиль</button>`:`${followButtonV4(key)}<button onclick="currentChat='Анна Смирнова';route='chat';render()">Сообщение</button>`}</div>
    </header>
    ${own?`<button class="desktop-designer-share-v67" onclick="shareProfileV5()" aria-label="Поделиться профилем">${shareIconV66()}</button>`:''}
    <div class="desktop-designer-stats"><div><b>24</b><span>Проекты</span></div><div><b>1 245</b><span>Подписчики</span></div><div><b>320</b><span>Подписки</span></div></div>
    ${own?`<div class="desktop-profile-quick desktop-profile-quick-v67"><button onclick="profileTab='analytics';render()">Аналитика</button><button onclick="openSettingsV4()">Редактировать</button></div>`:''}
    <p class="desktop-bio">Жилые и общественные интерьеры. Москва / Европа.</p>
    <div class="desktop-designer-tabs"><button class="${designerTabV4==='projects'?'active':''}" onclick="designerTabV4='projects';render()">Проекты</button><button class="${designerTabV4==='saved'?'active':''}" onclick="designerTabV4='saved';render()">Публикации</button>${own?`<button class="${designerTabV4==='specs'?'active':''}" onclick="designerTabV4='specs';render()">Спецификация</button>`:''}</div>
    ${designerTabV4==='projects'?renderDesignerProjectsV5():designerTabV4==='specs'?renderSpecsRoot():`<div class="desktop-brand-masonry">${VISUALS.map(desktopVisualCardV5).join('')}</div>`}
  </div>`;
};

const renderProductBaseV67 = renderProductV4;
renderProductV4 = function(){
  if(!isDesktopV5()) return renderProductBaseV67();
  const p=currentProduct, sizes=p.bedSizes||p.sizes||['Стандарт'];
  const similar=PRODUCTS.filter(x=>x.id!==p.id&&(x.category===p.category||x.type===p.type)).slice(0,4);
  return `<div class="desktop-product-page desktop-product-v66 desktop-product-v67">
    <div class="desktop-product-gallery desktop-product-gallery-v67">
      <button class="desktop-back back-only-v66" onclick="productBackV6()">${backIconV66()}</button>
      <div class="desktop-product-main-v66"><img class="desktop-main-product-img" src="${p.image}" alt="${p.name}"><button class="desktop-image-fav-v66 ${favorites.has(p.id)?'is-favorite':''}" onclick="toggleFav('${p.id}',event)">${favorites.has(p.id)?'♥':'♡'}</button></div>
      <div class="desktop-thumb-row"><img src="${p.image}"><img src="${findVisualForProductV5(p)}"><img src="${p.image}"></div>
    </div>
    <aside class="desktop-product-info desktop-product-info-v67">
      <button class="desktop-brand-link brand-clean-v66" onclick="openBrandV4('${p.brand}')">${p.brand}</button><small>${p.type}</small>
      <div class="desktop-product-title"><h1>${p.name}</h1><strong>${p.priceLabel}</strong></div>
      ${pickerButtonHTMLV5('Отделка',(p.finishes||['Стандарт'])[0],p.finishes||['Стандарт'])}
      ${pickerButtonHTMLV5(p.bedSizes?'Спальное место':'Размер / формат',sizes[0],sizes)}
      <div class="desktop-product-cta"><button class="primary" onclick="specModal()">Добавить в спецификацию</button><button onclick="requestCalc()">Запросить расчёт</button></div>
      <div class="desktop-meta"><span>Срок производства</span><b>${p.production}</b></div>
      <section class="desktop-description-v6"><h3>Описание</h3><p>${p.description}</p></section>
      <div class="v4-accordions desktop-product-accordions v6-clean-accordions">${accordionV4('Характеристики',`<p>Материал: ${p.material||'—'}<br>Наличие: ${p.availability||'—'}<br>Цвет: ${p.color||'—'}</p>`)}${accordionV4('Схема с размерами',`<div class="doc-preview"><div class="dimension-demo">↔ ${sizes[0]}</div></div>`)}${accordionV4('Инструкция',`<div class="doc-row">PDF · Инструкция <button>Открыть</button></div>`)}${accordionV4('Рекомендации по уходу',`<p>Использовать мягкую сухую ткань.</p>`)}${accordionV4('Отзывы',`<div class="review-mini"><b>4,9 ★</b><span>12 отзывов</span></div>`)}</div>
    </aside>
    <section class="desktop-similar desktop-similar-v67"><h2>Похожие товары</h2><div class="desktop-product-grid">${similar.map(desktopProductCardV5).join('')}</div></section>
  </div>`;
};
