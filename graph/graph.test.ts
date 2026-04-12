namespace $.$$ {

	$mol_test({

		'nodes returns array with x/y from pages'() {

			const graph = new $bog_wysiwyg_graph()
			graph.pages = () => [
				{ id: () => 'p1', title: () => 'Page One' },
				{ id: () => 'p2', title: () => 'Page Two' },
			] as any

			const nodes = graph.nodes()
			$mol_assert_equal( nodes.length, 2 )
			$mol_assert_equal( nodes[ 0 ].id, 'p1' )
			$mol_assert_equal( nodes[ 0 ].title, 'Page One' )
			$mol_assert_ok( typeof nodes[ 0 ].x === 'number' )
			$mol_assert_ok( typeof nodes[ 0 ].y === 'number' )
			$mol_assert_ok( typeof nodes[ 1 ].x === 'number' )
			$mol_assert_ok( typeof nodes[ 1 ].y === 'number' )
		},

		'nodes uses id prefix when title is empty'() {

			const graph = new $bog_wysiwyg_graph()
			graph.pages = () => [
				{ id: () => 'abcdefghij', title: () => '' },
			] as any

			const nodes = graph.nodes()
			$mol_assert_equal( nodes[ 0 ].title, 'abcdefgh' )
		},

		'edges extracts wiki links from block content'() {

			const graph = new $bog_wysiwyg_graph()
			graph.pages = () => [
				{
					id: () => 'p1',
					title: () => 'Page 1',
					block_ids: () => [ 'b1' ],
					block_html: ( id: string ) => 'Link to [[p2]] here',
				},
				{
					id: () => 'p2',
					title: () => 'Page 2',
					block_ids: () => [ 'b2' ],
					block_html: ( id: string ) => 'no links',
				},
			] as any

			const edges = graph.edges()
			$mol_assert_equal( edges.length, 1 )
			$mol_assert_equal( edges[ 0 ].source, 'p1' )
			$mol_assert_equal( edges[ 0 ].target, 'p2' )
		},

		'edges ignores links to nonexistent pages'() {

			const graph = new $bog_wysiwyg_graph()
			graph.pages = () => [
				{
					id: () => 'p1',
					title: () => 'Page 1',
					block_ids: () => [ 'b1' ],
					block_html: ( id: string ) => 'Link to [[nonexistent]]',
				},
			] as any

			const edges = graph.edges()
			$mol_assert_equal( edges.length, 0 )
		},

		'edges deduplicates multiple links to same target'() {

			const graph = new $bog_wysiwyg_graph()
			graph.pages = () => [
				{
					id: () => 'p1',
					title: () => 'Page 1',
					block_ids: () => [ 'b1', 'b2' ],
					block_html: ( id: string ) => '[[p2]] mentioned again [[p2]]',
				},
				{
					id: () => 'p2',
					title: () => 'Page 2',
					block_ids: () => [],
					block_html: ( id: string ) => '',
				},
			] as any

			const edges = graph.edges()
			$mol_assert_equal( edges.length, 1 )
		},

		'edges ignores self-links'() {

			const graph = new $bog_wysiwyg_graph()
			graph.pages = () => [
				{
					id: () => 'p1',
					title: () => 'Page 1',
					block_ids: () => [ 'b1' ],
					block_html: ( id: string ) => '[[p1]] self-ref',
				},
			] as any

			const edges = graph.edges()
			$mol_assert_equal( edges.length, 0 )
		},

		'empty graph works without errors'() {

			const graph = new $bog_wysiwyg_graph()
			graph.pages = () => [] as any

			const nodes = graph.nodes()
			const edges = graph.edges()

			$mol_assert_equal( nodes.length, 0 )
			$mol_assert_equal( edges.length, 0 )
		},

		'sim_nodes creates independent copies'() {

			const graph = new $bog_wysiwyg_graph()
			graph.pages = () => [
				{ id: () => 'p1', title: () => 'A' },
			] as any

			const sim = graph.sim_nodes()
			const orig = graph.nodes()
			sim[ 0 ].x = 999

			$mol_assert_ok( orig[ 0 ].x !== 999 )
		},

		'node_at finds node within radius'() {

			const graph = new $bog_wysiwyg_graph()
			graph.pages = () => [
				{ id: () => 'p1', title: () => 'A' },
			] as any

			const sim = graph.sim_nodes()
			sim[ 0 ].x = 100
			sim[ 0 ].y = 100

			const found = graph.node_at( 105, 105 )
			$mol_assert_ok( found !== null )
			$mol_assert_equal( found!.id, 'p1' )
		},

		'node_at returns null when nothing nearby'() {

			const graph = new $bog_wysiwyg_graph()
			graph.pages = () => [
				{ id: () => 'p1', title: () => 'A' },
			] as any

			const sim = graph.sim_nodes()
			sim[ 0 ].x = 100
			sim[ 0 ].y = 100

			const found = graph.node_at( 500, 500 )
			$mol_assert_equal( found, null )
		},

	})

}
