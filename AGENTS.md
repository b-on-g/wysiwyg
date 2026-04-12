# bog/wysiwyg — контекст для агента


/mol  -- используй

## Что это

Open-source блочный WYSIWYG-редактор на **$mol/MAM** (MIT). Часть проекта WikiLive (хакатон). Репо: `https://github.com/b-on-g/wysiwyg.git`, локально: `/Users/cmyser/code/mam/bog/wysiwyg`.

Полное ТЗ хакатона: [`/Users/cmyser/code/mam/bog/wiki/PRD.md`](../wiki/PRD.md), фичи: [`/Users/cmyser/code/mam/bog/wiki/docs/WikiLive_features.md`](../wiki/docs/WikiLive_features.md).

## Структура проекта

```
bog/wysiwyg/
├── wysiwyg.view.tree      # Главный компонент — управляет списком блоков
├── wysiwyg.view.ts         # Логика: block_ids, Giper Baza CRUD, drag&drop, AI, comments
├── wysiwyg.view.css.ts     # Стили редактора (отступы, max-width, центрирование)
├── wysiwyg.test.ts         # Интеграционные тесты (45+): меню, блоки, drag&drop, image
├── block/
│   ├── block.view.tree     # Блок: contenteditable div с атрибутами type/level/empty
│   ├── block.view.ts       # sub()→null, auto(), markdown, hotkeys, paste/drop image
│   ├── block.view.css.ts   # Стили блоков по типам
│   └── block.test.ts       # Тесты: markdown, hotkeys, links, images
├── menu/
│   ├── menu.view.tree      # Slash-меню: список кнопок, абс. позиция
│   ├── menu.view.ts        # Команды (Текст, H1-3, Код, Цитата, Список, Разделитель, Картинка)
│   └── menu.view.css.ts    # Стили меню
├── ai/
│   ├── ai.view.tree        # AI-меню: Дописать, Переписать, Перевести, Упростить
│   ├── ai.view.ts          # GitHub Models API (GPT-4.1-mini), JSON response
│   ├── ai.view.css.ts      # Стили AI-меню
│   └── ai.test.ts          # Тесты AI (15 тестов)
├── model/
│   ├── page/page.ts        # $bog_wysiwyg_model_page — Giper Baza dict (Title, Blocks, Versions, Comments)
│   ├── block/block.ts      # $bog_wysiwyg_model_block — dict (Type, Level, Content)
│   └── comment/comment.ts  # $bog_wysiwyg_model_comment — dict (Text, Author, Time)
├── links/
│   ├── links.view.tree     # Панель обратных ссылок (backlinks)
│   ├── links.view.ts       # Поиск [[page_id]] по всем страницам
│   ├── links.view.css.ts   # Стили
│   └── links.test.ts       # Тесты (6)
├── collab/
│   ├── collab.view.tree    # Индикатор синхронизации + аватары пиров
│   ├── collab.view.ts      # Giper Baza yard.master(), land._gift
│   └── collab.view.css.ts  # Стили
├── comment/
│   ├── comment.view.tree   # Кнопка комментариев + $mol_pop панель
│   ├── comment.view.ts     # toggle/close логика
│   ├── comment.view.css.ts # Стили
│   ├── comment.test.ts     # Тесты (9)
��   └── thread/
│       ├── thread.view.tree # Тред комментариев: список + input + send
│       ├── thread.view.ts   # Giper Baza CRUD для комментариев
│       └── thread.view.css.ts
├── history/
│   ├── history.view.tree   # Список версий + кнопка сохранения
│   ├── history.view.ts     # land.fork(), restore через Tine
│   └── history.view.css.ts # Стили
├��─ graph/
│   ├── graph.view.tree     # Canvas для визуализации связей
│   ├── graph.view.ts       # Force-directed layout, drag, click navigate
│   ├── graph.view.css.ts   # Стили
│   └── graph.test.ts       # Тесты (9)
├── plugin/
│   ├── plugin.ts           # $bog_wysiwyg_plugin_config интерфейс
│   ├── registry.ts         # $bog_wysiwyg_plugin_registry — static Map
│   ├── registry.test.ts    # Тесты (7)
│   └── callout/
│       ├── callout.ts      # Пример плагина: блок-подсказка
│       └── callout.view.css.ts
├── app/
│   ├── app.meta.tree       # include /mol/offline/install
│   ├── app.view.tree       # $mol_page обёртка
│   └── index.html          # Для GH Pages
├── locale=en.json          # English UI strings
├── locale=ru.json          # Russian UI strings
├── .github/workflows/deploy.yml
├── README.md
└── LICENSE                 # MIT
```

