namespace $.$$ {

	/** Editor with real DOM behind every block and no Giper Baza at all */
	function make_editor( blocks: { id: string, html?: string, type?: string, level?: number }[] ) {

		const doc = $mol_dom_context.document
		const root = doc.createElement( 'div' )
		doc.body.appendChild( root )

		const editor = new $bog_wysiwyg()
		const views = new Map< string, $bog_wysiwyg_block >()
		const focused = [] as { id: string, offset?: number }[]

		editor.Block = ( id: string )=> {
			let view = views.get( id )
			if( view ) return view

			view = new $bog_wysiwyg_block()
			const node = doc.createElement( 'div' )
			node.contentEditable = 'true'
			node.tabIndex = 0
			node.innerHTML = editor.block_html( id )
			root.appendChild( node )
			view.dom_node = ()=> node
			view.html = ( next?: string )=> editor.block_html( id, next )
			view.type = ( next?: string )=> editor.block_type( id, next )
			view.level = ( next?: number )=> editor.block_level( id, next )
			// The same wiring view.tree does for the keyed Block
			view.on_paste_blocks = ( val?: unknown )=> editor.block_paste_blocks( id, val as never )
			view.on_split = ( parts?: unknown )=> editor.block_split( id, parts as never )
			view.on_merge_prev = ( event?: unknown )=> editor.block_merge_prev( id, event as never )
			view.on_merge_next = ( event?: unknown )=> editor.block_merge_next( id, event as never )
			view.on_nav = ( nav?: unknown )=> editor.block_nav( id, nav as never )
			views.set( id, view )

			return view
		}

		editor.focus_block = ( id: string, offset?: number )=> { focused.push({ id, offset }) }

		editor.block_ids( blocks.map( block => block.id ) )
		for( const block of blocks ) {
			if( block.html !== undefined ) editor.block_html( block.id, block.html )
			if( block.type ) editor.block_type( block.id, block.type )
			if( block.level ) editor.block_level( block.id, block.level )
		}
		// Materialize the DOM so selections can reach into the blocks
		for( const block of blocks ) editor.Block( block.id )

		return {
			editor,
			focused,
			node: ( id: string )=> editor.Block( id ).dom_node() as HTMLElement,
			drop: ()=> root.remove(),
		}
	}

	function select_across( from: HTMLElement, from_offset: number, to: HTMLElement, to_offset: number ) {
		const doc = $mol_dom_context.document
		const start = $bog_wysiwyg_point_at( from, from_offset )
		const end = $bog_wysiwyg_point_at( to, to_offset )
		const range = doc.createRange()
		range.setStart( start.node, start.offset )
		range.setEnd( end.node, end.offset )
		const sel = doc.defaultView!.getSelection()!
		sel.removeAllRanges()
		sel.addRange( range )
	}

	function editor_key( name: string, mods: KeyboardEventInit = {} ) {
		return new KeyboardEvent( 'keydown', { key: name, cancelable: true, ...mods } )
	}

