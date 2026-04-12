namespace $.$$ {

	$mol_test({

		'AI commands returns array of commands'() {

			const ai = new $bog_wysiwyg_ai()
			const cmds = ai.commands()

			$mol_assert_ok( cmds.length >= 4 )
			$mol_assert_equal( cmds[ 0 ].id, 'continue' )
			$mol_assert_ok( cmds[ 0 ].prompt.length > 0 )
			$mol_assert_ok( cmds[ 0 ].title.length > 0 )
		},

		'AI option_rows returns buttons for each command'() {

			const ai = new $bog_wysiwyg_ai()
			ai.loading( false )
			const rows = ai.option_rows()

			$mol_assert_equal( rows.length, ai.commands().length )
		},

		'AI option_rows shows loading when loading is true'() {

			const ai = new $bog_wysiwyg_ai()
			ai.loading( true )
			const rows = ai.option_rows()

			$mol_assert_equal( rows.length, 1 )
		},

		'AI option_active returns true for current index'() {

			const ai = new $bog_wysiwyg_ai()
			ai.index( 0 )

			const first_id = ai.commands()[ 0 ].id
			$mol_assert_equal( ai.option_active( first_id ), true )
			$mol_assert_equal( ai.option_active( 'nonexistent' ), false )
		},

		'AI option_active tracks index changes'() {

			const ai = new $bog_wysiwyg_ai()
			ai.index( 2 )

			const cmd = ai.commands()[ 2 ]
			$mol_assert_equal( ai.option_active( cmd.id ), true )
			$mol_assert_equal( ai.option_active( ai.commands()[ 0 ].id ), false )
		},

		'AI option_click without event returns null'() {

			const ai = new $bog_wysiwyg_ai()
			$mol_assert_equal( ai.option_click( 'continue' ), null )
		},

		'AI pos_y_str returns pixel string'() {

			const ai = new $bog_wysiwyg_ai()
			ai.pos_y( 123 )
			$mol_assert_equal( ai.pos_y_str(), '123px' )
		},

		'AI pos_x_str returns pixel string'() {

			const ai = new $bog_wysiwyg_ai()
			ai.pos_x( 456 )
			$mol_assert_equal( ai.pos_x_str(), '456px' )
		},

		// === AI integration in wysiwyg ===

		'block_ai opens AI menu and sets context'() {

			const editor = new $bog_wysiwyg()
			editor.block_ids( [ 'b1' ] )
			editor.ai_showed( false )

			const fake_rect = { bottom: 100, left: 50, top: 0 } as DOMRect
			editor.Block = ( id: any ) => {
				const block = new $bog_wysiwyg_block()
				block.dom_node = () => {
					const el = { getBoundingClientRect: () => fake_rect, textContent: 'hello world' } as any
					return el
				}
				return block
			}
			editor.dom_node = () => ({ getBoundingClientRect: () => ({ top: 0, left: 0 } as DOMRect) } as any)

			const event = new KeyboardEvent( 'keydown', { key: 'j', ctrlKey: true } )
			editor.block_ai( 'b1', event )

			$mol_assert_equal( editor.ai_showed(), true )
			$mol_assert_equal( editor.ai_context(), 'hello world' )
			$mol_assert_equal( editor.ai_index(), 0 )
			$mol_assert_equal( editor.active_block_id(), 'b1' )
		},

		'block_ai without event returns null'() {

			const editor = new $bog_wysiwyg()
			$mol_assert_equal( editor.block_ai( 'b1' ), null )
		},

		'block_ai_key Escape closes AI menu'() {

			const editor = new $bog_wysiwyg()
			editor.ai_showed( true )

			const event = new KeyboardEvent( 'keydown', { key: 'Escape' } )
			editor.block_ai_key( 'test', event )

			$mol_assert_equal( editor.ai_showed(), false )
		},

		'block_ai_key ArrowDown increments ai_index'() {

			const editor = new $bog_wysiwyg()
			editor.ai_index( 0 )

			const event = new KeyboardEvent( 'keydown', { key: 'ArrowDown' } )
			editor.block_ai_key( 'test', event )

			$mol_assert_equal( editor.ai_index(), 1 )
		},

		'block_ai_key ArrowUp decrements ai_index'() {

			const editor = new $bog_wysiwyg()
			editor.ai_index( 2 )

			const event = new KeyboardEvent( 'keydown', { key: 'ArrowUp' } )
			editor.block_ai_key( 'test', event )

			$mol_assert_equal( editor.ai_index(), 1 )
		},

		'block_ai_key ArrowUp does not go below zero'() {

			const editor = new $bog_wysiwyg()
			editor.ai_index( 0 )

			const event = new KeyboardEvent( 'keydown', { key: 'ArrowUp' } )
			editor.block_ai_key( 'test', event )

			$mol_assert_equal( editor.ai_index(), 0 )
		},

		'block_ai_key Enter triggers ai_picked and run_command'() {

			const editor = new $bog_wysiwyg()
			editor.ai_index( 1 )

			let picked_val = ''
			editor.ai_picked = ( next?: string ) => {
				if( next !== undefined ) picked_val = next
				return picked_val
			}

			let run_id = ''
			const ai = editor.Ai() as $bog_wysiwyg_ai
			ai.run_command = ( id: string ) => { run_id = id }

			const event = new KeyboardEvent( 'keydown', { key: 'Enter' } )
			editor.block_ai_key( 'test', event )

			const expected_id = ai.commands()[ 1 ].id
			$mol_assert_equal( picked_val, expected_id )
			$mol_assert_equal( run_id, expected_id )
		},

		'block_ai_key without event returns null'() {

			const editor = new $bog_wysiwyg()
			$mol_assert_equal( editor.block_ai_key( 'test' ), null )
		},

		'ai_result with continue appends text'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.block_html( 'b1', 'Hello' )
			editor.ai_picked( 'continue' )
			editor.focus_block = () => {}

			editor.ai_result( 'world' )

			$mol_assert_equal( editor.block_html( 'b1' ), 'Hello world' )
		},

		'ai_result with rewrite replaces text'() {

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.block_html( 'b1', 'Old text' )
			editor.ai_picked( 'rewrite' )
			editor.focus_block = () => {}

			editor.ai_result( 'New text' )

			$mol_assert_equal( editor.block_html( 'b1' ), 'New text' )
		},

		'ai_result without text returns null'() {

			const editor = new $bog_wysiwyg()
			$mol_assert_equal( editor.ai_result(), null )
		},

		'ai_result without active block still returns text'() {

			const editor = new $bog_wysiwyg()
			editor.focus_block = () => {}
			const result = editor.ai_result( 'some text' )

			$mol_assert_equal( result, 'some text' )
		},

	})

}