## Как работает contenteditable + $mol

Ключевая проблема: `$mol_view` управляет DOM через `sub()` → `render()` → `$mol_dom_render_children()`. Это конфликтует с `contenteditable`, где браузер сам создаёт DOM-узлы.

**Решение** (в `block.view.ts`):
1. `sub()` возвращает `null` → в `render()` строка `if( !sub ) return` пропускает child reconciliation
2. `auto()` вызывается после `render()` в `dom_tree()` — синхронизирует `innerHTML` из реактивного `html()`
3. Когда блок в фокусе — `auto()` НЕ трогает innerHTML (чтобы не сбить курсор)
4. Когда блок НЕ в фокусе — `auto()` обновляет innerHTML (для collab-изменений)
5. `input` event обновляет `html()` из DOM → остальная реактивность подхватывает

Код из `mol/view/view/view.tsx:300-323`:
```typescript
render() {
    const node = this.dom_node_actual()  // attrs и styles ПРИМЕНЯЮТСЯ
    const sub = this.sub_visible()
    if( !sub ) return                    // ← НАША ТОЧКА: дети НЕ трогаются
    // ... children reconciliation ...
    $mol_dom_render_children( node, nodes ) // ← НЕ вызывается
}
```

## Что реализовано

- **Блочный редактор**: `block_ids` → `$mol_list` с `Block*` (keyed factory)
- **Типы блоков**: paragraph, heading (1-3), code, quote, list, divider — через CSS атрибут `bog_wysiwyg_block_type`
- **Slash-меню**: `/` на пустом блоке → абс.-позиционированный `$bog_wysiwyg_menu` → выбор типа
- **Хоткеи**: Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline), Ctrl+Shift+S (strikethrough), Ctrl+K (ссылка)
- **Markdown inline**: `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`, `[text](url)` — конвертация при наборе через regex + Range API
- **Блок-менеджмент**: Enter → новый блок после текущего, Backspace на пустом → удаление, фокус перемещается
- **Плейсхолдер**: CSS `::before` с `content:` на пустых блоках
- **Русский UI**: меню и плейсхолдер на русском, заголовок страницы
- **Тесты**: `wysiwyg.test.ts` (меню, интеграция), `block/block.test.ts` (markdown, hotkeys)

## Реализованные фичи (бывший бэклог)

Все основные фичи реализованы:

1. ~~**Markdown-форматирование при наборе**~~ — DONE. `block/block.view.ts:try_markdown()` + regex + Range API
2. ~~**Вставка ссылок**~~ — DONE. Ctrl+K → prompt → `createLink`. `block/block.view.ts:link_exec()`
3. ~~**Strikethrough**~~ — DONE. Ctrl+Shift+S → `strikeThrough`. `block/block.view.ts:strike_exec()`
4. ~~**Giper Baza интеграция**~~ — DONE. `model/page/page.ts`, `model/block/block.ts`. Страница = 1 Land, блоки = pawns. CRDT автосинк. `wysiwyg.view.ts` — `has_baza()`, `page_land()`, `page_data()`, `baza_block()`.
5. ~~**Локализация**~~ — DONE. `locale=en.json`, `locale=ru.json` в корне и подмодулях.
6. ~~**Ссылки между страницами + backlinks**~~ — DONE. `[[page_id]]` markdown → `links/` модуль, панель backlinks.
7. ~~**Совместная работа**~~ — DONE. `collab/` модуль: индикатор синхронизации (online/offline), аватары пиров.
8. ~~**Комментирование к блокам**~~ — DONE. `comment/` + `comment/thread/`: потоки комментариев, Giper Baza хранилище.
9. ~~**Версионирование**~~ — DONE. `history/`: `land.fork()` снапшоты, список версий, restore через Tine.
10. ~~**AI-подсказки**~~ — DONE. `ai/`: Ctrl+J → меню (Дописать, Переписать, Перевести, Упростить), GitHub Models API.
11. ~~**Граф связей**~~ — DONE. `graph/`: force-directed canvas layout, drag nodes, click navigate.
12. ~~**Картинки**~~ — DONE. paste/drop → `insert_image_file()`, URL через slash-меню → `<img>` блок.
13. ~~**Drag & drop блоков**~~ — DONE. `Block_row` с `Drag_handle`, dragstart/dragover/drop, `move_block()`.
14. ~~**Плагины / расширяемость**~~ — DONE. `plugin/`: `$bog_wysiwyg_plugin_config` интерфейс, `$bog_wysiwyg_plugin_registry`, пример `callout/`.

