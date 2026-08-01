namespace $ {

	const base = 'https://baza.test/'

	const md = (
		blocks: readonly $bog_wysiwyg_export_block[],
		config?: $bog_wysiwyg_export_config,
	) => $bog_wysiwyg_export_markdown( blocks, config )

	$mol_test( {

		// === Block types ===

		'paragraph keeps inline formatting'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: 'Hello <b>bold</b> and <i>italic</i>' } ] ),
				'Hello **bold** and *italic*',
			)
		},

		'paragraph turns br into a hard line break'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: 'one<br>two' } ] ),
				'one  \ntwo',
			)
		},

		'paragraph turns div soup into lines'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: '<div>one</div><div>two</div>' } ] ),
				'one  \ntwo',
			)
		},

		'heading levels 1 to 3'() {
			$mol_assert_equal( md( [ { type: 'heading', level: 1, content: 'One' } ] ), '# One' )
			$mol_assert_equal( md( [ { type: 'heading', level: 2, content: 'Two' } ] ), '## Two' )
			$mol_assert_equal( md( [ { type: 'heading', level: 3, content: 'Three' } ] ), '### Three' )
		},

		'heading without a level falls back to the first one'() {
			$mol_assert_equal( md( [ { type: 'heading', content: 'One' } ] ), '# One' )
		},

		'code block is fenced and unescaped'() {
			$mol_assert_equal(
				md( [ { type: 'code', content: 'if( a &lt; b ) {\n\treturn 1\n}' } ] ),
				'```\nif( a < b ) {\n\treturn 1\n}\n```',
			)
		},

		'code block with its own fence gets a longer one'() {
			$mol_assert_equal(
				md( [ { type: 'code', content: '```\nnested\n```' } ] ),
				'````\n```\nnested\n```\n````',
			)
		},

		'quote prefixes every line'() {
			$mol_assert_equal(
				md( [ { type: 'quote', content: 'Wise<br>words' } ] ),
				'> Wise  \n> words',
			)
		},

		'neighbour list blocks make one list'() {
			$mol_assert_equal(
				md( [
					{ type: 'list', content: 'one' },
					{ type: 'list', content: 'two' },
					{ type: 'paragraph', content: 'tail' },
				] ),
				'- one\n- two\n\ntail',
			)
		},

		'list block with its own markup keeps nesting'() {
			$mol_assert_equal(
				md( [ { type: 'list', content: '<ul><li>a</li><li>b<ul><li>c</li></ul></li></ul>' } ] ),
				'- a\n- b\n  - c',
			)
		},

		'ordered list is numbered'() {
			$mol_assert_equal(
				md( [ { type: 'list', content: '<ol><li>a</li><li>b</li></ol>' } ] ),
				'1. a\n2. b',
			)
		},

		'divider'() {
			$mol_assert_equal( md( [ { type: 'divider', content: '' } ] ), '---' )
		},

		'unknown block type is rendered as a paragraph'() {
			$mol_assert_equal(
				md( [ { type: 'callout', content: 'Beware of <b>dogs</b>' } ] ),
				'Beware of **dogs**',
			)
		},

		'empty blocks are dropped'() {
			$mol_assert_equal(
				md( [
					{ type: 'paragraph', content: '' },
					{ type: 'paragraph', content: '<br>' },
					{ type: 'paragraph', content: 'alone' },
					{ type: 'heading', level: 1, content: '   ' },
				] ),
				'alone',
			)
		},

		'no blocks means no markdown'() {
			$mol_assert_equal( md( [] ), '' )
		},

		// === Inline ===

		'link'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: 'see <a href="https://mol.hyoo.ru/">mol</a>' } ] ),
				'see [mol](https://mol.hyoo.ru/)',
			)
		},

		'link with parens in the address is percent encoded'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: '<a href="https://x.dev/a(b)">l</a>' } ] ),
				'[l](https://x.dev/a%28b%29)',
			)
		},

		'wiki link stays an anchor'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: '<a data-wiki-link="page_1" href="#page_1">page_1</a>' } ], { base } ),
				'[page\\_1](#page_1)',
			)
		},

		'inline code with a backtick gets a double fence'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: '<code>a`b</code>' } ] ),
				'``a`b``',
			)
		},

		'strike'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: '<s>gone</s> <del>too</del>' } ] ),
				'~~gone~~ ~~too~~',
			)
		},

		'html entities are decoded'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: 'a &amp; b &nbsp; &mdash; &#65;&#x42;' } ] ),
				'a & b — AB',
			)
		},

		'unbalanced markup still closes'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: 'a <b>bold' } ] ),
				'a **bold**',
			)
		},

		// === Escaping ===

		'markdown punctuation in plain text is escaped'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: 'a * b _ c [d] ~e~ \\f' } ] ),
				'a \\* b \\_ c \\[d\\] \\~e\\~ \\\\f',
			)
		},

		'line openers are escaped only at the line start'() {
			$mol_assert_equal( md( [ { type: 'paragraph', content: '# not a heading' } ] ), '\\# not a heading' )
			$mol_assert_equal( md( [ { type: 'paragraph', content: '> not a quote' } ] ), '\\> not a quote' )
			$mol_assert_equal( md( [ { type: 'paragraph', content: '- not a list' } ] ), '\\- not a list' )
			$mol_assert_equal( md( [ { type: 'paragraph', content: '1. not a list' } ] ), '1\\. not a list' )
			$mol_assert_equal( md( [ { type: 'paragraph', content: 'and 1. not a list' } ] ), 'and 1. not a list' )
		},

		'telegram never escapes, because clients show the backslashes'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: 'a * b _ c [d] # e' } ], { dialect: 'telegram' } ),
				'a * b _ c [d] # e',
			)
		},

		// === Habr ===

		'habr shifts headings down, the article title already owns h1'() {
			$mol_assert_equal( md( [ { type: 'heading', level: 1, content: 'One' } ], { dialect: 'habr' } ), '## One' )
			$mol_assert_equal( md( [ { type: 'heading', level: 3, content: 'Three' } ], { dialect: 'habr' } ), '#### Three' )
		},

		'habr drops underline, there is no markdown for it'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: 'a <u>b</u> c' } ], { dialect: 'habr' } ),
				'a b c',
			)
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: 'a <u>b</u> c' } ] ),
				'a <u>b</u> c',
			)
		},

		'habr renders a table as a nested list'() {
			$mol_assert_equal(
				md( [ {
					type: 'table',
					content: '<table><tr><th>Name</th><th>Age</th></tr><tr><td>Ann</td><td>3</td></tr><tr><td>Bob</td><td>4</td></tr></table>',
				} ], { dialect: 'habr' } ),
				'- **Ann**\n  - Age: 3\n- **Bob**\n  - Age: 4',
			)
		},

		'habr flattens a headless table into one bullet per row'() {
			$mol_assert_equal(
				md( [ {
					type: 'table',
					content: '<table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>',
				} ], { dialect: 'habr' } ),
				'- a — b\n- c — d',
			)
		},

		'a table pasted as markdown text is reformatted too'() {
			$mol_assert_equal(
				md( [ { type: 'table', content: '| a | b |<br>| --- | --- |<br>| 1 | 2 |' } ], { dialect: 'habr' } ),
				'- **1**\n  - b: 2',
			)
		},

		// === Common and dev.to tables ===

		'gfm table for dialects that render tables'() {
			const table = {
				type: 'table',
				content: '<table><tr><th>Name</th><th>Age</th></tr><tr><td>Ann</td><td>3</td></tr></table>',
			}
			$mol_assert_equal(
				md( [ table ] ),
				'| Name | Age |\n| --- | --- |\n| Ann | 3 |',
			)
			$mol_assert_equal(
				md( [ table ], { dialect: 'devto' } ).split( '---\n\n' )[ 1 ],
				'| Name | Age |\n| --- | --- |\n| Ann | 3 |',
			)
		},

		'pipes inside cells are escaped'() {
			$mol_assert_equal(
				md( [ { type: 'table', content: '<table><tr><td>a|b</td><td>c</td></tr></table>' } ] ),
				'| a\\|b | c |\n| --- | --- |',
			)
		},

		// === dev.to ===

		'devto prepends a front matter'() {
			$mol_assert_equal(
				md( [ { type: 'paragraph', content: 'Body' } ], {
					dialect: 'devto',
					title: 'My post',
					tags: [ 'mol', 'javascript' ],
					published: true,
				} ),
				'---\ntitle: "My post"\npublished: true\ntags: mol, javascript\n---\n\nBody',
			)
		},

		'devto tags are sanitized down to four'() {
			$mol_assert_equal(
				md( [], { dialect: 'devto', tags: [ 'Java Script', '#ts', '', 'a', 'b', 'c' ] } ),
				'---\ntitle: ""\npublished: false\ntags: javascript, ts, a, b\n---',
			)
		},

		'devto quotes the title and absolutizes the cover'() {
			$mol_assert_equal(
				md( [], {
					dialect: 'devto',
					title: 'A "quoted": title',
					cover: '?BAZA:file=cov;name=c.png',
					base,
				} ),
				'---\ntitle: "A \\"quoted\\": title"\npublished: false\ntags: \ncover_image: "https://baza.test/?BAZA:file=cov;name=c.png"\n---',
			)
		},

		// === Telegram ===

		'telegram turns headings into bold lines'() {
			$mol_assert_equal(
				md( [ { type: 'heading', level: 2, content: 'Sub' } ], { dialect: 'telegram' } ),
				'**Sub**',
			)
		},

		'telegram uses its own italic, bullet and divider'() {
			$mol_assert_equal(
				md( [
					{ type: 'paragraph', content: '<i>slanted</i>' },
					{ type: 'list', content: 'item' },
					{ type: 'divider', content: '' },
				], { dialect: 'telegram' } ),
				'__slanted__\n\n• item\n\n————————',
			)
		},

		'telegram cannot embed images, so a bare address is left'() {
			$mol_assert_equal(
				md( [ { type: 'image', content: '<img src="?BAZA:file=abc;name=pic.png" alt="Pic">' } ], {
					dialect: 'telegram',
					base,
				} ),
				'https://baza.test/?BAZA:file=abc;name=pic.png',
			)
		},

		'telegram has a message limit'() {
			$mol_assert_equal( $bog_wysiwyg_export_limit( 'telegram' ), 4096 )
			$mol_assert_equal( $bog_wysiwyg_export_limit( 'common' ), Infinity )
			$mol_assert_equal( $bog_wysiwyg_export_limit( 'habr' ), Infinity )
			$mol_assert_equal( $bog_wysiwyg_export_limit( 'devto' ), Infinity )
		},

		// === Splitting ===

		'short text is a single message'() {
			$mol_assert_equal( $bog_wysiwyg_export_split( 'hello', 4096 ).length, 1 )
			$mol_assert_equal( $bog_wysiwyg_export_split( '', 4096 ).length, 0 )
		},

		'split prefers block boundaries'() {
			const parts = $bog_wysiwyg_export_split( 'aaaa\n\nbbbb\n\ncccc', 10 )
			$mol_assert_equal( parts.length, 2 )
			$mol_assert_equal( parts[ 0 ], 'aaaa\n\nbbbb' )
			$mol_assert_equal( parts[ 1 ], 'cccc' )
		},

		'split falls back to lines and then to hard cuts'() {
			$mol_assert_equal( $bog_wysiwyg_export_split( 'aa\nbb\ncc', 5 ), [ 'aa\nbb', 'cc' ] )
			$mol_assert_equal( $bog_wysiwyg_export_split( 'abcdefgh', 3 ), [ 'abc', 'def', 'gh' ] )
		},

		'every telegram message fits the limit'() {
			const blocks = Array.from( { length: 60 }, ( _, i ) => ( {
				type: 'paragraph',
				content: 'Paragraph number ' + i + ' ' + 'x'.repeat( 100 ),
			} ) )
			const text = md( blocks, { dialect: 'telegram' } )
			const parts = $bog_wysiwyg_export_split( text, $bog_wysiwyg_export_limit( 'telegram' ) )
			$mol_assert_ok( parts.length > 1 )
			for( const part of parts ) $mol_assert_ok( part.length <= 4096 )
		},

		// === Images ===

		'baza file address is resolved against the master node'() {
			$mol_assert_equal(
				md( [ { type: 'image', content: '<img src="?BAZA:file=abc;name=pic.png" alt="Pic">' } ], { base } ),
				'![Pic](https://baza.test/?BAZA:file=abc;name=pic.png)',
			)
		},

		'image without an alt'() {
			$mol_assert_equal(
				md( [ { type: 'image', content: '<img src="https://x.dev/p.png">' } ] ),
				'![](https://x.dev/p.png)',
			)
		},

		'absolute and data addresses are left alone'() {
			$mol_assert_equal( $bog_wysiwyg_export_uri( 'https://a/b.png', base ), 'https://a/b.png' )
			$mol_assert_equal( $bog_wysiwyg_export_uri( 'data:image/png;base64,AAA', base ), 'data:image/png;base64,AAA' )
			$mol_assert_equal( $bog_wysiwyg_export_uri( '//a/b.png', base ), '//a/b.png' )
			$mol_assert_equal( $bog_wysiwyg_export_uri( '#anchor', base ), '#anchor' )
			$mol_assert_equal( $bog_wysiwyg_export_uri( '/x.png', base ), 'https://baza.test/x.png' )
			$mol_assert_equal( $bog_wysiwyg_export_uri( '?BAZA:file=x;name=y', base ), 'https://baza.test/?BAZA:file=x;name=y' )
			$mol_assert_equal( $bog_wysiwyg_export_uri( '?BAZA:file=x', 'https://baza.test' ), 'https://baza.test/?BAZA:file=x' )
			$mol_assert_equal( $bog_wysiwyg_export_uri( '?BAZA:file=x', '' ), '?BAZA:file=x' )
			$mol_assert_equal( $bog_wysiwyg_export_uri( '', base ), '' )
		},

		'images apart are numbered in place and listed at the end'() {
			$mol_assert_equal(
				md( [
					{ type: 'paragraph', content: 'before <img src="https://x.dev/a.png" alt="A"> after' },
					{ type: 'image', content: '<img src="?BAZA:file=b;name=b.png">' },
				], {
					base,
					images_apart: true,
					labels: { image: 'Picture', images: 'Pictures' },
				} ),
				'before [Picture 1] after\n\n[Picture 2]'
				+ '\n\n## Pictures\n\n1. A — https://x.dev/a.png\n2. https://baza.test/?BAZA:file=b;name=b.png',
			)
		},

		'telegram lists images under a bold title'() {
			$mol_assert_equal(
				md( [ { type: 'image', content: '<img src="https://x.dev/a.png">' } ], {
					dialect: 'telegram',
					images_apart: true,
					labels: { image: 'Pic', images: 'Pics' },
				} ),
				'[Pic 1]\n\n**Pics**\n\n1. https://x.dev/a.png',
			)
		},

		// === Plain text helper ===

		'plain strips tags and decodes entities'() {
			$mol_assert_equal(
				$bog_wysiwyg_export_plain( '<p>a<br>b &lt;c&gt;</p>' ),
				'a\nb <c>',
			)
		},

	} )

}
