namespace $ {

	/** Google Docs: wrapper b with normal weight, styled spans, c1 c2 classes, docs-internal-guid. */
	const paste_fixture_gdocs = `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-9f1e2b3c-7fff-aaaa-bbbb-ccccdddd"><h1 dir="ltr" style="line-height:1.38;margin-top:20pt;margin-bottom:6pt;"><span style="font-size:20pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Планы на квартал</span></h1><p dir="ltr" style="line-height:1.38;"><span class="c1 c5" style="font-size:11pt;font-family:Arial;font-weight:700;text-decoration:none;white-space:pre-wrap;">Важно</span><span class="c1" style="font-size:11pt;font-weight:400;text-decoration:none;white-space:pre-wrap;">:&nbsp;успеть до </span><span class="c3" style="font-size:11pt;font-style:italic;white-space:pre-wrap;">пятницы</span></p><p dir="ltr"><span style="text-decoration:underline;-webkit-text-decoration-skip:none;text-decoration-skip-ink:none;"><a class="c9" href="https://example.com/plan">план</a></span></p><ul style="margin-top:0;padding-inline-start:48px;"><li dir="ltr" style="list-style-type:disc;font-size:11pt;" aria-level="1"><p dir="ltr" style="line-height:1.38;" role="presentation"><span style="font-weight:400;white-space:pre-wrap;">Первый пункт</span></p></li><li dir="ltr" style="list-style-type:disc;" aria-level="1"><p dir="ltr" role="presentation"><span style="font-weight:400;">Второй пункт</span></p></li></ul></b>`

	/** Word: o:p and w:sdt tags, mso-* styles, MsoListParagraph items, conditional comments. */
	const paste_fixture_word = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta name=Generator content="Microsoft Word 15"><style><!-- p.MsoNormal {margin:0cm;font-size:11.0pt;} --></style></head><body lang=RU><p class=MsoNormal><span style='font-size:12.0pt;mso-fareast-language:EN-US'>Обычный абзац с <b style='mso-bidi-font-weight:normal'>жирным</b> словом<o:p></o:p></span></p><p class=MsoListParagraphCxSpFirst style='margin-left:36.0pt;text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='font-family:Symbol;mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp; </span></span><![endif]><span style='mso-fareast-language:EN-US'>Пункт один<o:p></o:p></span></p><p class=MsoListParagraphCxSpLast style='mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp; </span></span><![endif]><span>Пункт два<o:p></o:p></span></p><w:sdt><p class=MsoNormal>Служебное<o:p></o:p></p></w:sdt></body></html>`

	/** Notion: block ids, data-token-index, nested list, pre code with language, figure with img. */
	const paste_fixture_notion = `<meta charset='utf-8'><span data-token-index="0" style="caret-color: rgb(55, 53, 47); font-family: ui-sans-serif;"></span><h2 id="1a2b3c4d-0000-8000-8000-000000000001" data-block-id="1a2b" class="notion-heading">Как это работает</h2><p id="1a2b3c4d-0000-8000-8000-000000000002" class="notion-text-block">Просто <strong>берём</strong> и <em>делаем</em>, смотри <a href="https://notion.so/doc">доку</a>.</p><ul class="bulleted-list"><li style="list-style-type:disc">раз<ul class="bulleted-list"><li style="list-style-type:circle">раз-раз</li></ul></li><li style="list-style-type:disc">два</li></ul><pre class="code" style="background:rgb(247,246,243);"><code class="language-TypeScript">const a: number = 1
console.log( a &lt; 2 )</code></pre><figure><img src="https://notion.so/image/pic.png" alt="скрин" width="700"></figure>`

	/** Ordinary web page: article markup, blockquote, hr, table, script, hidden div, unsafe link. */
	const paste_fixture_web = `<article><h1 class="post-title">Заголовок статьи</h1><p>Текст с <strong>жирным</strong>, <em>курсивом</em>, <s>зачёркнутым</s> и <code>inline_code()</code>.</p><blockquote><p>Первая строка цитаты.</p><p>Вторая строка.</p></blockquote><hr><h4>Мелкий заголовок</h4><ol><li>Раз</li><li>Два</li></ol><pre><code class="language-js">let x = 1 &amp;&amp; 2</code></pre><p><img src="/img/photo.jpg" alt="фото"></p><p><a href="javascript:alert(1)">не ссылка</a> и <a href="https://ok.example/a?b=1&amp;c=2">ссылка</a></p><table><tr><th>Ключ</th><th>Значение</th></tr><tr><td>a</td><td>1</td></tr></table><script>alert(2)</script><div style="display:none">скрытое</div><!-- комментарий --></article>`

