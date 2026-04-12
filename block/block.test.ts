namespace $.$$ {

	/** Helper: create a contenteditable div with text, place cursor at end, run try_markdown */
	function apply_markdown( input: string ) {
		const doc = $mol_dom_context.document
		const div = doc.createElement( 'div' )
		div.contentEditable = 'true'
		doc.body.appendChild( div )

		try {
			div.textContent = input

			const text_node = div.firstChild as Text
			const sel = doc.defaultView!.getSelection()!
			const range = doc.createRange()
			range.setStart( text_node, input.length )
			range.collapse( true )
			sel.removeAllRanges()
			sel.addRange( range )

			const block = new $bog_wysiwyg_block()
			block.try_markdown( div )

			return div.innerHTML
		} finally {
			doc.body.removeChild( div )
		}
	}

	function make_block_with_selection( html: string, select_text?: string ) {
		const doc = $mol_dom_context.document
		const div = doc.createElement( 'div' )
		div.contentEditable = 'true'
		div.innerHTML = html
		doc.body.appendChild( div )
		div.focus()

		if( select_text ) {
			const walker = doc.createTreeWalker( div, 4 /* NodeFilter.SHOW_TEXT */ )
			let node: Text | null
			while( node = walker.nextNode() as Text | null ) {
				const idx = ( node.textContent ?? '' ).indexOf( select_text )
				if( idx >= 0 ) {
					const range = doc.createRange()
					range.setStart( node, idx )
					range.setEnd( node, idx + select_text.length )
					const sel = doc.defaultView!.getSelection()!
					sel.removeAllRanges()
					sel.addRange( range )
					break
				}
			}
		}

		return div
	}

	$mol_test({

		'bold markdown converts to HTML'() {
			$mol_assert_equal(
				apply_markdown( 'hello **world** end' ),
				'hello <b>world</b> end',
			)
		},

		'italic markdown converts to HTML'() {
			$mol_assert_equal(
				apply_markdown( 'hello *world* end' ),
				'hello <i>world</i> end',
			)
		},

		'inline code markdown converts to HTML'() {
			$mol_assert_equal(
				apply_markdown( 'hello `code` end' ),
				'hello <code>code</code> end',
			)
		},

		'strikethrough markdown converts to HTML'() {
			$mol_assert_equal(
				apply_markdown( 'hello ~~strike~~ end' ),
				'hello <s>strike</s> end',
			)
		},

		'link markdown converts to HTML'() {
			const result = apply_markdown( 'click [here](https://example.com) now' )
			$mol_assert_equal(
				result,
				'click <a href="https://example.com">here</a> now',
			)
		},

		'wiki link [[page_id]] converts to anchor'() {
			const result = apply_markdown( 'see [[my_page]] for info' )
			$mol_assert_ok( result.includes( '<a ' ) )
			$mol_assert_ok( result.includes( 'data-wiki-link="my_page"' ) )
			$mol_assert_ok( result.includes( 'href="#my_page"' ) )
			$mol_assert_ok( result.includes( '>my_page</a>' ) )
		},

		'wiki link with empty content does not convert'() {
			$mol_assert_equal(
				apply_markdown( 'hello [[]] end' ),
				'hello [[]] end',
			)
		},

		'partially typed wiki link does not convert'() {
			$mol_assert_equal(
				apply_markdown( '[[not closed' ),
				'[[not closed',
			)
		},

		'empty bold content does not convert'() {
			$mol_assert_equal(
				apply_markdown( 'hello **** end' ),
				'hello **** end',
			)
		},

		'single star inside double stars does not break bold'() {
			const result = apply_markdown( '**bold text** end' )
			$mol_assert_equal( result, '<b>bold text</b> end' )
		},

		'multiple patterns in one block: only first converts per pass'() {
			// First pass converts the first match
			const first = apply_markdown( '**bold** and *italic*' )
			$mol_assert_equal( first, '<b>bold</b> and *italic*' )
		},

		'partially typed bold does not convert'() {
			$mol_assert_equal(
				apply_markdown( '**not closed' ),
				'**not closed',
			)
		},

		'partially typed italic does not convert'() {
			$mol_assert_equal(
				apply_markdown( '*not closed' ),
				'*not closed',
			)
		},

		'partially typed strikethrough does not convert'() {
			$mol_assert_equal(
				apply_markdown( '~~not closed' ),
				'~~not closed',
			)
		},

		'partially typed link does not convert'() {
			$mol_assert_equal(
				apply_markdown( '[text](no-close' ),
				'[text](no-close',
			)
		},

		'link with empty url does not convert'() {
			$mol_assert_equal(
				apply_markdown( '[text]() end' ),
				'[text]() end',
			)
		},

		'link with empty text does not convert'() {
			$mol_assert_equal(
				apply_markdown( '[](https://example.com) end' ),
				'[](https://example.com) end',
			)
		},

		'bold at start of text'() {
			$mol_assert_equal(
				apply_markdown( '**start** rest' ),
				'<b>start</b> rest',
			)
		},

		'bold at end of text'() {
			$mol_assert_equal(
				apply_markdown( 'rest **end**' ),
				'rest <b>end</b>',
			)
		},

		'code with special characters inside'() {
			$mol_assert_equal(
				apply_markdown( 'run `npm install` now' ),
				'run <code>npm install</code> now',
			)
		},

		'strike_exec without event returns null'() {
			const block = new $bog_wysiwyg_block()
			$mol_assert_equal( block.strike_exec(), null )
		},

		'strike_exec wraps selection in strikethrough'() {
			if( typeof document === 'undefined' ) return
			const div = make_block_with_selection( 'hello world end', 'world' )
			try {
				const block = new $bog_wysiwyg_block()
				block.dom_node = ()=> div as any
				block.html = ( val?: string )=> val ?? div.innerHTML

				const event = new KeyboardEvent( 'keydown', { key: 's', ctrlKey: true, shiftKey: true } )
				const result = block.strike_exec( event )

				$mol_assert_ok( result )
				$mol_assert_ok( div.innerHTML.includes( '<strike>' ) || div.innerHTML.includes( '<s>' ) )
				$mol_assert_ok( div.innerHTML.includes( 'world' ) )
			} finally {
				div.remove()
			}
		},

		'link_exec without event returns null'() {
			const block = new $bog_wysiwyg_block()
			$mol_assert_equal( block.link_exec(), null )
		},

		'link_exec with cancelled prompt does nothing'() {
			if( typeof document === 'undefined' ) return
			const div = make_block_with_selection( 'hello world end', 'world' )
			try {
				const original_prompt = globalThis.prompt
				globalThis.prompt = ()=> null

				const block = new $bog_wysiwyg_block()
				block.dom_node = ()=> div as any
				block.html = ( val?: string )=> val ?? div.innerHTML

				const event = new KeyboardEvent( 'keydown', { key: 'k', ctrlKey: true } )
				const result = block.link_exec( event )

				$mol_assert_ok( result )
				$mol_assert_equal( div.innerHTML, 'hello world end' )

				globalThis.prompt = original_prompt
			} finally {
				div.remove()
			}
		},

		'link_exec creates link from selected text'() {
			if( typeof document === 'undefined' ) return
			const div = make_block_with_selection( 'click here now', 'here' )
			try {
				const original_prompt = globalThis.prompt
				globalThis.prompt = ()=> 'https://example.com'

				const block = new $bog_wysiwyg_block()
				block.dom_node = ()=> div as any
				block.html = ( val?: string )=> val ?? div.innerHTML

				const event = new KeyboardEvent( 'keydown', { key: 'k', ctrlKey: true } )
				block.link_exec( event )

				$mol_assert_ok( div.innerHTML.includes( '<a ' ) )
				$mol_assert_ok( div.innerHTML.includes( 'https://example.com' ) )
				$mol_assert_ok( div.innerHTML.includes( 'here' ) )

				globalThis.prompt = original_prompt
			} finally {
				div.remove()
			}
		},

		'link_exec inserts url as text when no selection'() {
			if( typeof document === 'undefined' ) return
			const div = make_block_with_selection( 'hello world' )
			try {
				div.focus()
				// Place cursor at end without selecting
				const sel = $mol_dom_context.document.defaultView!.getSelection()!
				const range = $mol_dom_context.document.createRange()
				range.selectNodeContents( div )
				range.collapse( false )
				sel.removeAllRanges()
				sel.addRange( range )

				const original_prompt = globalThis.prompt
				globalThis.prompt = ()=> 'https://example.com'

				const block = new $bog_wysiwyg_block()
				block.dom_node = ()=> div as any
				block.html = ( val?: string )=> val ?? div.innerHTML

				const event = new KeyboardEvent( 'keydown', { key: 'k', ctrlKey: true } )
				block.link_exec( event )

				$mol_assert_ok( div.innerHTML.includes( '<a ' ) )
				$mol_assert_ok( div.innerHTML.includes( 'https://example.com' ) )

				globalThis.prompt = original_prompt
			} finally {
				div.remove()
			}
		},

		// === Image block ===

		'paste_event without event returns null'() {
			const block = new $bog_wysiwyg_block()
			$mol_assert_equal( block.paste_event(), null )
		},

		'paste_event with image prevents default'() {
			if( typeof document === 'undefined' ) return
			let prevented = false
			const block = new $bog_wysiwyg_block()

			let image_src = ''
			block.on_image = ( src?: string ) => {
				if( src ) image_src = src
				return image_src || null
			}

			const blob = new Blob( [ '' ], { type: 'image/png' } )
			const file = new File( [ blob ], 'test.png', { type: 'image/png' } )

			const dt = new DataTransfer()
			dt.items.add( file )

			const event = new ClipboardEvent( 'paste', { clipboardData: dt } )
			Object.defineProperty( event, 'preventDefault', { value: () => { prevented = true } } )

			const result = block.paste_event( event )

			$mol_assert_ok( result )
			$mol_assert_ok( prevented )
		},

		'paste_event without image does not prevent default'() {
			if( typeof document === 'undefined' ) return
			const block = new $bog_wysiwyg_block()

			const dt = new DataTransfer()
			dt.items.add( 'hello', 'text/plain' )

			const event = new ClipboardEvent( 'paste', { clipboardData: dt } )
			let prevented = false
			Object.defineProperty( event, 'preventDefault', { value: () => { prevented = true } } )

			const result = block.paste_event( event )

			$mol_assert_ok( result )
			$mol_assert_equal( prevented, false )
		},

		'drop_event without event returns null'() {
			const block = new $bog_wysiwyg_block()
			$mol_assert_equal( block.drop_event(), null )
		},

		'is_image returns true for image type'() {
			const block = new $bog_wysiwyg_block()
			block.type = () => 'image'
			$mol_assert_equal( block.is_image(), true )
		},

		'is_image returns false for paragraph type'() {
			const block = new $bog_wysiwyg_block()
			block.type = () => 'paragraph'
			$mol_assert_equal( block.is_image(), false )
		},

		// === parse_markdown ===

		'parse_markdown: single paragraph'() {
			const blocks = $bog_wysiwyg_parse_markdown( 'hello world' )
			$mol_assert_equal( blocks.length, 1 )
			$mol_assert_equal( blocks[ 0 ].type, 'paragraph' )
			$mol_assert_equal( blocks[ 0 ].content, 'hello world' )
		},

		'parse_markdown: two paragraphs separated by empty line'() {
			const blocks = $bog_wysiwyg_parse_markdown( 'first\n\nsecond' )
			$mol_assert_equal( blocks.length, 2 )
			$mol_assert_equal( blocks[ 0 ].content, 'first' )
			$mol_assert_equal( blocks[ 1 ].content, 'second' )
		},

		'parse_markdown: heading levels 1-3'() {
			const blocks = $bog_wysiwyg_parse_markdown( '# H1\n\n## H2\n\n### H3' )
			$mol_assert_equal( blocks.length, 3 )
			$mol_assert_equal( blocks[ 0 ].type, 'heading' )
			$mol_assert_equal( blocks[ 0 ].level, 1 )
			$mol_assert_equal( blocks[ 0 ].content, 'H1' )
			$mol_assert_equal( blocks[ 1 ].level, 2 )
			$mol_assert_equal( blocks[ 2 ].level, 3 )
		},

		'parse_markdown: code block'() {
			const blocks = $bog_wysiwyg_parse_markdown( '```\nconst x = 1\nconst y = 2\n```' )
			$mol_assert_equal( blocks.length, 1 )
			$mol_assert_equal( blocks[ 0 ].type, 'code' )
			$mol_assert_equal( blocks[ 0 ].content, 'const x = 1\nconst y = 2' )
		},

		'parse_markdown: code block escapes HTML'() {
			const blocks = $bog_wysiwyg_parse_markdown( '```\n<div>&</div>\n```' )
			$mol_assert_equal( blocks[ 0 ].content, '&lt;div&gt;&amp;&lt;/div&gt;' )
		},

		'parse_markdown: blockquote'() {
			const blocks = $bog_wysiwyg_parse_markdown( '> line one\n> line two' )
			$mol_assert_equal( blocks.length, 1 )
			$mol_assert_equal( blocks[ 0 ].type, 'quote' )
			$mol_assert_equal( blocks[ 0 ].content, 'line one<br>line two' )
		},

		'parse_markdown: divider ---'() {
			const blocks = $bog_wysiwyg_parse_markdown( 'above\n\n---\n\nbelow' )
			$mol_assert_equal( blocks.length, 3 )
			$mol_assert_equal( blocks[ 1 ].type, 'divider' )
			$mol_assert_equal( blocks[ 1 ].content, '' )
		},

		'parse_markdown: divider ***'() {
			const blocks = $bog_wysiwyg_parse_markdown( '***' )
			$mol_assert_equal( blocks[ 0 ].type, 'divider' )
		},

		'parse_markdown: inline bold'() {
			const blocks = $bog_wysiwyg_parse_markdown( 'hello **world**' )
			$mol_assert_equal( blocks[ 0 ].content, 'hello <b>world</b>' )
		},

		'parse_markdown: inline italic'() {
			const blocks = $bog_wysiwyg_parse_markdown( 'hello *world*' )
			$mol_assert_equal( blocks[ 0 ].content, 'hello <i>world</i>' )
		},

		'parse_markdown: inline code'() {
			const blocks = $bog_wysiwyg_parse_markdown( 'run `npm install`' )
			$mol_assert_equal( blocks[ 0 ].content, 'run <code>npm install</code>' )
		},

		'parse_markdown: inline strike'() {
			const blocks = $bog_wysiwyg_parse_markdown( 'hello ~~world~~' )
			$mol_assert_equal( blocks[ 0 ].content, 'hello <s>world</s>' )
		},

		'parse_markdown: inline link'() {
			const blocks = $bog_wysiwyg_parse_markdown( 'click [here](https://example.com)' )
			$mol_assert_equal( blocks[ 0 ].content, 'click <a href="https://example.com">here</a>' )
		},

		'parse_markdown: multi-line paragraph joins with br'() {
			const blocks = $bog_wysiwyg_parse_markdown( 'line one\nline two\nline three' )
			$mol_assert_equal( blocks.length, 1 )
			$mol_assert_equal( blocks[ 0 ].content, 'line one<br>line two<br>line three' )
		},

		'parse_markdown: mixed content article'() {
			const md = '# Title\n\nSome text **bold**.\n\n```\ncode here\n```\n\n> quote\n\n---\n\nEnd.'
			const blocks = $bog_wysiwyg_parse_markdown( md )
			$mol_assert_equal( blocks.length, 6 )
			$mol_assert_equal( blocks[ 0 ].type, 'heading' )
			$mol_assert_equal( blocks[ 1 ].type, 'paragraph' )
			$mol_assert_equal( blocks[ 2 ].type, 'code' )
			$mol_assert_equal( blocks[ 3 ].type, 'quote' )
			$mol_assert_equal( blocks[ 4 ].type, 'divider' )
			$mol_assert_equal( blocks[ 5 ].type, 'paragraph' )
		},

		'parse_markdown: empty input returns empty array'() {
			$mol_assert_equal( $bog_wysiwyg_parse_markdown( '' ).length, 0 )
		},

		'parse_markdown: only empty lines returns empty array'() {
			$mol_assert_equal( $bog_wysiwyg_parse_markdown( '\n\n\n' ).length, 0 )
		},

		'parse_markdown: unclosed code block collects to end'() {
			const blocks = $bog_wysiwyg_parse_markdown( '```\ncode without closing' )
			$mol_assert_equal( blocks.length, 1 )
			$mol_assert_equal( blocks[ 0 ].type, 'code' )
			$mol_assert_equal( blocks[ 0 ].content, 'code without closing' )
		},

	})

}