### Ещё не реализовано
- MWS Tables интеграция (embed таблицы через Fusion API)
- Соответствие Design Kit (Figma макеты)

## Как продолжать разработку

### Билд
```bash
# НЕ запускай npx mam вручную — MAM пересобирается автоматически
# Dev server: http://localhost:9080/bog/wysiwyg/app/-/test.html
```

### Добавить новый тип блока
1. CSS в `block/block.view.css` — селектор `[bog_wysiwyg_block_type="mytype"]` ---- полностью везде надо перейти на view.css.ts !!!!!!!!!!!!!
2. Команду в `menu/menu.view.ts` → `commands()` массив
3. Обработку в `wysiwyg.view.ts` → `menu_picked()` если нужна спец-логика

### Добавить хоткей
В `block/block.view.tree` добавь `$mol_hotkey` плагин или в `block/block.view.ts` → `keydown_event()`. Паттерн: `bold_exec`, `italic_exec`, `strike_exec`, `link_exec`.

### Markdown inline (реализовано)
В `block/block.view.ts:try_markdown()` — regex-паттерны + Range API. Вызывается из `input_event`. Один паттерн за проход, курсор ставится после нового элемента.

### Giper Baza интеграция (приоритет P0)
Модель данных:
```
Page (Land)
├── title: $giper_baza_atom_text
├── blocks: $giper_baza_list_link  (упорядоченный список ссылок на блоки)
├── Block (Pawn, $giper_baza_dict)
│   ├── type: $giper_baza_atom_text  ("paragraph", "heading", ...)
│   ├── level: $giper_baza_atom_numb  (для heading)
│   └── content: $giper_baza_atom_text  (HTML-содержимое)
```

Референсы:
- `bog/feedback2/` — паттерн двухуровневого land (registry + data)
- `bog/blitz/` — пример сложной Giper Baza интеграции
- `giper/baza/land/land.ts:705` — `fork()` для версионирования
- ВАЖНО: `@$mol_mem` НЕЛЬЗЯ на land/pawn/player (circular subscription)
- `land.sync()` НЕ нужен — база синкает сама
- Async загрузка `.baza`: `@$mol_mem baza_ready()` (ретраит промисы)

## $mol-специфика (правила из MEMORY.md)

- `$mol_view` делает `display: flex` по умолчанию
- Стили через `.view.css.ts` (`$mol_style_define`), raw `.view.css` для pseudo/hover/keyframes
- `as any` ЗАПРЕЩЁН в стилях
- Shorthand: `borderRadius`, `minWidth`, `maxWidth`, `boxSizing`, `whiteSpace`
- НО: `borderRadius` принимает только `string`. Для `$mol_gap.*` → развёрнутая форма
- Padding shorthand-строки ЗАПРЕЩЕНЫ: `'0.5rem 1rem'` → `{top,bottom,left,right}`
- Цвета: `rgba()` → hex `#rrggbbaa`. box-shadow: `spread` обязателен
- Attribute selectors: `'@': { 'attr-name': { value: { ...styles } } }`
- Билд: НЕ запускать `npx mam` вручную — авто-пересборка
