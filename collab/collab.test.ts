namespace $.$$ {

	$mol_test({

		'sync_status returns offline when no page_land_link'() {

			const collab = new $bog_wysiwyg_collab()
			$mol_assert_equal( collab.sync_status(), 'offline' )
		},

		'sync_label returns empty circle when offline'() {

			const collab = new $bog_wysiwyg_collab()
			$mol_assert_equal( collab.sync_label(), '\u25CB' )
		},

		'peer_ids returns empty array when no baza'() {

			const collab = new $bog_wysiwyg_collab()
			$mol_assert_equal( collab.peer_ids().length, 0 )
		},

		'peer_views returns empty array when no baza'() {

			const collab = new $bog_wysiwyg_collab()
			$mol_assert_equal( collab.peer_views().length, 0 )
		},

		'peer_short returns first 4 chars of id'() {

			const collab = new $bog_wysiwyg_collab()
			$mol_assert_equal( collab.peer_short( 'abcdefgh' ), 'abcd' )
		},

		'peer_short handles short id'() {

			const collab = new $bog_wysiwyg_collab()
			$mol_assert_equal( collab.peer_short( 'ab' ), 'ab' )
		},

		'peer_title returns full id'() {

			const collab = new $bog_wysiwyg_collab()
			$mol_assert_equal( collab.peer_title( 'abcdefgh12345678' ), 'abcdefgh12345678' )
		},

		'page_land returns null when page_land_link is empty'() {

			const collab = new $bog_wysiwyg_collab()
			$mol_assert_equal( collab.page_land(), null )
		},

	})

}
