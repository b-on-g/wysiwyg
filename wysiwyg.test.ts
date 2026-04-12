namespace $.$$ {

	$mol_test({

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

		'menu_picked with image prompts for URL'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			const original_prompt = globalThis.prompt
			globalThis.prompt = () => 'https://example.com/img.png'

			editor.menu_picked( 'image' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'image' )
			$mol_assert_ok( editor.block_html( 'b1' ).includes( 'https://example.com/img.png' ) )
			$mol_assert_equal( editor.menu_showed(), false )

			globalThis.prompt = original_prompt
		},

		'menu_picked with image cancelled prompt keeps paragraph'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.menu_showed( true )
			editor.focus_block = () => {}

			const original_prompt = globalThis.prompt
			globalThis.prompt = () => null

			editor.menu_picked( 'image' )

			$mol_assert_equal( editor.block_type( 'b1' ), 'paragraph' )
			$mol_assert_equal( editor.menu_showed(), false )

			globalThis.prompt = original_prompt
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

		'block_paste_blocks replaces current and inserts new blocks'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b' ] )
			editor.focus_block = () => {}

			editor.block_paste_blocks( 'a', [
				{ type: 'heading', content: 'Title', level: 1 },
				{ type: 'paragraph', content: 'text' },
				{ type: 'code', content: 'x = 1' },
			] )

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
		},

		'block_paste_blocks with single block replaces current only'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a', 'b' ] )
			editor.focus_block = () => {}

			editor.block_paste_blocks( 'a', [
				{ type: 'quote', content: 'quoted' },
			] )

			$mol_assert_equal( editor.block_ids().length, 2 )
			$mol_assert_equal( editor.block_type( 'a' ), 'quote' )
			$mol_assert_equal( editor.block_html( 'a' ), 'quoted' )
		},

		'block_paste_blocks with empty array returns null'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a' ] )

			$mol_assert_equal( editor.block_paste_blocks( 'a', [] ), null )
			$mol_assert_equal( editor.block_ids().length, 1 )
		},

		'block_paste_blocks without val returns null'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'a' ] )

			$mol_assert_equal( editor.block_paste_blocks( 'a' ), null )
		},

	})

}