	const paste_fixture_md = [
		'# Заголовок',
		'',
		'Абзац с **жирным**, *курсивом*, ~~зачёркнутым~~, `кодом` и [ссылкой](https://example.com/a?b=1&c=2).',
		'',
		'## Подзаголовок',
		'',
		'- раз',
		'- два',
		'  - вложенный',
		'',
		'1. один',
		'2. два',
		'',
		'> Цитата первая',
		'> Цитата вторая',
		'',
		'```ts',
		'const a = 1 < 2',
		'```',
		'',
		'---',
		'',
		'![картинка](https://example.com/pic.png)',
		'',
		'| Ключ | Значение |',
		'| --- | --- |',
		'| a | 1 |',
	].join( '\n' )

	/** Anything an editor leaves behind that must never reach a block. */
	const paste_dirt = /style=|data-[a-z]|aria-|<span|<div|<o:p|<w:|docs-internal-guid|&nbsp;|\u00A0|<!--|role=/

	function paste_dirty( drafts: $bog_wysiwyg_paste_draft[] ) {
		return drafts.filter( draft => paste_dirt.test( draft.content ) ).map( draft => draft.content )
	}

	/** class= is junk everywhere except the language marker of a code block. */
	function paste_classy( drafts: $bog_wysiwyg_paste_draft[] ) {
		return drafts.filter( draft => draft.type !== 'code' && draft.content.includes( 'class=' ) ).map( draft => draft.content )
	}

	function paste_types( drafts: $bog_wysiwyg_paste_draft[] ) {
		return drafts.map( draft => draft.type )
	}

	function paste_clipboard( html: string, text: string ): $bog_wysiwyg_paste_data {
		return { getData: ( type: string ) => type === 'text/html' ? html : text }
	}

