# bog/wysiwyg

Open-source блочный WYSIWYG-редактор на **$mol/MAM**. MIT License.

Часть проекта [WikiLive](../wiki/PRD.md) — вики-система с живыми таблицами.

## Запуск

```bash
# Внутри MAM workspace
# Dev server: http://localhost:9080/bog/wysiwyg/app/-/test.html
# Билд автоматический — не запускать npx mam вручную
```

## Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `Enter` | Новый блок |
| `Backspace` (пустой) | Удалить блок |
| `/` (пустой блок) | Slash-меню |
| `↑` / `↓` (в меню) | Навигац��я по пунктам |
| `Enter` (в меню) | Выбрать пункт |
| `Escape` (в меню) | Закрыть меню |
| `Ctrl/Cmd + B` | **Жирный** (`$mol_hotkey`) |
| `Ctrl/Cmd + I` | *Курсив* (`$mol_hotkey`) |
| `Ctrl/Cmd + U` | Подчёркнутый (`$mol_hotkey`) |
| `Ctrl/Cmd + Shift + S` | ~~Зачёркнутый~~ (`$mol_hotkey`) |
| `Ctrl/Cmd + K` | Вставить ссылку |
| `**text**` | **Жирный** (markdown) |
| `*text*` | *Курсив* (markdown) |
| `` `text` `` | `Код` (markdown) |
| `~~text~~` | ~~Зачёркнутый~~ (markdown) |
| `[text](url)` | Ссылка (markdown) |

## Типы блоков

Текст, Заголовки H1-H3, Код, Цитата, Список, Разделитель

## Архитектура

Блочный редактор: каждый блок — `$mol_view` + `contenteditable`. Подробности в [AGENTS.md](AGENTS.md).

## Статус реализации

### Готово
- [x] Блочный редактор с contenteditable
- [x] Типы блоков: параграф, H1-H3, код, цитата, список, разделитель
- [x] Slash-меню (/) с навигацией стрелками и Enter
- [x] Горячие клавиши через `$mol_hotkey`: Bold, Italic, Underline, Strikethrough
- [x] Ctrl+K — вставка ссылок
- [x] Markdown-форматирование при наборе: `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`, `[text](url)`
- [x] Enter/Backspace — управление блоками
- [x] Все стили в `.view.css.ts` (`$mol_style_define`), без `.view.css`
- [x] Перенос текста на следующую строку (`display: block`, `overflow-wrap`)
- [x] Плейсхолдер
- [x] GitHub Pages CI
- [x] Тесты: меню, markdown, hotkeys, интеграционные

### Бэклог
- [ ] Локализация (locale=ru.json)
- [ ] Giper Baza интеграция (коллаб, persistence, автосохранение)
- [ ] Ссылки между страницами + обратные ссылки (backlinks)
- [ ] Совместная работа (Giper Baza CRDT)
- [ ] Комментирование к блокам
- [ ] Версионирование / история правок (land.fork())
- [ ] AI-подсказки ($mol_github_model)
- [ ] Граф связей между страницами
- [ ] Картинки
- [ ] Drag & drop блоков
- [ ] Плагины / расширяемость

## Лицензия

MIT
