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

	/** Editable node plus a block view bound to it */
	function make_block( html: string ) {
		const doc = $mol_dom_context.document
		const node = doc.createElement( 'div' )
		node.contentEditable = 'true'
		// jsdom only tracks activeElement for focusable areas
		node.tabIndex = 0
		node.innerHTML = html
		doc.body.appendChild( node )

		const block = new $bog_wysiwyg_block()
		block.dom_node = ()=> node
		block.html = ( next?: string )=> next ?? node.innerHTML

		const calls = [] as { name: string, arg: unknown }[]
		for( const name of [ 'on_enter', 'on_remove', 'on_split', 'on_merge_prev', 'on_merge_next', 'on_nav', 'on_input', 'on_slash', 'on_paste_blocks', 'on_image' ] as const ) {
			block[ name ] = ( arg?: unknown )=> {
				calls.push({ name, arg })
				return arg ?? null
			}
		}

		return { block, node, calls, drop: ()=> node.remove() }
	}

	function set_caret( node: HTMLElement, offset: number ) {
		const doc = $mol_dom_context.document
		const point = $bog_wysiwyg_point_at( node, offset )
		const range = doc.createRange()
		range.setStart( point.node, point.offset )
		range.collapse( true )
		const sel = doc.defaultView!.getSelection()!
		sel.removeAllRanges()
		sel.addRange( range )
	}

	function set_range( node: HTMLElement, from: number, to: number ) {
		const doc = $mol_dom_context.document
		const start = $bog_wysiwyg_point_at( node, from )
		const end = $bog_wysiwyg_point_at( node, to )
		const range = doc.createRange()
		range.setStart( start.node, start.offset )
		range.setEnd( end.node, end.offset )
		const sel = doc.defaultView!.getSelection()!
		sel.removeAllRanges()
		sel.addRange( range )
	}

	function key( name: string, mods: KeyboardEventInit = {} ) {
		return new KeyboardEvent( 'keydown', { key: name, cancelable: true, ...mods } )
	}

	/** Bare clipboard: `paste_data` needs nothing but `getData` */
	function clipboard( parts: { html?: string, text?: string } ): $bog_wysiwyg_paste_data {
		return {
			getData: ( type: string )=> ( type === 'text/html' ? parts.html : parts.text ) ?? '',
		}
	}

	$mol_test({

		// === Text offsets ===

		'point_at walks through nested inline tags'() {
			const { node, drop } = make_block( 'ab<b>cd</b>ef' )
			try {
				$mol_assert_equal( $bog_wysiwyg_point_at( node, 0 ).offset, 0 )
				$mol_assert_equal( ( $bog_wysiwyg_point_at( node, 3 ).node as Text ).data, 'cd' )
				$mol_assert_equal( $bog_wysiwyg_point_at( node, 3 ).offset, 1 )
				$mol_assert_equal( ( $bog_wysiwyg_point_at( node, 6 ).node as Text ).data, 'ef' )
				$mol_assert_equal( $bog_wysiwyg_point_at( node, 6 ).offset, 2 )
			} finally { drop() }
		},

		'point_at clamps beyond the end'() {
			const { node, drop } = make_block( 'abc' )
			try {
				$mol_assert_equal( $bog_wysiwyg_point_at( node, 100 ).offset, 3 )
			} finally { drop() }
		},

		'offset_of is inverse of point_at'() {
			const { node, drop } = make_block( 'ab<b>cd</b>ef' )
			try {
				for( let i = 0; i <= 6; i++ ) {
					const point = $bog_wysiwyg_point_at( node, i )
					$mol_assert_equal( $bog_wysiwyg_offset_of( node, point.node, point.offset ), i )
				}
			} finally { drop() }
		},

		'offset_of rejects a node outside the block'() {
			const { node, drop } = make_block( 'abc' )
			const other = $mol_dom_context.document.createElement( 'div' )
			try {
				$mol_assert_equal( $bog_wysiwyg_offset_of( node, other, 0 ), -1 )
			} finally { drop() }
		},

		'html_text strips markup'() {
			$mol_assert_equal(
				$bog_wysiwyg_html_text( $mol_dom_context.document, 'a<b>b</b><i>c</i>' ),
				'abc',
			)
		},

		'escape_html protects angle brackets'() {
			$mol_assert_equal( $bog_wysiwyg_escape_html( '<&>' ), '&lt;&amp;&gt;' )
		},

		// === Caret ===

		'caret_offset counts through inline tags'() {
			const { block, node, drop } = make_block( 'ab<b>cd</b>ef' )
			try {
				set_caret( node, 5 )
				$mol_assert_equal( block.caret_offset(), 5 )
			} finally { drop() }
		},

		'caret_offset is -1 when the caret is in another block'() {
			const one = make_block( 'first' )
			const two = make_block( 'second' )
			try {
				set_caret( two.node, 2 )
				$mol_assert_equal( one.block.caret_offset(), -1 )
			} finally { one.drop(); two.drop() }
		},

		'caret survives an innerHTML rewrite'() {
			const { block, node, drop } = make_block( 'hello world' )
			try {
				set_caret( node, 5 )
				const offset = block.caret_offset()
				// Nodes are recreated, the old Range would be lost
				node.innerHTML = 'hello <b>world</b>'
				block.caret_place( offset )
				$mol_assert_equal( block.caret_offset(), 5 )
			} finally { drop() }
		},

		'auto keeps the caret when the focused block is resynced'() {
			const { block, node, drop } = make_block( 'hello world' )
			try {
				node.focus()
				set_caret( node, 5 )
				block.html = ( next?: string )=> next ?? 'hello <b>world</b>'
				block.auto()
				$mol_assert_equal( node.innerHTML, 'hello <b>world</b>' )
				$mol_assert_equal( block.caret_offset(), 5 )
			} finally { drop() }
		},

		'auto rewrites an unfocused block without touching the selection'() {
			const { block, node, drop } = make_block( 'old' )
			const other = make_block( 'elsewhere' )
			try {
				set_caret( other.node, 3 )
				block.html = ( next?: string )=> next ?? 'new'
				block.auto()
				$mol_assert_equal( node.innerHTML, 'new' )
				$mol_assert_equal( other.block.caret_offset(), 3 )
			} finally { drop(); other.drop() }
		},

		'focus_at clamps the offset to the text length'() {
			const { block, node, drop } = make_block( 'abc' )
			try {
				block.focus_at( 100 )
				$mol_assert_equal( block.caret_offset(), 3 )
			} finally { drop() }
		},

		// === Splitting content ===

		'html_before and html_after keep markup'() {
			const { block, drop } = make_block( 'ab<b>cdef</b>gh' )
			try {
				$mol_assert_equal( block.html_before( 4 ), 'ab<b>cd</b>' )
				$mol_assert_equal( block.html_after( 4 ), '<b>ef</b>gh' )
			} finally { drop() }
		},

		'html_before at zero is empty and html_after at zero is everything'() {
			const { block, drop } = make_block( 'a<i>b</i>' )
			try {
				$mol_assert_equal( block.html_before( 0 ), '' )
				$mol_assert_equal( block.html_after( 0 ), 'a<i>b</i>' )
			} finally { drop() }
		},

		'Enter in the middle asks the page to split the block'() {
			const { block, node, calls, drop } = make_block( 'hello world' )
			try {
				set_caret( node, 5 )
				block.keydown_event( key( 'Enter' ) )
				$mol_assert_equal( calls.length, 1 )
				$mol_assert_equal( calls[ 0 ].name, 'on_split' )
				$mol_assert_equal( calls[ 0 ].arg, { head: 'hello', tail: ' world' } )
			} finally { drop() }
		},

		'Enter at the end appends a fresh block'() {
			const { block, node, calls, drop } = make_block( 'hello' )
			try {
				set_caret( node, 5 )
				block.keydown_event( key( 'Enter' ) )
				$mol_assert_equal( calls.length, 1 )
				$mol_assert_equal( calls[ 0 ].name, 'on_enter' )
			} finally { drop() }
		},

		'Enter at the start pushes the whole text into a new block'() {
			const { block, node, calls, drop } = make_block( 'hello' )
			try {
				set_caret( node, 0 )
				block.keydown_event( key( 'Enter' ) )
				$mol_assert_equal( calls[ 0 ].name, 'on_split' )
				$mol_assert_equal( calls[ 0 ].arg, { head: '', tail: 'hello' } )
			} finally { drop() }
		},

		'Enter on an empty block appends a fresh block'() {
			const { block, node, calls, drop } = make_block( '' )
			try {
				set_caret( node, 0 )
				block.keydown_event( key( 'Enter' ) )
				$mol_assert_equal( calls[ 0 ].name, 'on_enter' )
			} finally { drop() }
		},

		'Enter over a selection inside the block wipes it and splits there'() {
			const { block, node, calls, drop } = make_block( 'hello world' )
			try {
				set_range( node, 5, 8 )
				block.keydown_event( key( 'Enter' ) )
				$mol_assert_equal( calls[ 0 ].name, 'on_split' )
				$mol_assert_equal( calls[ 0 ].arg, { head: 'hello', tail: 'rld' } )
			} finally { drop() }
		},

		'delete_range drops the selected content and keeps the caret'() {
			const { block, node, drop } = make_block( 'hello world' )
			try {
				set_range( node, 5, 8 )
				$mol_assert_equal( block.delete_range(), true )
				$mol_assert_equal( node.textContent, 'hellorld' )
				$mol_assert_equal( block.caret_offset(), 5 )
			} finally { drop() }
		},

		'delete_range refuses a selection reaching outside the block'() {
			const one = make_block( 'first' )
			const two = make_block( 'second' )
			try {
				const doc = $mol_dom_context.document
				const range = doc.createRange()
				range.setStart( one.node.firstChild!, 1 )
				range.setEnd( two.node.firstChild!, 1 )
				const sel = doc.defaultView!.getSelection()!
				sel.removeAllRanges()
				sel.addRange( range )

				$mol_assert_equal( one.block.delete_range(), false )
				$mol_assert_equal( one.node.textContent, 'first' )
			} finally { one.drop(); two.drop() }
		},

		'Shift+Enter is left to the browser'() {
			const { block, node, calls, drop } = make_block( 'hello' )
			try {
				set_caret( node, 2 )
				const event = key( 'Enter', { shiftKey: true } )
				block.keydown_event( event )
				$mol_assert_equal( calls.length, 0 )
				$mol_assert_equal( event.defaultPrevented, false )
			} finally { drop() }
		},

		// === Block boundaries ===

		'Backspace at the start of a filled block asks to merge with the previous'() {
			const { block, node, calls, drop } = make_block( 'hello' )
			try {
				set_caret( node, 0 )
				const event = key( 'Backspace' )
				block.keydown_event( event )
				$mol_assert_equal( calls[ 0 ].name, 'on_merge_prev' )
				$mol_assert_equal( event.defaultPrevented, true )
			} finally { drop() }
		},

		'Backspace in the middle is left to the browser'() {
			const { block, node, calls, drop } = make_block( 'hello' )
			try {
				set_caret( node, 3 )
				const event = key( 'Backspace' )
				block.keydown_event( event )
				$mol_assert_equal( calls.length, 0 )
				$mol_assert_equal( event.defaultPrevented, false )
			} finally { drop() }
		},

		'Backspace on an empty block still removes it'() {
			const { block, node, calls, drop } = make_block( '' )
			try {
				set_caret( node, 0 )
				block.keydown_event( key( 'Backspace' ) )
				$mol_assert_equal( calls[ 0 ].name, 'on_remove' )
			} finally { drop() }
		},

		'Backspace over a selection is left to the browser'() {
			const { block, node, calls, drop } = make_block( 'hello' )
			try {
				set_range( node, 0, 3 )
				block.keydown_event( key( 'Backspace' ) )
				$mol_assert_equal( calls.length, 0 )
			} finally { drop() }
		},

		'Delete at the end asks to pull the next block in'() {
			const { block, node, calls, drop } = make_block( 'hello' )
			try {
				set_caret( node, 5 )
				const event = key( 'Delete' )
				block.keydown_event( event )
				$mol_assert_equal( calls[ 0 ].name, 'on_merge_next' )
				$mol_assert_equal( event.defaultPrevented, true )
			} finally { drop() }
		},

		'Delete in the middle is left to the browser'() {
			const { block, node, calls, drop } = make_block( 'hello' )
			try {
				set_caret( node, 2 )
				const event = key( 'Delete' )
				block.keydown_event( event )
				$mol_assert_equal( calls.length, 0 )
				$mol_assert_equal( event.defaultPrevented, false )
			} finally { drop() }
		},

		// === Vertical navigation ===

		'caret_lines reports both edges without a layout engine'() {
			const { block, node, drop } = make_block( 'hello' )
			try {
				set_caret( node, 2 )
				const lines = block.caret_lines()
				$mol_assert_equal( lines.first, true )
				$mol_assert_equal( lines.last, true )
			} finally { drop() }
		},

		'caret_lines reports both edges for an empty block'() {
			const { block, node, drop } = make_block( '' )
			try {
				set_caret( node, 0 )
				$mol_assert_equal( block.caret_lines(), { first: true, last: true } )
			} finally { drop() }
		},

		'ArrowUp on the first line asks to step up'() {
			const { block, node, calls, drop } = make_block( 'hello' )
			try {
				set_caret( node, 3 )
				const event = key( 'ArrowUp' )
				block.keydown_event( event )
				$mol_assert_equal( calls[ 0 ].name, 'on_nav' )
				$mol_assert_equal( calls[ 0 ].arg, { dir: 'up', x: 0, offset: 3 } )
				$mol_assert_equal( event.defaultPrevented, true )
			} finally { drop() }
		},

		'ArrowDown on the last line asks to step down'() {
			const { block, node, calls, drop } = make_block( 'hello' )
			try {
				set_caret( node, 1 )
				block.keydown_event( key( 'ArrowDown' ) )
				$mol_assert_equal( calls[ 0 ].name, 'on_nav' )
				$mol_assert_equal( calls[ 0 ].arg, { dir: 'down', x: 0, offset: 1 } )
			} finally { drop() }
		},

		'Shift+ArrowUp extends the selection instead of stepping'() {
			const { block, node, calls, drop } = make_block( 'hello' )
			try {
				set_caret( node, 3 )
				block.keydown_event( key( 'ArrowUp', { shiftKey: true } ) )
				$mol_assert_equal( calls.length, 0 )
			} finally { drop() }
		},

		'focus_column falls back to the text offset without a layout engine'() {
			const { block, node, drop } = make_block( 'hello world' )
			try {
				block.focus_column( 0, 4, true )
				$mol_assert_equal( block.caret_offset(), 4 )
			} finally { drop() }
		},

		'focus_column clamps the offset to a shorter block'() {
			const { block, node, drop } = make_block( 'ab' )
			try {
				block.focus_column( 0, 9, false )
				$mol_assert_equal( block.caret_offset(), 2 )
			} finally { drop() }
		},

		// === Clipboard ===

		'a single unbroken line is pasted into the text, not into a block'() {
			const { block, node, calls, drop } = make_block( 'hello world' )
			try {
				set_caret( node, 6 )
				block.paste_data( clipboard( { text: 'dear' } ) )

				const paste = calls[ 0 ]
				$mol_assert_equal( paste.name, 'on_paste_blocks' )
				$mol_assert_equal( paste.arg, {
					drafts: [ { type: 'paragraph', content: 'dear' } ],
					head: 'hello ',
					tail: 'world',
					inline: true,
				} )
			} finally { drop() }
		},

		'spaces around a fragment copied mid sentence survive'() {
			const { block, node, calls, drop } = make_block( 'словоконец' )
			try {
				set_caret( node, 5 )
				block.paste_data( clipboard( { text: ' и ещё ' } ) )

				const arg = calls[ 0 ].arg as { drafts: { content: string }[] }
				$mol_assert_equal( arg.drafts[ 0 ].content, ' и ещё ' )
			} finally { drop() }
		},

		'inline markdown in a single line still goes inline'() {
			const { block, node, calls, drop } = make_block( 'a' )
			try {
				set_caret( node, 1 )
				block.paste_data( clipboard( { text: 'очень **важно**' } ) )

				const arg = calls[ 0 ].arg as { drafts: { content: string }[], inline: boolean }
				$mol_assert_equal( arg.inline, true )
				$mol_assert_equal( arg.drafts[ 0 ].content, 'очень <b>важно</b>' )
			} finally { drop() }
		},

		'several markdown paragraphs become several drafts'() {
			const { block, node, calls, drop } = make_block( '' )
			try {
				set_caret( node, 0 )
				block.paste_data( clipboard( { text: '# Заголовок\n\nАбзац\n\n- пункт' } ) )

				const arg = calls[ 0 ].arg as { drafts: { type: string }[], inline: boolean }
				$mol_assert_equal( arg.inline, false )
				$mol_assert_equal( arg.drafts.map( draft => draft.type ), [ 'heading', 'paragraph', 'list' ] )
			} finally { drop() }
		},

		'rich html wins over plain text'() {
			const { block, node, calls, drop } = make_block( '' )
			try {
				set_caret( node, 0 )
				block.paste_data( clipboard( {
					html: '<h2>Тема</h2><p>Тело</p>',
					text: 'Тема\nТело',
				} ) )

				const arg = calls[ 0 ].arg as { drafts: { type: string, level?: number, content: string }[] }
				$mol_assert_equal( arg.drafts, [
					{ type: 'heading', level: 2, content: 'Тема' },
					{ type: 'paragraph', content: 'Тело' },
				] )
			} finally { drop() }
		},

		'a paste in the middle carries both halves of the block'() {
			const { block, node, calls, drop } = make_block( 'ab<b>cd</b>ef' )
			try {
				set_caret( node, 3 )
				block.paste_data( clipboard( { text: 'раз\n\nдва' } ) )

				const arg = calls[ 0 ].arg as { head: string, tail: string, inline: boolean }
				$mol_assert_equal( arg.inline, false )
				$mol_assert_equal( arg.head, 'ab<b>c</b>' )
				$mol_assert_equal( arg.tail, '<b>d</b>ef' )
			} finally { drop() }
		},

		'a paste over a selection replaces exactly that range'() {
			const { block, node, calls, drop } = make_block( 'hello world' )
			try {
				set_range( node, 6, 11 )
				block.paste_data( clipboard( { text: 'there' } ) )

				const arg = calls[ 0 ].arg as { head: string, tail: string }
				$mol_assert_equal( arg.head, 'hello ' )
				$mol_assert_equal( arg.tail, '' )
			} finally { drop() }
		},

		'a code block takes the clipboard as plain text'() {
			const { block, node, calls, drop } = make_block( '' )
			try {
				block.type = ()=> 'code'
				set_caret( node, 0 )
				block.paste_data( clipboard( { html: '<h1>x</h1>', text: '<div>\n\tif( a && b ) c\n</div>' } ) )

				const arg = calls[ 0 ].arg as { drafts: { type: string, content: string }[], inline: boolean }
				$mol_assert_equal( arg.inline, true )
				$mol_assert_equal( arg.drafts, [
					{ type: 'code', content: '&lt;div&gt;\n\tif( a &amp;&amp; b ) c\n&lt;/div&gt;' },
				] )
			} finally { drop() }
		},

		'an empty clipboard pastes nothing'() {
			const { block, node, calls, drop } = make_block( 'text' )
			try {
				set_caret( node, 0 )
				block.paste_data( clipboard( {} ) )
				$mol_assert_equal( calls.length, 0 )
			} finally { drop() }
		},

		'a clipboard of markup junk pastes nothing'() {
			const { block, node, calls, drop } = make_block( 'text' )
			try {
				set_caret( node, 0 )
				block.paste_data( clipboard( { html: '<meta charset="utf-8"><span style="color:red"></span>', text: '' } ) )
				$mol_assert_equal( calls.length, 0 )
			} finally { drop() }
		},

		'a readonly block refuses the clipboard'() {
			const { block, drop } = make_block( 'text' )
			try {
				block.readonly = ()=> true
				const event = new ClipboardEvent( 'paste', { cancelable: true } )
				block.paste_event( event )
				$mol_assert_equal( event.defaultPrevented, true )
			} finally { drop() }
		},

		// === Input notification ===

		'input_event notifies the page'() {
			const { block, node, calls, drop } = make_block( 'hi' )
			try {
				const event = new Event( 'input' )
				Object.defineProperty( event, 'target', { value: node } )
				block.input_event( event )
				$mol_assert_equal( calls.some( call => call.name === 'on_input' ), true )
			} finally { drop() }
		},

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

		'paste_event takes over plain text too, so no editor junk lands in the DOM'() {
			if( typeof document === 'undefined' ) return
			const { block, node, calls, drop } = make_block( '' )
			try {
				set_caret( node, 0 )

				const dt = new DataTransfer()
				dt.items.add( 'hello', 'text/plain' )

				const event = new ClipboardEvent( 'paste', { clipboardData: dt } )
				let prevented = false
				Object.defineProperty( event, 'preventDefault', { value: () => { prevented = true } } )

				const result = block.paste_event( event )

				$mol_assert_ok( result )
				$mol_assert_equal( prevented, true )
				$mol_assert_equal( calls[ 0 ].name, 'on_paste_blocks' )
			} finally { drop() }
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
