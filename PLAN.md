# WikiLive WYSIWYG — План реализации

## Репозиторий
- Код: `bog/wysiwyg` (MIT, open-source: https://github.com/b-on-g/wysiwyg.git)
- Стек: $mol/MAM + Giper Baza
- Коллаб: Giper Baza CRDT (не внешний сервис)

## Архитектура
- Блочный редактор: каждый блок = отдельный `$mol_view` с `contenteditable`
- Страница = 1 Land в Giper Baza
- Блоки = pawns/dict в land (упорядоченный список)
- Автосохранение бесплатно через Giper Baza (CRDT + локальный кеш)
- Комментарии по паттерну `bog/feedback2` (per-block land)
- Версионирование через `land.fork()` + Tine
- AI через `$mol_github_model` (GPT-4.1-mini)
- Граф связей — backlinks из данных Giper Baza

## Фичи

### Обязательные
1. **Интеграция с MWS Tables через API** — позже, через Fusion API
2. **Создание и редактирование вики-страницы** — блочный WYSIWYG
3. **Вставка таблицы MWS Tables в тело страницы** — позже
4. **Автосохранение + локальный кеш + восстановление** — Giper Baza из коробки
5. **Slash-menu для быстрого добавления блоков** — кастомный, по паттерну `bog/ui/command`
6. **Горячие клавиши** — для slash-menu и команд редактора
7. **Ссылки на другие страницы и обратные ссылки (backlinks)** — `[[page_id]]` синтаксис, граф из Giper Baza
8. **Совместная работа** — Giper Baza CRDT, несколько пользователей в одном land
9. **Редактор на open-source основе, MIT** — свой, https://github.com/b-on-g/wysiwyg.git

### Дополнительные
10. **Таблица как живой объект (синхронизация с MWS Tables)** — позже
11. **Комментирование** — per-block, по паттерну `bog/feedback2`, на Giper Baza
12. **Версионирование / история правок / черновики** — `land.fork()` + Tine цепочка
13. **AI-подсказки или генерация блоков** — `$mol_github_model`
14. **Граф связей между страницами** — backlinks из данных Giper Baza
15. **Плагины / расширяемость редактора** — блочная архитектура позволяет добавлять типы блоков
16. **Встраивание внешних элементов (виджеты, превью)** — embed-блоки
17. **Соответствие Design Kit** — Figma макеты

## Типы блоков (минимум на старте)
- Параграф (rich text: bold/italic/links)
- Заголовки (H1-H3)
- Список (ul/ol)
- Код
- Цитата
- Разделитель
- Картинка

## References
- `$mol_text` — reference по типам блоков и токенизации (read-only markdown renderer)
- `$mol_paragraph` — базовый контейнер для текста
- `bog/ui/command` — паттерн для slash-menu
- `bog/feedback2` — паттерн для комментариев на Giper Baza
- `$mol_github_model` — AI интеграция
- `giper/baza/land/land.ts` — fork API для версионирования
