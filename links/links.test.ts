namespace $.$$ {

	$mol_test({

		'backlink_pages finds pages that reference target'() {

			const links = new $bog_wysiwyg_links()
			links.page_id = () => 'page_abc'
			links.all_pages = () => [
				{ id: 'page_1', title: 'First', blocks_html: [ 'see [[page_abc]] for details' ] },
				{ id: 'page_2', title: 'Second', blocks_html: [ 'no links here' ] },
				{ id: 'page_3', title: 'Third', blocks_html: [ 'also [[page_abc]]' ] },
			]

			const result = links.backlink_pages()
			$mol_assert_equal( result.length, 2 )
			$mol_assert_equal( result[ 0 ].id, 'page_1' )
			$mol_assert_equal( result[ 1 ].id, 'page_3' )
		},

		'backlink_pages excludes self-reference'() {

			const links = new $bog_wysiwyg_links()
			links.page_id = () => 'page_abc'
			links.all_pages = () => [
				{ id: 'page_abc', title: 'Self', blocks_html: [ 'ref [[page_abc]]' ] },
				{ id: 'page_2', title: 'Other', blocks_html: [ 'link to [[page_abc]]' ] },
			]

			const result = links.backlink_pages()
			$mol_assert_equal( result.length, 1 )
			$mol_assert_equal( result[ 0 ].id, 'page_2' )
		},

		'backlink_pages returns empty when no references'() {

			const links = new $bog_wysiwyg_links()
			links.page_id = () => 'page_abc'
			links.all_pages = () => [
				{ id: 'page_1', title: 'First', blocks_html: [ 'nothing here' ] },
			]

			const result = links.backlink_pages()
			$mol_assert_equal( result.length, 0 )
		},

		'backlink_pages returns empty when page_id is empty'() {

			const links = new $bog_wysiwyg_links()
			links.page_id = () => ''
			links.all_pages = () => [
				{ id: 'page_1', title: 'First', blocks_html: [ '[[page_abc]]' ] },
			]

			const result = links.backlink_pages()
			$mol_assert_equal( result.length, 0 )
		},

		'link_title returns page title'() {

			const links = new $bog_wysiwyg_links()
			links.page_id = () => 'target'
			links.all_pages = () => [
				{ id: 'page_1', title: 'My Page', blocks_html: [ '[[target]]' ] },
			]

			$mol_assert_equal( links.link_title( 'page_1' ), 'My Page' )
		},

		'link_title falls back to id when not found'() {

			const links = new $bog_wysiwyg_links()
			links.page_id = () => 'target'
			links.all_pages = () => []

			$mol_assert_equal( links.link_title( 'unknown' ), 'unknown' )
		},

	})

}
