# bog/wysiwyg

Open-source блочный WYSIWYG-редактор на **$mol/MAM**. MIT License.

## Запуск

```bash
# Внутри MAM workspace
cd /path/to/mam
npx mam bog/wysiwyg/app

# Открыть
open http://localhost:9080/bog/wysiwyg/app/-/test.html
```

## Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `Enter` | Новый блок |
| `Backspace` (пустой блок) | Удалить блок |
| `/` (пустой блок) | Slash-меню выбора типа блока |
| `Ctrl/Cmd + B` | **Жирный** |
| `Ctrl/Cmd + I` | *Курсив* |
| `Ctrl/Cmd + U` | Подчёркнутый |

## Типы блоков

- Текст (параграф)
- Заголовки H1, H2, H3
- Код
- Цитата
- Список
- Разделитель

## Архитектура

Блочный редактор: каждый блок — отдельный `$mol_view` с `contenteditable`.

```
bog/wysiwyg/
  wysiwyg.view.*     — основной компонент (управление блоками)
  block/block.view.*  — contenteditable блок
  menu/menu.view.*    — slash-меню
  app/                — демо-приложение
```

### Ключевой приём: contenteditable + $mol

`$mol_view` управляет DOM-деревом через `sub()`. Для contenteditable это конфликт — браузер сам создаёт DOM-узлы при вводе. Решение:

- `sub()` возвращает `null` — $mol не трогает детей блока
- `auto()` синхронизирует `innerHTML` из реактивного состояния (только когда блок не в фокусе)
- `input` event обновляет реактивное состояние из DOM

## Статус реализации

### Готово

- [x] Блочный редактор с contenteditable
- [x] Типы блоков: параграф, заголовки, код, цитата, список, разделитель
- [x] Slash-меню для смены типа блока
- [x] Горячие клавиши: Bold, Italic, Underline
- [x] Enter/Backspace — создание/удаление блоков
- [x] CSS стили для всех типов блоков
- [x] Плейсхолдер для пустых блоков
- [x] GitHub Pages deploy (CI)

### В процессе

- [ ] Markdown-форматирование (`**bold**`, `*italic*`, `` `code` ``, `[link](url)`)
- [ ] Вставка ссылок (Ctrl+K)
- [ ] Strikethrough (Ctrl+Shift+S)
- [ ] Giper Baza интеграция (коллаб, persistence, автосохранение)
- [ ] Комментарии к блокам ($mol_chat / Giper Baza)
- [ ] Версионирование (land.fork())
- [ ] AI-подсказки ($mol_github_model)
- [ ] Обратные ссылки / граф страниц
- [ ] MWS Tables интеграция (Fusion API)
- [ ] Картинки
- [ ] Drag & drop переупорядочивание блоков

## Лицензия

MIT
