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
			const walker = doc.createTreeWalker( div, NodeFilter.SHOW_TEXT )
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

	})

}
