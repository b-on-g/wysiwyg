# bog/wysiwyg — контекст для агента


/mol  -- используй

## Что это

Open-source блочный WYSIWYG-редактор на **$mol/MAM** (MIT). Часть проекта WikiLive (хакатон). Репо: `https://github.com/b-on-g/wysiwyg.git`, локально: `/Users/cmyser/code/mam/bog/wysiwyg`.

Полное ТЗ хакатона: [`/Users/cmyser/code/mam/bog/wiki/PRD.md`](../wiki/PRD.md), фичи: [`/Users/cmyser/code/mam/bog/wiki/docs/WikiLive_features.md`](../wiki/docs/WikiLive_features.md).

## Структура проекта

```
bog/wysiwyg/
├── wysiwyg.view.tree      # Главный компонент — управляет списком блоков
├── wysiwyg.view.ts         # Логика: block_ids, block_enter/remove/slash, menu_picked
├── wysiwyg.view.css.ts     # Стили редактора (отступы, max-width, центрирование)
├── block/
│   ├── block.view.tree     # Блок: contenteditable div с атрибутами type/level/empty
│   ├── block.view.ts       # Логика: sub()→null, auto() синхр innerHTML, keydown хоткеи
│   ├── block.view.css.ts   # Базовые стили блока
│   └── block.view.css      # Стили по типам (heading, code, quote...), placeholder, hover
├── menu/
│   ├── menu.view.tree      # Slash-меню: список кнопок, абс. позиция
│   ├── menu.view.ts        # Команды (Текст, Заголовок 1-3, Код, Цитата, Список, Разделитель)
│   ├── menu.view.css.ts    # Стили (position:absolute, z-index, фон, скругление)
│   └── menu.view.css       # Тень, скрытие когда !showed
├── app/
│   ├── app.meta.tree       # include /mol/offline/install
│   ├── app.view.tree       # $mol_page обёртка
│   └── index.html          # Для GH Pages
├── .github/workflows/deploy.yml  # CI: GH Pages деплой
├── .gitignore
├── .gitattributes
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
- **Хоткеи**: Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline) через `document.execCommand()`
- **Блок-менеджмент**: Enter → новый блок после текущего, Backspace на пустом → удаление, фокус перемещается
- **Плейсхолдер**: CSS `::before` с `content:` на пустых блоках
- **Русский UI**: меню и плейсхолдер на русском, заголовок страницы

## Что НЕ реализовано — бэклог (в порядке приоритета)

### P0 — Критично для хакатона

1. **Markdown-форматирование при наборе** — `**bold**`→**bold**, `*italic*`→*italic*, `` `code` ``→`code`, `[text](url)`→ссылка. Подход: в `input_event` после каждого ввода искать паттерны regex в textContent, заменять на HTML (execCommand или Range API). Референс: `$mol_syntax2_md_line` в `mol/syntax2/` — регулярки для inline markdown.

2. **Вставка ссылок** — Ctrl+K → промпт URL → `document.execCommand('createLink', false, url)`. Или markdown `[text](url)`.

3. **Strikethrough** — Ctrl+Shift+S → `document.execCommand('strikeThrough')`.

4. **Giper Baza интеграция** — Страница = 1 Land. Блоки хранятся как `$giper_baza_list` ссылок на `$giper_baza_dict` (type, text). Коллаб из коробки через CRDT. Автосохранение = запись в atom. Референс: `bog/feedback2/form/form.view.ts` — двухуровневая модель (registry land + data land). ВАЖНО: `@$mol_mem` НЕЛЬЗЯ на методы возвращающие land/pawn/player.

5. **Локализация** — `locale=ru.json` для текстов $mol-компонентов.

### P1 — Обязательные фичи

6. **Ссылки между страницами + backlinks** — синтаксис `[[page_id]]` в тексте. При рендере → ссылка. Обратные ссылки: сканируем все страницы в Giper Baza на `[[target]]`.

7. **Совместная работа** — Giper Baza CRDT. Два юзера открывают один land → изменения мержатся автоматически. Показать курсоры других юзеров (опционально).

### P2 — Дополнительные фичи

8. **Комментирование к блокам** — по паттерну `bog/feedback2`. У каждого блока свой seed/land для треда комментариев. Registry land хранит маппинг block_id → comment_land_link.

9. **Версионирование** — `land.fork()` создаёт снапшот страницы. Tine хранит цепочку предков. UI: список версий, diff, откат. Референс: `giper/baza/land/land.ts:705-709`.

10. **AI-подсказки** — `$mol_github_model` (GPT-4.1-mini через GitHub Models). Контекст блока → "дописать", "переписать", "перевести". Референс: `mol/github/model/model.ts`.

11. **Граф связей** — визуализация backlinks между страницами. Giper Baza даёт данные, визуализация через canvas или SVG.

12. **Картинки** — drag&drop / paste / URL. Хранение через Giper Baza blob или внешний URL.

13. **Drag & drop блоков** — переупорядочивание блоков перетаскиванием. Обновление block_ids.

14. **MWS Tables интеграция** — embed таблицы через Fusion API (`/fusion/v1/`). Спека: `bog/wiki/docs/FUSION-API.yaml`.

15. **Плагины / расширяемость** — блочная архитектура уже позволяет добавлять типы блоков.

16. **Соответствие Design Kit** — Figma макеты.

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
В `block/block.view.ts` → `keydown_event()` — новый `if` блок с `event.key` / модификаторами.

### Markdown-форматирование (приоритет P0)
Подход: в `input_event()` или отдельном `auto()` шаге, после каждого ввода:
1. Получить textContent текущего блока
2. Найти markdown-паттерны: `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`, `[text](url)`
3. Заменить на HTML: `<b>bold</b>`, `<i>italic</i>`, `<code>code</code>`, `<s>strike</s>`, `<a href="url">text</a>`
4. Обновить innerHTML и восстановить позицию курсора

Сложность: сохранение позиции курсора после замены innerHTML. Использовать `window.getSelection()` + `Range` для запоминания offset до и восстановления после.

Регулярки для inline markdown есть в `mol/syntax2/syntax2.ts` — `$mol_syntax2_md_line`.

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
