# среда. — demo

Чистая версия демо для GitHub Pages.

## Структура
- `index.html`
- `css/style.css`
- `js/app.js`
- `data/catalog.js`
- `assets/logo.png`
- `assets/icons/`
- `assets/products/`
- `assets/visuals/`

## Обновление GitHub
Загрузите **всё содержимое** этой папки в корень репозитория `sreda`, заменив существующие файлы.

GitHub Pages:
- Branch: `main`
- Folder: `/ (root)`

Публичный адрес:
`https://sterkhova97-design.github.io/sreda/`

## v2
- рекламный баннер заменён на сторис-кружки;
- «Топ 10 диванов», «Новинки Gessi», «Isaloni», «Выставка интерьера Москва»;
- верхняя шапка и логотип уменьшены;
- нижняя навигация сделана компактной плавающей панелью как у Pinterest;
- сохранены наши иконки.

## v3
- сторис закреплены в один горизонтальный ряд, подписи могут занимать 2 строки;
- добавлен Pinterest-like поиск по фрагменту изображения;
- рамку можно перемещать и растягивать пальцем/мышкой;
- выделенный фрагмент реально кропается через canvas;
- результаты автоматически перестраиваются;
- в браузерной демо-логике Shad выводится первым для широкого фрагмента кровати.

## v3.1 cache fix
В index.html добавлены версии `?v=31` к CSS/JS/data, чтобы iPhone/Telegram не использовали старый кэш.

## v3.2 — LO-RA visual demo
- visual search now inspects average color/brightness of the selected image fragment;
- the dark warm-brown LO-RA room ranks LO-RA first;
- the red/white Shad room continues to rank Shad first;
- cache version bumped to v=32.
