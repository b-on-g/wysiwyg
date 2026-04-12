namespace $.$$ {

	$mol_test({

		'comment panel toggles open and closed'() {

			const comment = new $bog_wysiwyg_comment()
			$mol_assert_equal( comment.panel_open(), false )

			const event = new Event( 'click' )
			comment.toggle( event )
			$mol_assert_equal( comment.panel_open(), true )

			comment.toggle( event )
			$mol_assert_equal( comment.panel_open(), false )
		},

		'close button closes panel'() {

			const comment = new $bog_wysiwyg_comment()
			comment.panel_open( true )
			$mol_assert_equal( comment.panel_open(), true )

			const event = new Event( 'click' )
			comment.close( event )
			$mol_assert_equal( comment.panel_open(), false )
		},

		'toggle without event returns null'() {

			const comment = new $bog_wysiwyg_comment()
			$mol_assert_equal( comment.toggle(), null )
		},

		'close without event returns null'() {

			const comment = new $bog_wysiwyg_comment()
			$mol_assert_equal( comment.close(), null )
		},

		'comment count text is empty when no comments'() {

			const comment = new $bog_wysiwyg_comment()
			// Thread has no comment_land_link, so comment_count is 0
			$mol_assert_equal( comment.comment_count_text(), '' )
		},

		'thread draft stores text'() {

			const thread = new $bog_wysiwyg_comment_thread()
			$mol_assert_equal( thread.draft(), '' )

			thread.draft( 'hello' )
			$mol_assert_equal( thread.draft(), 'hello' )
		},

		'thread comment_count is 0 without baza'() {

			const thread = new $bog_wysiwyg_comment_thread()
			$mol_assert_equal( thread.comment_count(), 0 )
		},

		'block_comment_open defaults to false'() {

			const editor = new $bog_wysiwyg()
			$mol_assert_equal( editor.block_comment_open( 'b1' ), false )
		},

		'block_comment_open can be toggled'() {

			const editor = new $bog_wysiwyg()
			editor.block_comment_open( 'b1', true )
			$mol_assert_equal( editor.block_comment_open( 'b1' ), true )

			editor.block_comment_open( 'b1', false )
			$mol_assert_equal( editor.block_comment_open( 'b1' ), false )
		},

		'block_comment_land_link returns empty without baza'() {

			const editor = new $bog_wysiwyg()
			$mol_assert_equal( editor.block_comment_land_link( 'b1' ), '' )
		},

	})

}
