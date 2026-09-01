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

## v3.5
- добавлен радиатор MODEL A H, бренд METALNO, цена от 13 000 ₽;
- категория: Радиаторы;
- добавлено новое изображение карточки.

## v3.6
- визуальный поиск Shad/LO-RA переделан на сравнение с эталонными изображениями, а не только по цвету;
- мессенджер пересобран: фото, видео, файлы, ссылки, окно общих вложений и запись голосового;
- cache busting v=36.

## v3.7
- исходящие сообщения сделаны тёмными с белым текстом;
- добавлены статусы сообщений: ✓ доставлено, ✓✓ прочитано;
- в демо сообщение автоматически меняет статус на прочитано примерно через 1,6 секунды;
- cache busting v=37.

## v4.0 — функциональный прототип
Первый крупный блок перехода от demo-экранов к цельному кликабельному прототипу:
- страницы бренда и дизайнера, подписки, партнёрская скидка, статус «Участник площадки»;
- Pinterest-проекты дизайнера и закрытый доступ поставщика к АР;
- новая карточка товара: share/favorite, bottom-sheet выбор, схема, инструкция, уход, отзывы;
- функциональные stories и рекламная карусель;
- ЛК поставщика: создание товара, оценка качества фото, «Обработка ИИ», документы, предпросмотр;
- UI для подключения image API (Nano Banana скрыт за названием «Обработка ИИ»);
- общая аналитика поставщика без оплат/выручки и аналитика отдельного товара;
- ЛК модератора: товары, регистрация брендов, верификация дизайнеров;
- настройки, уведомления, избранное с папками;
- desktop-адаптация.

## v4.1
Стабилизация desktop/mobile верстки, справочник категорий, новый рекламный баннер, исправления Избранного и кликабельная карточка товара в модерации.

## v5.0 — unified prototype
Крупная сборка, где мобильная и desktop-верстки разделены как самостоятельные композиции на одной ссылке.

Основное:
- desktop: верхняя навигация вместо нижней, категории + строка поиска, уведомления и меню аккаунта справа;
- desktop: отдельная двухколоночная карточка товара, отдельные страницы бренда, дизайнера, ЛК и Telegram-подобный мессенджер;
- desktop: всплывающие уведомления в стиле Pinterest и плавающая поддержка;
- desktop: модератор = Верификация / Аналитика / Поддержка; архив решений и комментарий модератора;
- аналитика: экспорт в Excel для поставщика, товара и модератора;
- mobile: splash screen, шапка только на главной, единая стрелка назад на внутренних экранах;
- mobile: единая геометрия профиля для ЛК и публичного просмотра; быстрые действия Аналитика / Редактировать / Поделиться и ☰ настройки;
- mobile: Instagram-подобные настройки;
- mobile: рекламный баннер edge-to-edge;
- mobile: исправлены избранное, папки, симметричные отступы, пустое состояние и категории;
- проект: скачивание АР для поставщика с доступом;
- страница бренда без hero-обложки;
- фильтры расширены материалами/декором/ручным размером;
- системные prompt заменены собственным окном для создания папки;
- поддержка сервиса и обращения;
- ИИ-обработка карточки товара сохранена из v4.1.


## v6.0 — consolidated review build
- единая desktop/mobile сборка всех согласованных правок;
- корректный возврат из карточки товара в модерацию;
- desktop dropdown для конфигураций товара;
- центрированное окно добавления в спецификацию и 16 px действия;
- красные активные сердечки;
- новый набор иконок уведомлений/сообщений/поиска/фильтра/спецификации/проектов;
- Pinterest-верстка проектов и публикация визуализации с лайками, комментариями и рекомендациями;
- спецификация возвращена в ЛК дизайнера;
- мобильный ЛК поставщика переведён на иконки;
- аналитика с периодом и выгрузкой, история метрик модератора и журнал ошибок;
- поддержка модератора в формате мессенджера со статусами и вложениями;
- фильтры переделаны в раскрывающиеся секции;
- глобальный safe-area для нижних окон, чтобы нижнее меню не перекрывало контент;
- рекламный блок мобильной главной восстановлен по высоте.


## v6.4 review consolidation
- fixed settings layout and installed supplied settings icons;
- back arrows are icon-only everywhere;
- plain notification bell and filter icon without background;
- one supplier analytics period row only, custom period uses `date — date`;
- supplier requests use compact Telegram-like list with readable typography;
- favorites `+` is icon-only;
- fullscreen chat/story and Instagram-style comments hide bottom navigation;
- mobile product info typography reduced; brand separator/chevron removed;
- filter size fields compact and stacked correctly;
- project visualization linked products no longer show prices;
- resident badge uses supplied shop icon;
- black active buttons are forced to white text.


## v6.7 — consolidated responsive review
- one desktop category row only; hover subcategories and inline search;
- responsive full-width desktop layout and viewport-height chat/support;
- unified mobile gutters and content-sized bottom sheets;
- all back actions use the supplied icon, no square backgrounds;
- supplied dropdown, share, print/resident assets prepared;
- favorites folder chips unified and subtitle removed;
- mobile designer/supplier profile headers unified; share is icon-only;
- supplier profile tabs span full width;
- supplier requests now match messenger geometry and open chats;
- unread chat counts use compact numeric badges;
- attachments open as their own Telegram-like screen;
- designer Orders page works and order statuses use muted color badges;
- desktop product favorite moved to photo corner; brand separator/arrow removed;
- filters use compact stacked range controls and supplied dropdown arrows;
- project cards are responsive and shorter on desktop;
- stories allow full two-line titles;
- analytics/info typography and repeated UI chips normalized;
- global black-button rule enforces white text/icons.