	$mol_test( {

		'detect: rich html wins over plain text'() {
			const kind = $bog_wysiwyg_paste.detect( paste_clipboard( paste_fixture_gdocs, 'Планы на квартал' ) )
			$mol_assert_equal( kind, 'html' )
		},

		'detect: code editor html is only colored spans, so markdown from plain text'() {
			const html = '<div style="color:#d4d4d4;background:#1e1e1e"><div><span style="color:#569cd6"># Привет</span></div></div>'
			const kind = $bog_wysiwyg_paste.detect( paste_clipboard( html, '# Привет\n\n- раз\n- два' ) )
			$mol_assert_equal( kind, 'markdown' )
		},

		'detect: markdown from plain text when html is absent'() {
			$mol_assert_equal( $bog_wysiwyg_paste.detect( paste_clipboard( '', '# Привет' ) ), 'markdown' )
			$mol_assert_equal( $bog_wysiwyg_paste.detect( paste_clipboard( '', '- раз\n- два' ) ), 'markdown' )
			$mol_assert_equal( $bog_wysiwyg_paste.detect( paste_clipboard( '', 'см. [доку](https://x.dev)' ) ), 'markdown' )
			$mol_assert_equal( $bog_wysiwyg_paste.detect( paste_clipboard( '', '```\ncode\n```' ) ), 'markdown' )
			$mol_assert_equal( $bog_wysiwyg_paste.detect( paste_clipboard( '', '> цитата' ) ), 'markdown' )
		},

		'detect: prose without markup is plain text'() {
			const text = 'Просто две строки обычного текста.\nБез всякой разметки.'
			$mol_assert_equal( $bog_wysiwyg_paste.detect( paste_clipboard( '', text ) ), 'text' )
			$mol_assert_equal( $bog_wysiwyg_paste.detect( paste_clipboard( '<span style="color:red">' + text + '</span>', text ) ), 'text' )
		},

		'detect: bold span in html counts as rich'() {
			const html = '<span style="font-weight:700">важно</span>'
			$mol_assert_equal( $bog_wysiwyg_paste.detect( paste_clipboard( html, 'важно' ) ), 'html' )
		},

		'from_html: google docs keeps structure and drops wrappers'() {

			const drafts = $bog_wysiwyg_paste.from_html( paste_fixture_gdocs )

			$mol_assert_equal( paste_types( drafts ), [ 'heading', 'paragraph', 'paragraph', 'list', 'list' ] )
			$mol_assert_equal( drafts[ 0 ], { type: 'heading', level: 1, content: 'Планы на квартал' } )
			$mol_assert_equal( drafts[ 1 ].content, '<b>Важно</b>: успеть до <i>пятницы</i>' )
			$mol_assert_equal( drafts[ 2 ].content, '<a href="https://example.com/plan">план</a>' )
			$mol_assert_equal( drafts[ 3 ].content, 'Первый пункт' )
			$mol_assert_equal( drafts[ 4 ].content, 'Второй пункт' )

			$mol_assert_equal( paste_dirty( drafts ), [] )
			$mol_assert_equal( paste_classy( drafts ), [] )
		},

		'from_html: word keeps bold and list items, drops office tags'() {

			const drafts = $bog_wysiwyg_paste.from_html( paste_fixture_word )

			$mol_assert_equal( paste_types( drafts ), [ 'paragraph', 'list', 'list', 'paragraph' ] )
			$mol_assert_equal( drafts[ 0 ].content, 'Обычный абзац с <b>жирным</b> словом' )
			$mol_assert_equal( drafts[ 1 ].content, 'Пункт один' )
			$mol_assert_equal( drafts[ 2 ].content, 'Пункт два' )
			$mol_assert_equal( drafts[ 3 ].content, 'Служебное' )

			$mol_assert_equal( paste_dirty( drafts ), [] )
			$mol_assert_equal( paste_classy( drafts ), [] )
		},

		'from_html: notion flattens nested list and keeps code language'() {

			const drafts = $bog_wysiwyg_paste.from_html( paste_fixture_notion )

			$mol_assert_equal( paste_types( drafts ), [ 'heading', 'paragraph', 'list', 'list', 'list', 'code', 'image' ] )
			$mol_assert_equal( drafts[ 0 ], { type: 'heading', level: 2, content: 'Как это работает' } )
			$mol_assert_equal( drafts[ 1 ].content, 'Просто <b>берём</b> и <i>делаем</i>, смотри <a href="https://notion.so/doc">доку</a>.' )
			$mol_assert_equal( [ drafts[ 2 ].content, drafts[ 3 ].content, drafts[ 4 ].content ], [ 'раз', 'раз-раз', 'два' ] )
			$mol_assert_equal( drafts[ 5 ].content, '<code class="language-typescript">const a: number = 1\nconsole.log( a &lt; 2 )</code>' )
			$mol_assert_equal( drafts[ 6 ].content, '<img src="https://notion.so/image/pic.png" alt="скрин">' )

			$mol_assert_equal( paste_dirty( drafts ), [] )
			$mol_assert_equal( paste_classy( drafts ), [] )
		},

		'from_html: web page keeps every supported block type'() {

			const drafts = $bog_wysiwyg_paste.from_html( paste_fixture_web )

			$mol_assert_equal( paste_types( drafts ), [
				'heading', 'paragraph', 'quote', 'divider', 'heading',
				'list', 'list', 'code', 'image', 'paragraph', 'paragraph', 'paragraph',
			] )
			$mol_assert_equal( drafts[ 1 ].content, 'Текст с <b>жирным</b>, <i>курсивом</i>, <s>зачёркнутым</s> и <code>inline_code()</code>.' )
			$mol_assert_equal( drafts[ 2 ].content, 'Первая строка цитаты.<br>Вторая строка.' )
			$mol_assert_equal( drafts[ 4 ], { type: 'heading', level: 3, content: 'Мелкий заголовок' } )
			$mol_assert_equal( drafts[ 7 ].content, '<code class="language-js">let x = 1 &amp;&amp; 2</code>' )
			$mol_assert_equal( drafts[ 8 ].content, '<img src="/img/photo.jpg" alt="фото">' )
			$mol_assert_equal( drafts[ 10 ].content, 'Ключ | Значение' )
			$mol_assert_equal( drafts[ 11 ].content, 'a | 1' )

			$mol_assert_equal( paste_dirty( drafts ), [] )
			$mol_assert_equal( paste_classy( drafts ), [] )
		},

		'from_html: unsafe hrefs are unwrapped to plain text'() {
			const drafts = $bog_wysiwyg_paste.from_html( paste_fixture_web )
			$mol_assert_equal( drafts[ 9 ].content, 'не ссылка и <a href="https://ok.example/a?b=1&amp;c=2">ссылка</a>' )
			$mol_assert_equal( drafts[ 9 ].content.includes( 'javascript:' ), false )
		},

		'from_html: script and hidden content never reach a block'() {
			const drafts = $bog_wysiwyg_paste.from_html( paste_fixture_web )
			const all = drafts.map( draft => draft.content ).join( ' ' )
			$mol_assert_equal( all.includes( 'alert' ), false )
			$mol_assert_equal( all.includes( 'скрытое' ), false )
			$mol_assert_equal( all.includes( 'комментарий' ), false )
		},

		'from_html: empty and junk only clipboard gives nothing'() {
			$mol_assert_equal( $bog_wysiwyg_paste.from_html( '' ), [] )
			$mol_assert_equal( $bog_wysiwyg_paste.from_html( '   ' ), [] )
			$mol_assert_equal( $bog_wysiwyg_paste.from_html( '<meta charset="utf-8"><span style="color:red"></span>' ), [] )
			$mol_assert_equal( $bog_wysiwyg_paste.from_html( '<div><span> </span></div>' ), [] )
		},

		'from_html: nbsp becomes an ordinary space'() {
			const drafts = $bog_wysiwyg_paste.from_html( '<p>раз&nbsp;два&nbsp;&nbsp;три</p>' )
			$mol_assert_equal( drafts[ 0 ].content, 'раз два три' )
		},

		'from_html: data uri image is passed through untouched'() {
			const src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='
			const drafts = $bog_wysiwyg_paste.from_html( '<p><img src="' + src + '"></p>' )
			$mol_assert_equal( drafts, [ { type: 'image', content: '<img src="' + src + '">' } ] )
		},

		'from_html: image inside a paragraph splits it into blocks in order'() {
			const drafts = $bog_wysiwyg_paste.from_html( '<p>до<img src="a.png">после</p>' )
			$mol_assert_equal( drafts, [
				{ type: 'paragraph', content: 'до' },
				{ type: 'image', content: '<img src="a.png">' },
				{ type: 'paragraph', content: 'после' },
			] )
		},

		'from_html: text in a styled span keeps the spaces around neighbours'() {
			const html = '<p><span style="color:#111">жирный</span><span> </span><span style="font-weight:700">текст</span></p>'
			$mol_assert_equal( $bog_wysiwyg_paste.from_html( html )[ 0 ].content, 'жирный <b>текст</b>' )
		},

		'from_html: angle brackets in text are escaped'() {
			const drafts = $bog_wysiwyg_paste.from_html( '<p>&lt;b&gt;не жирный&lt;/b&gt; &amp; всё</p>' )
			$mol_assert_equal( drafts[ 0 ].content, '&lt;b&gt;не жирный&lt;/b&gt; &amp; всё' )
		},

		'from_markdown: every block kind is recognised'() {

			const drafts = $bog_wysiwyg_paste.from_markdown( paste_fixture_md )

			$mol_assert_equal( paste_types( drafts ), [
				'heading', 'paragraph', 'heading', 'list', 'list', 'list', 'list', 'list',
				'quote', 'code', 'divider', 'image', 'paragraph', 'paragraph',
			] )
			$mol_assert_equal( drafts[ 0 ], { type: 'heading', level: 1, content: 'Заголовок' } )
			$mol_assert_equal(
				drafts[ 1 ].content,
				'Абзац с <b>жирным</b>, <i>курсивом</i>, <s>зачёркнутым</s>, <code>кодом</code>'
					+ ' и <a href="https://example.com/a?b=1&amp;c=2">ссылкой</a>.',
			)
			$mol_assert_equal( drafts[ 2 ], { type: 'heading', level: 2, content: 'Подзаголовок' } )
			$mol_assert_equal( drafts.slice( 3, 8 ).map( draft => draft.content ), [ 'раз', 'два', 'вложенный', 'один', 'два' ] )
			$mol_assert_equal( drafts[ 8 ].content, 'Цитата первая<br>Цитата вторая' )
			$mol_assert_equal( drafts[ 9 ].content, '<code class="language-ts">const a = 1 &lt; 2</code>' )
			$mol_assert_equal( drafts[ 10 ], { type: 'divider', content: '' } )
			$mol_assert_equal( drafts[ 11 ].content, '<img src="https://example.com/pic.png" alt="картинка">' )
			$mol_assert_equal( [ drafts[ 12 ].content, drafts[ 13 ].content ], [ 'Ключ | Значение', 'a | 1' ] )

			$mol_assert_equal( paste_dirty( drafts ), [] )
			$mol_assert_equal( paste_classy( drafts ), [] )
		},

		'from_markdown: heading deeper than three is clamped'() {
			const drafts = $bog_wysiwyg_paste.from_markdown( '#### Четвёртый\n\n###### Шестой' )
			$mol_assert_equal( drafts.map( draft => draft.level ), [ 3, 3 ] )
		},

		'from_markdown: fence without language stays plain code'() {
			const drafts = $bog_wysiwyg_paste.from_markdown( '```\nplain & <code>\n```' )
			$mol_assert_equal( drafts, [ { type: 'code', content: 'plain &amp; &lt;code&gt;' } ] )
		},

		'from_markdown: tilde fence works too'() {
			const drafts = $bog_wysiwyg_paste.from_markdown( '~~~python\nx = 1\n~~~' )
			$mol_assert_equal( drafts, [ { type: 'code', content: '<code class="language-python">x = 1</code>' } ] )
		},

		'from_markdown: raw html in the source is escaped, not executed'() {
			const drafts = $bog_wysiwyg_paste.from_markdown( 'опасно <script>alert(1)</script> тут' )
			$mol_assert_equal( drafts[ 0 ].content, 'опасно &lt;script&gt;alert(1)&lt;/script&gt; тут' )
		},

		'from_markdown: unsafe link becomes plain label'() {
			const drafts = $bog_wysiwyg_paste.from_markdown( '[клик](javascript:alert(1))' )
			$mol_assert_equal( drafts, [ { type: 'paragraph', content: 'клик' } ] )
		},

		'from_markdown: soft line breaks inside a paragraph become br'() {
			const drafts = $bog_wysiwyg_paste.from_markdown( 'первая\nвторая\n\nтретья' )
			$mol_assert_equal( drafts, [
				{ type: 'paragraph', content: 'первая<br>вторая' },
				{ type: 'paragraph', content: 'третья' },
			] )
		},

		'from_markdown: dashes are a divider, not a list'() {
			$mol_assert_equal( $bog_wysiwyg_paste.from_markdown( '---' ), [ { type: 'divider', content: '' } ] )
			$mol_assert_equal( $bog_wysiwyg_paste.from_markdown( '***' ), [ { type: 'divider', content: '' } ] )
			$mol_assert_equal( $bog_wysiwyg_paste.from_markdown( '- пункт' ), [ { type: 'list', content: 'пункт' } ] )
		},

		'from_markdown: emphasis inside a word is left alone'() {
			const drafts = $bog_wysiwyg_paste.from_markdown( 'snake_case_name и 2*3*4' )
			$mol_assert_equal( drafts[ 0 ].content, 'snake_case_name и 2*3*4' )
		},

		'from_markdown: parens inside a link url survive'() {
			const drafts = $bog_wysiwyg_paste.from_markdown( 'см. [вики](https://ru.wikipedia.org/wiki/Мол_(язык))' )
			$mol_assert_equal( drafts[ 0 ].content, 'см. <a href="https://ru.wikipedia.org/wiki/Мол_(язык)">вики</a>' )
		},

		'from_markdown: image with a title keeps only the source'() {
			const drafts = $bog_wysiwyg_paste.from_markdown( '![схема](https://x.dev/a.png "подпись")' )
			$mol_assert_equal( drafts, [ { type: 'image', content: '<img src="https://x.dev/a.png" alt="схема">' } ] )
		},

		'from_html: underline survives when it is not a link decoration'() {
			const drafts = $bog_wysiwyg_paste.from_html( '<p>вот <u>это</u> и <span style="text-decoration:underline">то</span></p>' )
			$mol_assert_equal( drafts[ 0 ].content, 'вот <u>это</u> и <u>то</u>' )
		},

		'from_markdown: nothing from empty source'() {
			$mol_assert_equal( $bog_wysiwyg_paste.from_markdown( '' ), [] )
			$mol_assert_equal( $bog_wysiwyg_paste.from_markdown( '\n\n   \n' ), [] )
		},

		'from_text: blank lines split paragraphs, single breaks stay'() {
			const drafts = $bog_wysiwyg_paste.from_text( 'один\nдва\n\nтри & <четыре>' )
			$mol_assert_equal( drafts, [
				{ type: 'paragraph', content: 'один<br>два' },
				{ type: 'paragraph', content: 'три &amp; &lt;четыре&gt;' },
			] )
		},

		'from_data: routes to the parser matching the clipboard'() {

			const from_html = $bog_wysiwyg_paste.from_data( paste_clipboard( '<h2>Тема</h2>', 'Тема' ) )
			$mol_assert_equal( from_html, [ { type: 'heading', level: 2, content: 'Тема' } ] )

			const from_md = $bog_wysiwyg_paste.from_data( paste_clipboard( '', '## Тема' ) )
			$mol_assert_equal( from_md, [ { type: 'heading', level: 2, content: 'Тема' } ] )

			const from_text = $bog_wysiwyg_paste.from_data( paste_clipboard( '', 'просто тема' ) )
			$mol_assert_equal( from_text, [ { type: 'paragraph', content: 'просто тема' } ] )
		},

	} )

}