	$mol_test({

		// === Splitting ===

		'block_split moves the tail into a new block'() {

			const { editor, focused, drop } = make_editor([
				{ id: 'a', html: 'hello world' },
				{ id: 'b', html: 'next' },
			])
			try {
				editor.block_split( 'a', { head: 'hello', tail: ' world' } )

				const ids = editor.block_ids()
				$mol_assert_equal( ids.length, 3 )
				$mol_assert_equal( ids[ 0 ], 'a' )
				$mol_assert_equal( ids[ 2 ], 'b' )
				$mol_assert_equal( editor.block_html( 'a' ), 'hello' )
				$mol_assert_equal( editor.block_html( ids[ 1 ] ), ' world' )
				$mol_assert_equal( focused.at( -1 ), { id: ids[ 1 ], offset: 0 } )
			} finally { drop() }
		},

		'block_split keeps the type and level of the source block'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: 'Title text', type: 'heading', level: 2 },
			])
			try {
				editor.block_split( 'a', { head: 'Title', tail: ' text' } )

				const tail_id = editor.block_ids()[ 1 ]
				$mol_assert_equal( editor.block_type( tail_id ), 'heading' )
				$mol_assert_equal( editor.block_level( tail_id ), 2 )
			} finally { drop() }
		},

		'block_split without parts does nothing'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'text' } ])
			try {
				$mol_assert_equal( editor.block_split( 'a' ), null )
				$mol_assert_equal( editor.block_ids().length, 1 )
			} finally { drop() }
		},

		'block_split is refused in readonly mode'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'text' } ])
			try {
				editor.readonly = ()=> true
				$mol_assert_equal( editor.block_split( 'a', { head: 'te', tail: 'xt' } ), null )
				$mol_assert_equal( editor.block_ids().length, 1 )
			} finally { drop() }
		},

		// === Merging ===

		'block_merge_prev glues the block into the previous one'() {

			const { editor, focused, drop } = make_editor([
				{ id: 'a', html: 'one' },
				{ id: 'b', html: 'two' },
			])
			try {
				editor.block_merge_prev( 'b', new Event( 'keydown' ) )

				$mol_assert_equal( editor.block_ids(), [ 'a' ] )
				$mol_assert_equal( editor.block_html( 'a' ), 'onetwo' )
				$mol_assert_equal( focused.at( -1 ), { id: 'a', offset: 3 } )
			} finally { drop() }
		},

		'block_merge_prev counts the joint offset over markup'() {

			const { editor, focused, drop } = make_editor([
				{ id: 'a', html: '<b>one</b>' },
				{ id: 'b', html: 'two' },
			])
			try {
				editor.block_merge_prev( 'b', new Event( 'keydown' ) )

				$mol_assert_equal( editor.block_html( 'a' ), '<b>one</b>two' )
				$mol_assert_equal( focused.at( -1 ), { id: 'a', offset: 3 } )
			} finally { drop() }
		},

		'block_merge_prev on the first block changes nothing'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: 'one' },
				{ id: 'b', html: 'two' },
			])
			try {
				editor.block_merge_prev( 'a', new Event( 'keydown' ) )

				$mol_assert_equal( editor.block_ids(), [ 'a', 'b' ] )
				$mol_assert_equal( editor.block_html( 'a' ), 'one' )
			} finally { drop() }
		},

		'block_merge_prev drops a previous block that holds no text'() {

			const { editor, focused, drop } = make_editor([
				{ id: 'a', html: '<img src="x.png">', type: 'image' },
				{ id: 'b', html: 'two' },
			])
			try {
				editor.block_merge_prev( 'b', new Event( 'keydown' ) )

				$mol_assert_equal( editor.block_ids(), [ 'b' ] )
				$mol_assert_equal( editor.block_html( 'b' ), 'two' )
				$mol_assert_equal( focused.at( -1 ), { id: 'b', offset: 0 } )
			} finally { drop() }
		},

		'block_merge_next pulls the next block in'() {

			const { editor, focused, drop } = make_editor([
				{ id: 'a', html: 'one' },
				{ id: 'b', html: 'two' },
			])
			try {
				editor.block_merge_next( 'a', new Event( 'keydown' ) )

				$mol_assert_equal( editor.block_ids(), [ 'a' ] )
				$mol_assert_equal( editor.block_html( 'a' ), 'onetwo' )
				$mol_assert_equal( focused.at( -1 ), { id: 'a', offset: 3 } )
			} finally { drop() }
		},

		'block_merge_next on the last block changes nothing'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: 'one' },
				{ id: 'b', html: 'two' },
			])
			try {
				editor.block_merge_next( 'b', new Event( 'keydown' ) )
				$mol_assert_equal( editor.block_ids(), [ 'a', 'b' ] )
			} finally { drop() }
		},

		'block_merge_next drops a next block that holds no text'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: 'one' },
				{ id: 'b', html: '', type: 'divider' },
			])
			try {
				editor.block_merge_next( 'a', new Event( 'keydown' ) )

				$mol_assert_equal( editor.block_ids(), [ 'a' ] )
				$mol_assert_equal( editor.block_html( 'a' ), 'one' )
			} finally { drop() }
		},

		'merges are refused in readonly mode'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: 'one' },
				{ id: 'b', html: 'two' },
			])
			try {
				editor.readonly = ()=> true
				$mol_assert_equal( editor.block_merge_prev( 'b', new Event( 'keydown' ) ), null )
				$mol_assert_equal( editor.block_merge_next( 'a', new Event( 'keydown' ) ), null )
				$mol_assert_equal( editor.block_ids().length, 2 )
			} finally { drop() }
		},

		// === Vertical navigation ===

		'block_nav moves the caret into the next block'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: 'hello' },
				{ id: 'b', html: 'world wide' },
			])
			try {
				editor.block_nav( 'a', { dir: 'down', x: 0, offset: 3 } )
				$mol_assert_equal( editor.block_view( 'b' ).caret_offset(), 3 )
			} finally { drop() }
		},

		'block_nav keeps the desired column across several steps'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: 'first line' },
				{ id: 'b', html: 'ab' },
				{ id: 'c', html: 'third line' },
			])
			try {
				// Down through a short block: the caret clamps to its end
				editor.block_nav( 'a', { dir: 'down', x: 0, offset: 7 } )
				$mol_assert_equal( editor.block_view( 'b' ).caret_offset(), 2 )

				// but the wanted column is remembered and restored in the next block
				editor.block_nav( 'b', { dir: 'down', x: 0, offset: 2 } )
				$mol_assert_equal( editor.block_view( 'c' ).caret_offset(), 7 )
			} finally { drop() }
		},

		'the desired column is dropped by any other key'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: 'first line' },
				{ id: 'b', html: 'ab' },
				{ id: 'c', html: 'third line' },
			])
			try {
				editor.block_nav( 'a', { dir: 'down', x: 0, offset: 7 } )
				editor.editor_keydown( editor_key( 'x' ) )
				$mol_assert_equal( editor.nav_column, null )

				editor.block_nav( 'b', { dir: 'down', x: 0, offset: 2 } )
				$mol_assert_equal( editor.block_view( 'c' ).caret_offset(), 2 )
			} finally { drop() }
		},

		'block_nav at the top edge stays put'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: 'hello' },
				{ id: 'b', html: 'world' },
			])
			try {
				editor.block_view( 'a' ).focus_at( 2 )
				editor.block_nav( 'a', { dir: 'up', x: 0, offset: 2 } )
				$mol_assert_equal( editor.block_view( 'a' ).caret_offset(), 2 )
			} finally { drop() }
		},

		'block_nav without a hint returns null'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'hello' } ])
			try {
				$mol_assert_equal( editor.block_nav( 'a' ), null )
			} finally { drop() }
		},

		// === Undo / redo ===

		'undo and redo walk over typed text'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'one' } ])
			try {
				editor.history_ensure()
				editor.block_html( 'a', 'one two' )
				editor.history_record()

				$mol_assert_equal( editor.history_states.length, 2 )

				$mol_assert_equal( editor.history_undo(), true )
				$mol_assert_equal( editor.block_html( 'a' ), 'one' )

				$mol_assert_equal( editor.history_redo(), true )
				$mol_assert_equal( editor.block_html( 'a' ), 'one two' )
			} finally { drop() }
		},

		'undo restores a block split'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'hello world' } ])
			try {
				editor.block_split( 'a', { head: 'hello', tail: ' world' } )
				$mol_assert_equal( editor.block_ids().length, 2 )

				editor.history_undo()
				$mol_assert_equal( editor.block_ids(), [ 'a' ] )
				$mol_assert_equal( editor.block_html( 'a' ), 'hello world' )
			} finally { drop() }
		},

		'undo restores a merge'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: 'one' },
				{ id: 'b', html: 'two' },
			])
			try {
				editor.block_merge_prev( 'b', new Event( 'keydown' ) )
				$mol_assert_equal( editor.block_ids(), [ 'a' ] )

				editor.history_undo()
				$mol_assert_equal( editor.block_ids(), [ 'a', 'b' ] )
				$mol_assert_equal( editor.block_html( 'a' ), 'one' )
				$mol_assert_equal( editor.block_html( 'b' ), 'two' )
			} finally { drop() }
		},

		'undo restores the block type'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'text' } ])
			try {
				editor.history_ensure()
				editor.block_type( 'a', 'quote' )
				editor.history_record()

				editor.history_undo()
				$mol_assert_equal( editor.block_type( 'a' ), 'paragraph' )
			} finally { drop() }
		},

		'undo at the bottom of the stack reports failure'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'one' } ])
			try {
				editor.history_ensure()
				$mol_assert_equal( editor.history_undo(), false )
			} finally { drop() }
		},

		'redo at the top of the stack reports failure'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'one' } ])
			try {
				editor.history_ensure()
				$mol_assert_equal( editor.history_redo(), false )
			} finally { drop() }
		},

		'a repeated state is not stacked twice'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'one' } ])
			try {
				editor.history_record()
				editor.history_record()
				editor.history_record()
				$mol_assert_equal( editor.history_states.length, 1 )
			} finally { drop() }
		},

		'a new edit after undo cuts the redo tail'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'one' } ])
			try {
				editor.history_ensure()
				editor.block_html( 'a', 'two' )
				editor.history_record()
				editor.history_undo()

				editor.block_html( 'a', 'three' )
				editor.history_record()

				$mol_assert_equal( editor.history_states.length, 2 )
				$mol_assert_equal( editor.history_redo(), false )
			} finally { drop() }
		},

		'redo does not throw away text typed after an undo'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'one' } ])
			try {
				editor.history_ensure()
				editor.block_html( 'a', 'one two' )
				editor.history_record()
				editor.history_undo()

				// typed, but the debounce has not fired yet
				editor.block_html( 'a', 'one three' )

				$mol_assert_equal( editor.history_redo(), false )
				$mol_assert_equal( editor.block_html( 'a' ), 'one three' )
			} finally { drop() }
		},

		'the stack is trimmed to its limit'() {

			const { editor, drop } = make_editor([ { id: 'a', html: '0' } ])
			try {
				editor.history_limit = ()=> 3
				for( let i = 1; i <= 6; i++ ) {
					editor.block_html( 'a', String( i ) )
					editor.history_record()
				}
				$mol_assert_equal( editor.history_states.length, 3 )
				$mol_assert_equal( editor.history_states[ 0 ].blocks[ 0 ].content, '4' )
			} finally { drop() }
		},

		'a snapshot carries id, type, level, content and the caret'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: 'Head', type: 'heading', level: 3 },
			])
			try {
				editor.block_view( 'a' ).focus_at( 2 )
				const snapshot = editor.history_snapshot()

				$mol_assert_equal( snapshot.blocks, [
					{ id: 'a', type: 'heading', level: 3, content: 'Head' },
				] )
				$mol_assert_equal( snapshot.caret, { id: 'a', offset: 2 } )
			} finally { drop() }
		},

		'history stays in memory and never reaches Giper Baza'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'one' } ])
			try {
				editor.history_ensure()
				editor.block_html( 'a', 'two' )
				editor.history_record()

				$mol_assert_equal( editor.has_baza(), false )
				$mol_assert_equal( editor.history_states.length, 2 )
			} finally { drop() }
		},

		'the debounce timer is dropped when a snapshot is taken'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'one' } ])
			try {
				editor.block_input( 'a', new Event( 'input' ) )
				$mol_assert_ok( editor.history_timer )

				editor.history_record()
				$mol_assert_equal( editor.history_timer, null )
			} finally { drop() }
		},

		'Ctrl+Z undoes and Ctrl+Shift+Z redoes'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'one' } ])
			try {
				editor.history_ensure()
				editor.block_html( 'a', 'one two' )
				editor.history_record()

				editor.editor_keydown( editor_key( 'z', { ctrlKey: true } ) )
				$mol_assert_equal( editor.block_html( 'a' ), 'one' )

				editor.editor_keydown( editor_key( 'z', { ctrlKey: true, shiftKey: true } ) )
				$mol_assert_equal( editor.block_html( 'a' ), 'one two' )
			} finally { drop() }
		},

		'Ctrl+Y redoes as well'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'one' } ])
			try {
				editor.history_ensure()
				editor.block_html( 'a', 'one two' )
				editor.history_record()
				editor.history_undo()

				editor.editor_keydown( editor_key( 'y', { ctrlKey: true } ) )
				$mol_assert_equal( editor.block_html( 'a' ), 'one two' )
			} finally { drop() }
		},

		'undo is not offered in readonly mode'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'one' } ])
			try {
				editor.history_ensure()
				editor.block_html( 'a', 'one two' )
				editor.history_record()
				editor.readonly = ()=> true

				const event = editor_key( 'z', { ctrlKey: true } )
				editor.editor_keydown( event )

				$mol_assert_equal( event.defaultPrevented, false )
				$mol_assert_equal( editor.block_html( 'a' ), 'one two' )
			} finally { drop() }
		},

		// === Selection across blocks ===

		'block_of_node finds the owning block'() {

			const helper = make_editor([
				{ id: 'a', html: 'one' },
				{ id: 'b', html: 'two' },
			])
			try {
				const { editor } = helper
				$mol_assert_equal( editor.block_of_node( helper.node( 'b' ).firstChild ), 'b' )
				$mol_assert_equal( editor.block_of_node( helper.node( 'a' ) ), 'a' )
				$mol_assert_equal( editor.block_of_node( null ), '' )
			} finally { helper.drop() }
		},

		'selection_spans_blocks is false inside a single block'() {

			const helper = make_editor([
				{ id: 'a', html: 'one' },
				{ id: 'b', html: 'two' },
			])
			try {
				select_across( helper.node( 'a' ), 0, helper.node( 'a' ), 2 )
				$mol_assert_equal( helper.editor.selection_spans_blocks(), false )
			} finally { helper.drop() }
		},

		'selection_spans_blocks is true over a border'() {

			const helper = make_editor([
				{ id: 'a', html: 'one' },
				{ id: 'b', html: 'two' },
			])
			try {
				select_across( helper.node( 'a' ), 1, helper.node( 'b' ), 1 )
				$mol_assert_equal( helper.editor.selection_spans_blocks(), true )
			} finally { helper.drop() }
		},

		'delete_selection keeps the head of the first and the tail of the last block'() {

			const helper = make_editor([
				{ id: 'a', html: 'aaa' },
				{ id: 'b', html: 'bbb' },
				{ id: 'c', html: 'ccc' },
			])
			try {
				const { editor, focused } = helper
				select_across( helper.node( 'a' ), 1, helper.node( 'c' ), 2 )

				$mol_assert_equal( editor.delete_selection(), true )
				$mol_assert_equal( editor.block_ids(), [ 'a' ] )
				$mol_assert_equal( editor.block_html( 'a' ), 'ac' )
				$mol_assert_equal( focused.at( -1 ), { id: 'a', offset: 1 } )
			} finally { helper.drop() }
		},

		'delete_selection keeps markup around the cut'() {

			const helper = make_editor([
				{ id: 'a', html: '<b>keep</b>drop' },
				{ id: 'b', html: 'drop<i>rest</i>' },
			])
			try {
				select_across( helper.node( 'a' ), 4, helper.node( 'b' ), 4 )

				$mol_assert_equal( helper.editor.delete_selection(), true )
				$mol_assert_equal( helper.editor.block_html( 'a' ), '<b>keep</b><i>rest</i>' )
			} finally { helper.drop() }
		},

		'delete_selection can put a typed character in place of the selection'() {

			const helper = make_editor([
				{ id: 'a', html: 'aaa' },
				{ id: 'b', html: 'bbb' },
			])
			try {
				const { editor, focused } = helper
				select_across( helper.node( 'a' ), 1, helper.node( 'b' ), 2 )

				$mol_assert_equal( editor.delete_selection( 'X' ), true )
				$mol_assert_equal( editor.block_html( 'a' ), 'aXb' )
				$mol_assert_equal( focused.at( -1 ), { id: 'a', offset: 2 } )
			} finally { helper.drop() }
		},

		'delete_selection escapes the typed character'() {

			const helper = make_editor([
				{ id: 'a', html: 'aaa' },
				{ id: 'b', html: 'bbb' },
			])
			try {
				select_across( helper.node( 'a' ), 1, helper.node( 'b' ), 2 )
				helper.editor.delete_selection( '<' )
				$mol_assert_equal( helper.editor.block_html( 'a' ), 'a&lt;b' )
			} finally { helper.drop() }
		},

		'delete_selection ignores a selection inside one block'() {

			const helper = make_editor([
				{ id: 'a', html: 'aaa' },
				{ id: 'b', html: 'bbb' },
			])
			try {
				select_across( helper.node( 'a' ), 0, helper.node( 'a' ), 2 )
				$mol_assert_equal( helper.editor.delete_selection(), false )
				$mol_assert_equal( helper.editor.block_ids().length, 2 )
			} finally { helper.drop() }
		},

		'Backspace over a cross block selection keeps the document sane'() {

			const helper = make_editor([
				{ id: 'a', html: 'aaa' },
				{ id: 'b', html: 'bbb' },
				{ id: 'c', html: 'ccc' },
			])
			try {
				const { editor } = helper
				select_across( helper.node( 'a' ), 1, helper.node( 'c' ), 1 )

				const event = editor_key( 'Backspace' )
				editor.editor_keydown( event )

				$mol_assert_equal( event.defaultPrevented, true )
				$mol_assert_equal( editor.block_ids(), [ 'a' ] )
				$mol_assert_equal( editor.block_html( 'a' ), 'acc' )
			} finally { helper.drop() }
		},

		'typing over a cross block selection replaces it with the character'() {

			const helper = make_editor([
				{ id: 'a', html: 'aaa' },
				{ id: 'b', html: 'bbb' },
			])
			try {
				const { editor } = helper
				select_across( helper.node( 'a' ), 2, helper.node( 'b' ), 1 )

				const event = editor_key( 'q' )
				editor.editor_keydown( event )

				$mol_assert_equal( event.defaultPrevented, true )
				$mol_assert_equal( editor.block_ids(), [ 'a' ] )
				$mol_assert_equal( editor.block_html( 'a' ), 'aaqbb' )
			} finally { helper.drop() }
		},

		'a cross block deletion can be undone'() {

			const helper = make_editor([
				{ id: 'a', html: 'aaa' },
				{ id: 'b', html: 'bbb' },
				{ id: 'c', html: 'ccc' },
			])
			try {
				const { editor } = helper
				select_across( helper.node( 'a' ), 1, helper.node( 'c' ), 1 )
				editor.delete_selection()

				editor.history_undo()
				$mol_assert_equal( editor.block_ids(), [ 'a', 'b', 'c' ] )
				$mol_assert_equal( editor.block_html( 'a' ), 'aaa' )
				$mol_assert_equal( editor.block_html( 'c' ), 'ccc' )
			} finally { helper.drop() }
		},

		'a printable key with a plain caret is left to the browser'() {

			const helper = make_editor([
				{ id: 'a', html: 'aaa' },
				{ id: 'b', html: 'bbb' },
			])
			try {
				helper.editor.block_view( 'a' ).focus_at( 1 )
				const event = editor_key( 'q' )
				helper.editor.editor_keydown( event )

				$mol_assert_equal( event.defaultPrevented, false )
				$mol_assert_equal( helper.editor.block_html( 'a' ), 'aaa' )
			} finally { helper.drop() }
		},

		'ArrowDown increments menu_index within bounds'() {

			const editor = new $bog_wysiwyg()
			editor.menu_index( 0 )

			const event = new KeyboardEvent( 'keydown', { key: 'ArrowDown' } )
			editor.block_menu_key( 'test', event )

			$mol_assert_equal( editor.menu_index(), 1 )
		},

		'ArrowDown does not exceed max index'() {

			const editor = new $bog_wysiwyg()
			const max = editor.Menu().commands().length - 1
			editor.menu_index( max )

			const event = new KeyboardEvent( 'keydown', { key: 'ArrowDown' } )
			editor.block_menu_key( 'test', event )

			$mol_assert_equal( editor.menu_index(), max )
		},

		'ArrowUp decrements menu_index within bounds'() {

			const editor = new $bog_wysiwyg()
			editor.menu_index( 3 )

			const event = new KeyboardEvent( 'keydown', { key: 'ArrowUp' } )
			editor.block_menu_key( 'test', event )

			$mol_assert_equal( editor.menu_index(), 2 )
		},

		'ArrowUp does not go below zero'() {

			const editor = new $bog_wysiwyg()
			editor.menu_index( 0 )

			const event = new KeyboardEvent( 'keydown', { key: 'ArrowUp' } )
			editor.block_menu_key( 'test', event )

			$mol_assert_equal( editor.menu_index(), 0 )
		},

		'Enter triggers menu_picked'() {

			const editor = new $bog_wysiwyg()
			editor.menu_index( 2 )

			let picked_val = ''
			editor.menu_picked = ( next?: string ) => {
				if( next !== undefined ) picked_val = next
				return picked_val
			}

			const event = new KeyboardEvent( 'keydown', { key: 'Enter' } )
			editor.block_menu_key( 'test', event )

			const expected_id = editor.Menu().commands()[ 2 ].id
			$mol_assert_equal( picked_val, expected_id )
		},

		'Escape closes menu'() {

			const editor = new $bog_wysiwyg()
			editor.menu_showed( true )

			const event = new KeyboardEvent( 'keydown', { key: 'Escape' } )
			editor.block_menu_key( 'test', event )

			$mol_assert_equal( editor.menu_showed(), false )
		},

		'Printable char closes menu'() {

			const editor = new $bog_wysiwyg()
			editor.menu_showed( true )

			const event = new KeyboardEvent( 'keydown', { key: 'a' } )
			editor.block_menu_key( 'test', event )

			$mol_assert_equal( editor.menu_showed(), false )
		},

		'option_active returns true for current index'() {

			const menu = new $bog_wysiwyg_menu()
			menu.index( 0 )

			const first_id = menu.commands()[ 0 ].id
			$mol_assert_equal( menu.option_active( first_id ), true )
			$mol_assert_equal( menu.option_active( 'nonexistent' ), false )
		},

		'option_active tracks index changes'() {

			const menu = new $bog_wysiwyg_menu()
			menu.index( 2 )

			const cmd = menu.commands()[ 2 ]
			$mol_assert_equal( menu.option_active( cmd.id ), true )
			$mol_assert_equal( menu.option_active( menu.commands()[ 0 ].id ), false )
		},

		'option_click calls picked and closes menu'() {

			const menu = new $bog_wysiwyg_menu()
			menu.showed( true )

			let picked_val = ''
			menu.picked = ( next?: string ) => {
				if( next !== undefined ) picked_val = next
				return picked_val
			}

			const event = new Event( 'click' )
			menu.option_click( 'heading1', event )

			$mol_assert_equal( picked_val, 'heading1' )
			$mol_assert_equal( menu.showed(), false )
		},

		'option_click without event returns null'() {

			const menu = new $bog_wysiwyg_menu()
			$mol_assert_equal( menu.option_click( 'heading1' ), null )
		},

		'menu_picked applies heading type with level'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.menu_showed( true )

			editor.focus_block = () => {}

			editor.menu_picked( 'heading2' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'heading' )
			$mol_assert_equal( editor.block_level( 'b1' ), 2 )
			$mol_assert_equal( editor.menu_showed(), false )
		},

		'menu_picked applies non-heading type'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.menu_showed( true )

			editor.focus_block = () => {}

			editor.menu_picked( 'code' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'code' )
			$mol_assert_equal( editor.menu_showed(), false )
		},

		'block_slash opens menu and resets index'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'b1' ] )
			editor.menu_index( 5 )
			editor.menu_showed( false )

			// Mock DOM methods that block_slash uses
			const fake_rect = { bottom: 100, left: 50, top: 0 } as DOMRect
			editor.Block = ( id: any ) => {
				const block = new $bog_wysiwyg_block()
				block.dom_node = () => ({ getBoundingClientRect: () => fake_rect } as any)
				return block
			}
			editor.dom_node = () => ({ getBoundingClientRect: () => ({ top: 0, left: 0 } as DOMRect) } as any)

			const event = new KeyboardEvent( 'keydown', { key: '/' } )
			editor.block_slash( 'b1', event )

			$mol_assert_equal( editor.menu_index(), 0 )
			$mol_assert_equal( editor.menu_showed(), true )
		},

		// === Block management ===

		'block_enter creates new block after current'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b' ] )
			editor.focus_block = () => {}

			const event = new Event( 'test' )
			editor.block_enter( 'a', event )

			const ids = editor.block_ids()
			$mol_assert_equal( ids.length, 3 )
			$mol_assert_equal( ids[ 0 ], 'a' )
			$mol_assert_equal( ids[ 2 ], 'b' )
		},

		'block_enter preserves all existing blocks'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'x', 'y', 'z' ] )
			editor.focus_block = () => {}

			const event = new Event( 'test' )
			editor.block_enter( 'y', event )

			const ids = editor.block_ids()
			$mol_assert_equal( ids.length, 4 )
			$mol_assert_equal( ids[ 0 ], 'x' )
			$mol_assert_equal( ids[ 1 ], 'y' )
			// ids[2] — new generated id
			$mol_assert_equal( ids[ 3 ], 'z' )
		},

		'block_enter without event returns null'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a' ] )

			$mol_assert_equal( editor.block_enter( 'a' ), null )
			$mol_assert_equal( editor.block_ids().length, 1 )
		},

		'block_enter on nonexistent id inserts at end'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b' ] )
			editor.focus_block = () => {}

			const event = new Event( 'test' )
			editor.block_enter( 'nonexistent', event )

			const ids = editor.block_ids()
			// indexOf returns -1, splice(-1+1=0, 0, new_id) inserts at index 0
			$mol_assert_equal( ids.length, 3 )
		},

		'block_remove removes block'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b', 'c' ] )
			editor.focus_block = () => {}

			const event = new Event( 'test' )
			editor.block_remove( 'b', event )

			const ids = editor.block_ids()
			$mol_assert_equal( ids.length, 2 )
			$mol_assert_equal( ids[ 0 ], 'a' )
			$mol_assert_equal( ids[ 1 ], 'c' )
		},

		'block_remove does not remove last block'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'only' ] )

			const event = new Event( 'test' )
			const result = editor.block_remove( 'only', event )

			$mol_assert_equal( result, null )
			$mol_assert_equal( editor.block_ids().length, 1 )
			$mol_assert_equal( editor.block_ids()[ 0 ], 'only' )
		},

		'block_remove without event returns null'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b' ] )

			$mol_assert_equal( editor.block_remove( 'a' ), null )
			$mol_assert_equal( editor.block_ids().length, 2 )
		},

		// === Slash menu → block type integration ===

		'menu_picked with paragraph sets type paragraph'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			editor.menu_picked( 'paragraph' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'paragraph' )
			$mol_assert_equal( editor.menu_showed(), false )
		},

		'menu_picked with code sets type code'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			editor.menu_picked( 'code' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'code' )
			$mol_assert_equal( editor.menu_showed(), false )
		},

		'menu_picked with quote sets type quote'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			editor.menu_picked( 'quote' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'quote' )
			$mol_assert_equal( editor.menu_showed(), false )
		},

		'menu_picked with list sets type list'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			editor.menu_picked( 'list' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'list' )
			$mol_assert_equal( editor.menu_showed(), false )
		},

		'menu_picked with divider sets type divider'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			editor.menu_picked( 'divider' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'divider' )
			$mol_assert_equal( editor.menu_showed(), false )
		},

		'menu_picked with heading1 sets type heading and level 1'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			editor.menu_picked( 'heading1' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'heading' )
			$mol_assert_equal( editor.block_level( 'b1' ), 1 )
			$mol_assert_equal( editor.menu_showed(), false )
		},

		'menu_picked with heading3 sets type heading and level 3'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			editor.menu_picked( 'heading3' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'heading' )
			$mol_assert_equal( editor.block_level( 'b1' ), 3 )
			$mol_assert_equal( editor.menu_showed(), false )
		},

		// === Block properties ===

		'block_html stores and returns HTML'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'b1' ] )

			editor.block_html( 'b1', '<b>hello</b>' )
			$mol_assert_equal( editor.block_html( 'b1' ), '<b>hello</b>' )
		},

		'block_type defaults to paragraph'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'b1' ] )

			$mol_assert_equal( editor.block_type( 'b1' ), 'paragraph' )
		},

		'block_level defaults to 1'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'b1' ] )

			$mol_assert_equal( editor.block_level( 'b1' ), 1 )
		},

		'each block has independent html/type/level'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'b1', 'b2' ] )

			editor.block_html( 'b1', 'first' )
			editor.block_html( 'b2', 'second' )
			editor.block_type( 'b1', 'code' )
			editor.block_type( 'b2', 'quote' )
			editor.block_level( 'b1', 2 )
			editor.block_level( 'b2', 3 )

			$mol_assert_equal( editor.block_html( 'b1' ), 'first' )
			$mol_assert_equal( editor.block_html( 'b2' ), 'second' )
			$mol_assert_equal( editor.block_type( 'b1' ), 'code' )
			$mol_assert_equal( editor.block_type( 'b2' ), 'quote' )
			$mol_assert_equal( editor.block_level( 'b1' ), 2 )
			$mol_assert_equal( editor.block_level( 'b2' ), 3 )
		},

		// === Edge cases ===

		'active_block_id defaults to empty string'() {

			const editor = new $bog_wysiwyg()
			$mol_assert_equal( editor.active_block_id(), '' )
		},

		'generate_id returns non-empty strings'() {

			const editor = new $bog_wysiwyg()
			const id1 = editor.generate_id()
			const id2 = editor.generate_id()

			$mol_assert_ok( id1.length > 0 )
			$mol_assert_ok( id2.length > 0 )
		},

		'block_views returns array of blocks matching block_ids'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b', 'c' ] )

			const views = editor.block_views()
			$mol_assert_equal( views.length, 3 )
		},

		'menu_picked clears block html'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.block_html( 'b1', 'some text' )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			editor.menu_picked( 'code' )

			$mol_assert_equal( editor.block_html( 'b1' ), '' )
		},

		'menu_picked with no active_block_id does nothing'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'b1' ] )
			editor.block_type( 'b1', 'paragraph' )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			// active_block_id defaults to '', apply_menu_command returns early
			editor.menu_picked( 'code' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'paragraph' )
		},

		// === Focus behavior ===

		'block_remove calls focus_block with previous id'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b', 'c' ] )

			let focused_id = ''
			editor.focus_block = ( id: string ) => { focused_id = id }

			const event = new Event( 'test' )
			editor.block_remove( 'b', event )

			$mol_assert_equal( focused_id, 'a' )
		},

		'block_remove of first block focuses new first block'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b', 'c' ] )

			let focused_id = ''
			editor.focus_block = ( id: string ) => { focused_id = id }

			const event = new Event( 'test' )
			editor.block_remove( 'a', event )

			// index was 0, Math.max(0, 0-1) = 0, focuses ids[0] which is now 'b'
			$mol_assert_equal( focused_id, 'b' )
		},

		// === Block operations with menu open ===

		'block_enter while menu is open still creates block'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b' ] )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			const event = new Event( 'test' )
			editor.block_enter( 'a', event )

			$mol_assert_equal( editor.block_ids().length, 3 )
		},

		'block_remove while menu is open still removes block'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b', 'c' ] )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			const event = new Event( 'test' )
			editor.block_remove( 'b', event )

			$mol_assert_equal( editor.block_ids().length, 2 )
		},

		// === Multiple sequential operations ===

		'multiple block_enter calls create multiple blocks'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a' ] )
			editor.focus_block = () => {}

			const event = new Event( 'test' )
			editor.block_enter( 'a', event )
			editor.block_enter( 'a', event )
			editor.block_enter( 'a', event )

			$mol_assert_equal( editor.block_ids().length, 4 )
			$mol_assert_equal( editor.block_ids()[ 0 ], 'a' )
		},

		'block_enter then block_remove restores original count'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b' ] )
			editor.focus_block = () => {}

			const event = new Event( 'test' )
			editor.block_enter( 'a', event )

			const new_id = editor.block_ids()[ 1 ]
			editor.block_remove( new_id, event )

			$mol_assert_equal( editor.block_ids().length, 2 )
			$mol_assert_equal( editor.block_ids()[ 0 ], 'a' )
			$mol_assert_equal( editor.block_ids()[ 1 ], 'b' )
		},

		'menu_picked with heading2 then menu_picked with code overwrites type'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.focus_block = () => {}

			editor.menu_showed( true )
			editor.menu_picked( 'heading2' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'heading' )
			$mol_assert_equal( editor.block_level( 'b1' ), 2 )

			editor.menu_showed( true )
			editor.menu_picked( 'code' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'code' )
		},

		// === Image block ===

		'image command exists in slash menu'() {

			const menu = new $bog_wysiwyg_menu()
			const cmds = menu.commands()
			const image_cmd = cmds.find( c => c.id === 'image' )
			$mol_assert_ok( image_cmd )
		},

		'block_image sets type to image and stores img html'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'b1' ] )

			editor.block_image( 'b1', 'https://example.com/photo.jpg' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'image' )
			$mol_assert_ok( editor.block_html( 'b1' ).includes( '<img' ) )
			$mol_assert_ok( editor.block_html( 'b1' ).includes( 'https://example.com/photo.jpg' ) )
		},

		'block_image without src returns null'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'b1' ] )

			$mol_assert_equal( editor.block_image( 'b1' ), null )
			$mol_assert_equal( editor.block_type( 'b1' ), 'paragraph' )
		},

		/*
		 * The picture command used to call a native `prompt()`. That freezes the renderer, so the
		 * tab stops answering the user and the debug protocol alike, and an address was the only
		 * thing it could ever ask for. It opens the editor's own panel now.
		 */
		'menu_picked with image opens the picture panel'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			editor.menu_picked( 'image' )

			$mol_assert_equal( editor.image_prompt_showed(), true )
			$mol_assert_equal( editor.menu_showed(), false )
			// Nothing is committed until the panel answers
			$mol_assert_equal( editor.block_type( 'b1' ), 'paragraph' )
		},

		'an address typed into the picture panel makes the picture'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.focus_block = () => {}

			editor.menu_picked( 'image' )
			editor.image_url( 'https://example.com/img.png' )
			editor.image_submit()

			$mol_assert_equal( editor.block_type( 'b1' ), 'image' )
			$mol_assert_ok( editor.block_html( 'b1' ).includes( 'https://example.com/img.png' ) )
			$mol_assert_equal( editor.image_prompt_showed(), false )
		},

		'an empty picture panel leaves the block alone'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.focus_block = () => {}

			editor.menu_picked( 'image' )
			editor.image_submit()

			$mol_assert_equal( editor.block_type( 'b1' ), 'paragraph' )
			$mol_assert_equal( editor.image_prompt_showed(), false )
		},

		/*
		 * A picture that cannot be written used to leave the block typed `image` with nothing in
		 * it — a blank frame, no message, no console entry. Now the block is left alone and the
		 * failure is said out loud.
		 */
		async 'a picture that fails to store says so and leaves the block alone'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'b1' ] )
			editor.focus_block = () => {}
			editor.notice_image_failed = ()=> 'no luck'

			editor.page_land = ()=> ( {
				Pawn: ()=> { throw new Error( 'no room in the Land' ) },
				self_make: ()=> null,
			} ) as never

			const file = new File( [ new Uint8Array( 4 ) ], 'shot.png', { type: 'image/png' } )
			// Reading the bytes suspends the action, so drive it the way an event handler does
			$mol_assert_equal( await $mol_wire_async( editor ).block_image_file( 'b1', file ), file )

			$mol_assert_equal( editor.notice(), 'no luck' )
			$mol_assert_equal( editor.notice_showed(), true )
			$mol_assert_equal( editor.block_type( 'b1' ), 'paragraph' )
		},

		'with no Land the picture falls back to the caller'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'b1' ] )
			editor.focus_block = () => {}

			const file = new File( [ new Uint8Array( 4 ) ], 'shot.png', { type: 'image/png' } )
			// null tells the block view to inline it as a data uri instead
			$mol_assert_equal( editor.block_image_file( 'b1', file ), null )
			$mol_assert_equal( editor.notice(), '' )
		},

		'the link panel wraps the selection through the block'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'b1' ] )
			editor.focus_block = () => {}

			const applied = [] as string[]
			editor.block_view = ()=> ( { link_apply: ( url: string )=> { applied.push( url ) } } ) as never

			editor.block_link( 'b1', new $mol_dom_context.Event( 'keydown' ) )
			$mol_assert_equal( editor.link_prompt_showed(), true )

			editor.link_url( 'https://example.com' )
			editor.link_submit()

			$mol_assert_equal( applied, [ 'https://example.com' ] )
			$mol_assert_equal( editor.link_prompt_showed(), false )
		},

		'the link panel makes an embed block when the plugin asked'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'b1' ] )
			editor.focus_block = () => {}

			editor.link_prompt_open( 'b1', 'embed' )
			editor.link_url( 'https://example.com/page' )
			editor.link_submit()

			$mol_assert_equal( editor.block_type( 'b1' ), 'embed' )
			$mol_assert_ok( editor.block_html( 'b1' ).includes( 'https://example.com/page' ) )
			$mol_assert_equal( editor.link_prompt_showed(), false )
		},

		// === Drag & Drop ===

		'move_block moves block down (after)'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b', 'c' ] )

			editor.move_block( 'a', 'c', 'after' )

			const ids = editor.block_ids()
			$mol_assert_equal( ids[ 0 ], 'b' )
			$mol_assert_equal( ids[ 1 ], 'c' )
			$mol_assert_equal( ids[ 2 ], 'a' )
		},

		'move_block moves block up (before)'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b', 'c' ] )

			editor.move_block( 'c', 'a', 'before' )

			const ids = editor.block_ids()
			$mol_assert_equal( ids[ 0 ], 'c' )
			$mol_assert_equal( ids[ 1 ], 'a' )
			$mol_assert_equal( ids[ 2 ], 'b' )
		},

		'move_block to same position does not change order'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b', 'c' ] )

			editor.move_block( 'b', 'a', 'after' )

			const ids = editor.block_ids()
			$mol_assert_equal( ids[ 0 ], 'a' )
			$mol_assert_equal( ids[ 1 ], 'b' )
			$mol_assert_equal( ids[ 2 ], 'c' )
		},

		'move_block with invalid from_id does nothing'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b', 'c' ] )

			editor.move_block( 'nonexistent', 'b', 'after' )

			const ids = editor.block_ids()
			$mol_assert_equal( ids.length, 3 )
			$mol_assert_equal( ids[ 0 ], 'a' )
		},

		'drag_source_id stores and clears'() {

			const editor = new $bog_wysiwyg()
			$mol_assert_equal( editor.drag_source_id(), '' )

			editor.drag_source_id( 'block1' )
			$mol_assert_equal( editor.drag_source_id(), 'block1' )

			editor.drag_source_id( '' )
			$mol_assert_equal( editor.drag_source_id(), '' )
		},

		'drag_over_id stores and clears'() {

			const editor = new $bog_wysiwyg()
			$mol_assert_equal( editor.drag_over_id(), '' )

			editor.drag_over_id( 'block2' )
			$mol_assert_equal( editor.drag_over_id(), 'block2' )
		},

		'clear_drag_state resets all drag state'() {

			const editor = new $bog_wysiwyg()
			editor.drag_source_id( 'src' )
			editor.drag_over_id( 'over' )
			editor.drag_over_position( 'before' )

			editor.clear_drag_state()

			$mol_assert_equal( editor.drag_source_id(), '' )
			$mol_assert_equal( editor.drag_over_id(), '' )
			$mol_assert_equal( editor.drag_over_position(), 'after' )
		},

		'row_is_drag_over returns true for target, false for source'() {

			const editor = new $bog_wysiwyg()
			editor.drag_source_id( 'a' )
			editor.drag_over_id( 'b' )

			$mol_assert_equal( editor.row_is_drag_over( 'b' ), true )
			$mol_assert_equal( editor.row_is_drag_over( 'a' ), false )
			$mol_assert_equal( editor.row_is_drag_over( 'c' ), false )
		},

		'row_is_dragging returns true for source block'() {

			const editor = new $bog_wysiwyg()
			editor.drag_source_id( 'a' )

			$mol_assert_equal( editor.row_is_dragging( 'a' ), true )
			$mol_assert_equal( editor.row_is_dragging( 'b' ), false )
		},

		'block_row_views returns rows matching block_ids'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b', 'c' ] )

			const rows = editor.block_row_views()
			$mol_assert_equal( rows.length, 3 )
		},

		// === html_to_md ===

		'html_to_md: bold to markdown'() {
			$mol_assert_equal( $bog_wysiwyg_html_to_md( '<b>hello</b>' ), '**hello**' )
		},

		'html_to_md: strong to markdown'() {
			$mol_assert_equal( $bog_wysiwyg_html_to_md( '<strong>hello</strong>' ), '**hello**' )
		},

		'html_to_md: italic to markdown'() {
			$mol_assert_equal( $bog_wysiwyg_html_to_md( '<i>hello</i>' ), '*hello*' )
		},

		'html_to_md: em to markdown'() {
			$mol_assert_equal( $bog_wysiwyg_html_to_md( '<em>hello</em>' ), '*hello*' )
		},

		'html_to_md: code to markdown'() {
			$mol_assert_equal( $bog_wysiwyg_html_to_md( '<code>x</code>' ), '`x`' )
		},

		'html_to_md: strike to markdown'() {
			$mol_assert_equal( $bog_wysiwyg_html_to_md( '<s>old</s>' ), '~~old~~' )
		},

		'html_to_md: del to markdown'() {
			$mol_assert_equal( $bog_wysiwyg_html_to_md( '<del>old</del>' ), '~~old~~' )
		},

		'html_to_md: link to markdown'() {
			$mol_assert_equal(
				$bog_wysiwyg_html_to_md( '<a href="https://example.com">click</a>' ),
				'[click](https://example.com)',
			)
		},

		'html_to_md: br to newline'() {
			$mol_assert_equal( $bog_wysiwyg_html_to_md( 'line1<br>line2' ), 'line1\nline2' )
		},

		'html_to_md: strips unknown tags'() {
			$mol_assert_equal( $bog_wysiwyg_html_to_md( '<div>hello</div>' ), 'hello' )
		},

		'html_to_md: decodes HTML entities'() {
			$mol_assert_equal( $bog_wysiwyg_html_to_md( '&amp; &lt; &gt; &quot;' ), '& < > "' )
		},

		'html_to_md: mixed inline formatting'() {
			$mol_assert_equal(
				$bog_wysiwyg_html_to_md( 'hello <b>bold</b> and <i>italic</i>' ),
				'hello **bold** and *italic*',
			)
		},

		'html_to_md: plain text unchanged'() {
			$mol_assert_equal( $bog_wysiwyg_html_to_md( 'just text' ), 'just text' )
		},

		// === block_paste_blocks ===

		'block_paste_blocks fills an untouched block and adds the rest after it'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: '' },
				{ id: 'b', html: 'next' },
			])
			try {
				editor.block_paste_blocks( 'a', { drafts: [
					{ type: 'heading', content: 'Title', level: 1 },
					{ type: 'paragraph', content: 'text' },
					{ type: 'code', content: 'x = 1' },
				] } )

				const ids = editor.block_ids()
				$mol_assert_equal( ids.length, 4 )
				$mol_assert_equal( ids[ 0 ], 'a' )
				$mol_assert_equal( ids[ 3 ], 'b' )
				$mol_assert_equal( editor.block_type( 'a' ), 'heading' )
				$mol_assert_equal( editor.block_html( 'a' ), 'Title' )
				$mol_assert_equal( editor.block_level( 'a' ), 1 )
				$mol_assert_equal( editor.block_type( ids[ 1 ] ), 'paragraph' )
				$mol_assert_equal( editor.block_html( ids[ 1 ] ), 'text' )
				$mol_assert_equal( editor.block_type( ids[ 2 ] ), 'code' )
				$mol_assert_equal( editor.block_html( ids[ 2 ] ), 'x = 1' )
			} finally { drop() }
		},

		'block_paste_blocks with a single draft keeps the block count'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: '' },
				{ id: 'b', html: 'next' },
			])
			try {
				editor.block_paste_blocks( 'a', { drafts: [ { type: 'quote', content: 'quoted' } ] } )

				$mol_assert_equal( editor.block_ids().length, 2 )
				$mol_assert_equal( editor.block_type( 'a' ), 'quote' )
				$mol_assert_equal( editor.block_html( 'a' ), 'quoted' )
			} finally { drop() }
		},

		'block_paste_blocks splits the block around the caret'() {

			const { editor, focused, drop } = make_editor([ { id: 'a', html: 'headtail' } ])
			try {
				editor.block_paste_blocks( 'a', {
					drafts: [
						{ type: 'paragraph', content: 'one' },
						{ type: 'paragraph', content: 'two' },
					],
					head: 'head',
					tail: 'tail',
				} )

				const ids = editor.block_ids()
				$mol_assert_equal( ids.length, 2 )
				$mol_assert_equal( editor.block_html( 'a' ), 'headone' )
				$mol_assert_equal( editor.block_html( ids[ 1 ] ), 'twotail' )
				// caret lands after the pasted text, in front of the old tail
				$mol_assert_equal( focused.at( -1 ), { id: ids[ 1 ], offset: 3 } )
			} finally { drop() }
		},

		'block_paste_blocks keeps the kind of the block it was pasted into'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'ab', type: 'quote' } ])
			try {
				editor.block_paste_blocks( 'a', {
					drafts: [ { type: 'heading', content: 'H', level: 1 } ],
					head: 'a',
					tail: 'b',
				} )

				$mol_assert_equal( editor.block_type( 'a' ), 'quote' )
				$mol_assert_equal( editor.block_html( 'a' ), 'aHb' )
			} finally { drop() }
		},

		'block_paste_blocks gives the tail its own block after a picture'() {

			const { editor, focused, drop } = make_editor([ { id: 'a', html: 'headtail' } ])
			try {
				editor.block_paste_blocks( 'a', {
					drafts: [ { type: 'image', content: '<img src="x.png">' } ],
					head: 'head',
					tail: 'tail',
				} )

				const ids = editor.block_ids()
				$mol_assert_equal( ids.length, 3 )
				$mol_assert_equal( editor.block_html( 'a' ), 'head' )
				$mol_assert_equal( editor.block_type( ids[ 1 ] ), 'image' )
				$mol_assert_equal( editor.block_html( ids[ 2 ] ), 'tail' )
				$mol_assert_equal( focused.at( -1 ), { id: ids[ 2 ], offset: 0 } )
			} finally { drop() }
		},

		'block_paste_blocks inline puts the draft straight into the text'() {

			const { editor, focused, drop } = make_editor([ { id: 'a', html: 'ab' } ])
			try {
				editor.block_paste_blocks( 'a', {
					drafts: [ { type: 'paragraph', content: '<b>X</b>' } ],
					head: 'a',
					tail: 'b',
					inline: true,
				} )

				$mol_assert_equal( editor.block_ids(), [ 'a' ] )
				$mol_assert_equal( editor.block_html( 'a' ), 'a<b>X</b>b' )
				$mol_assert_equal( focused.at( -1 ), { id: 'a', offset: 2 } )
			} finally { drop() }
		},

		'a whole paste is undone in one step'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'headtail' } ])
			try {
				editor.block_paste_blocks( 'a', {
					drafts: [
						{ type: 'paragraph', content: 'one' },
						{ type: 'paragraph', content: 'two' },
						{ type: 'paragraph', content: 'three' },
					],
					head: 'head',
					tail: 'tail',
				} )
				$mol_assert_equal( editor.block_ids().length, 3 )

				$mol_assert_equal( editor.history_undo(), true )
				$mol_assert_equal( editor.block_ids(), [ 'a' ] )
				$mol_assert_equal( editor.block_html( 'a' ), 'headtail' )
			} finally { drop() }
		},

		'block_paste_blocks with no drafts returns null'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'text' } ])
			try {
				$mol_assert_equal( editor.block_paste_blocks( 'a', { drafts: [] } ), null )
				$mol_assert_equal( editor.block_paste_blocks( 'a' ), null )
				$mol_assert_equal( editor.block_ids().length, 1 )
			} finally { drop() }
		},

		'block_paste_blocks seats every draft exactly once'() {

			const { editor, drop } = make_editor(
				Array.from( { length: 6 }, ( _, i )=> ({ id: 'b' + i, html: 'was ' + i }) )
			)
			try {
				const drafts = Array.from( { length: 20 }, ( _, i )=> ({
					type: 'paragraph',
					content: 'new ' + i,
				}) )

				editor.block_paste_blocks( 'b3', { drafts, head: 'was 3', tail: '' } )

				const ids = editor.block_ids()

				// The block pasted into keeps its seat and swallows the first draft
				$mol_assert_equal( ids.length, 6 + 20 - 1 )
				$mol_assert_equal( new Set( ids ).size, ids.length )
				$mol_assert_equal( ids.slice( 0, 4 ), [ 'b0', 'b1', 'b2', 'b3' ] )
				$mol_assert_equal( ids.slice( -2 ), [ 'b4', 'b5' ] )
				$mol_assert_equal( editor.block_html( 'b3' ), 'was 3new 0' )
				$mol_assert_equal(
					ids.slice( 4, -2 ).map( id => editor.block_html( id ) ),
					drafts.slice( 1 ).map( draft => draft.content ),
				)
			} finally { drop() }
		},

		/*
		 * With Giper Baza behind the page, `make_block_id` mints a pawn through
		 * `$giper_baza_list_link_to.make`, and that appends it to the block list on the spot — so
		 * a `block_ids()` read taken afterwards already names everything just minted. The paste
		 * has to seat the fresh ids itself instead of trusting an order read back after minting.
		 * This editor reproduces the side effect without a Land.
		 */
		'block_paste_blocks seats minted ids once even when minting appends them'() {

			const { editor, drop } = make_editor([
				{ id: 'a', html: 'first' },
				{ id: 'b', html: '' },
				{ id: 'c', html: 'last' },
			])
			try {
				let minted = 0
				editor.make_block_id = ()=> {
					const id = 'made' + ( ++ minted )
					editor.block_ids([ ... editor.block_ids(), id ])
					return id
				}

				editor.block_paste_blocks( 'b', { drafts: [
					{ type: 'paragraph', content: 'one' },
					{ type: 'paragraph', content: 'two' },
					{ type: 'paragraph', content: 'three' },
				] } )

				const ids = editor.block_ids()
				$mol_assert_equal( new Set( ids ).size, ids.length )
				$mol_assert_equal( ids, [ 'a', 'b', 'made1', 'made2', 'c' ] )
				$mol_assert_equal( editor.block_html( 'b' ), 'one' )
				$mol_assert_equal( editor.block_html( 'made1' ), 'two' )
				$mol_assert_equal( editor.block_html( 'made2' ), 'three' )
			} finally { drop() }
		},

		// === Clipboard end to end ===

		'pasting markdown in the middle of a block splits the article'() {

			const helper = make_editor([
				{ id: 'a', html: 'началоконец' },
				{ id: 'b', html: 'следом' },
			])
			try {
				const { editor } = helper
				const block = editor.block_view( 'a' )
				select_across( helper.node( 'a' ), 6, helper.node( 'a' ), 6 )

				block.paste_data( {
					getData: ( type: string )=> type === 'text/html' ? '' : '## Тема\n\nАбзац\n\n- пункт',
				} )

				const ids = editor.block_ids()
				$mol_assert_equal( ids.length, 4 )
				$mol_assert_equal( ids[ 0 ], 'a' )
				$mol_assert_equal( ids[ 3 ], 'b' )
				// the head keeps the kind of the block it was pasted into, the tail rides the last draft
				$mol_assert_equal( editor.block_html( 'a' ), 'началоТема' )
				$mol_assert_equal( editor.block_type( 'a' ), 'paragraph' )
				$mol_assert_equal( editor.block_html( ids[ 1 ] ), 'Абзац' )
				$mol_assert_equal( editor.block_type( ids[ 2 ] ), 'list' )
				$mol_assert_equal( editor.block_html( ids[ 2 ] ), 'пунктконец' )
			} finally { helper.drop() }
		},

		'pasting a plain line does not add blocks'() {

			const helper = make_editor([ { id: 'a', html: 'началоконец' } ])
			try {
				const { editor } = helper
				select_across( helper.node( 'a' ), 6, helper.node( 'a' ), 6 )

				editor.block_view( 'a' ).paste_data( {
					getData: ( type: string )=> type === 'text/html' ? '' : 'вставка',
				} )

				$mol_assert_equal( editor.block_ids(), [ 'a' ] )
				$mol_assert_equal( editor.block_html( 'a' ), 'началовставкаконец' )
			} finally { helper.drop() }
		},

		'a pasted article is undone by a single step'() {

			const helper = make_editor([ { id: 'a', html: '' } ])
			try {
				const { editor } = helper
				select_across( helper.node( 'a' ), 0, helper.node( 'a' ), 0 )

				editor.block_view( 'a' ).paste_data( {
					getData: ( type: string )=> type === 'text/html' ? '' : '# Раз\n\nДва\n\nТри\n\nЧетыре',
				} )
				$mol_assert_equal( editor.block_ids().length, 4 )

				$mol_assert_equal( editor.history_undo(), true )
				$mol_assert_equal( editor.block_ids(), [ 'a' ] )
				$mol_assert_equal( editor.block_html( 'a' ), '' )
				$mol_assert_equal( editor.history_redo(), true )
				$mol_assert_equal( editor.block_ids().length, 4 )
			} finally { helper.drop() }
		},

		'block_paste_blocks is refused in readonly mode'() {

			const { editor, drop } = make_editor([ { id: 'a', html: 'text' } ])
			try {
				editor.readonly = ()=> true
				$mol_assert_equal(
					editor.block_paste_blocks( 'a', { drafts: [ { type: 'paragraph', content: 'x' } ] } ),
					null,
				)
				$mol_assert_equal( editor.block_html( 'a' ), 'text' )
			} finally { drop() }
		},

	})

}
