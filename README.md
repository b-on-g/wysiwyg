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
| `Ctrl/Cmd + B` | **Жирный** |
| `Ctrl/Cmd + I` | *Курсив* |
| `Ctrl/Cmd + U` | Подчёркнутый |

## Типы блоков

Текст, Заголовки H1-H3, Код, Цитата, Список, Разделитель

## Архитектура

Блочный редактор: каждый блок — `$mol_view` + `contenteditable`. Подробности в [AGENTS.md](AGENTS.md).

## Статус реализации

### Готово
- [x] Блочный редактор с contenteditable
- [x] Типы блоков: параграф, H1-H3, код, цитата, список, разделитель
- [x] Slash-меню (/)
- [x] Горячие клавиши: Bold, Italic, Underline
- [x] Enter/Backspace — управление блоками
- [x] CSS стили для всех типов
- [x] Плейсхолдер
- [x] GitHub Pages CI

### Бэклог
- [ ] Markdown-форматирование (`**bold**`, `*italic*`, `` `code` ``, `[link](url)`)
- [ ] Вставка ссылок (Ctrl+K)
- [ ] Strikethrough (Ctrl+Shift+S)
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
- [ ] MWS Tables интеграция (Fusion API)
- [ ] Плагины / расширяемость
- [ ] Соответствие Design Kit

## Лицензия

MIT
