namespace $.$$ {

	/**
	 * Editor bound to a Land, with the DOM focus dropped.
	 *
	 * `focus_block` defers to `setTimeout` and walks the rendered tree, so it never lands
	 * inside the measured window anyway. Everything else is the real `$bog_wysiwyg`.
	 */
	export class $bog_wysiwyg_bench_editor extends $bog_wysiwyg {

		land_link = ''

		override page_land_link() {
			return this.land_link
		}

		focus_last = ''

		override focus_block( id: string, offset?: number ) {
			this.focus_last = id
		}

	}

	/** One measured operation over one document size. */
	export type $bog_wysiwyg_bench_row = {
		size: number,
		chars: number,
		op: string,
		runs: number,
		med: number,
		max: number,
		/** Median count of Units posted to the Land by one run. -1 when not counted. */
		posts: number,
	}

	/**
	 * Where the block editor stops feeling instant.
	 *
	 * Runs by hand only: `node bog/wysiwyg/bench/run.mjs`. Never from a test — see `readme.md`.
	 */
	export class $bog_wysiwyg_bench extends $mol_object2 {

		/** Plain characters per block. A paragraph of an article, roughly. */
		static chars = 200

		static sizes = [ 50, 100, 200, 300, 500 ]

		static rows = [] as $bog_wysiwyg_bench_row[]

		// === Harness ===

		/**
		 * Independent Glob / Yard / Auth, and a Land with neither storage nor network.
		 *
		 * `land_grab` mints a King key, and minting one is Proof of Work over a Promise — the one
		 * thing that must never happen on a measured path. So a ready key is put into `embryos`
		 * and `$giper_baza_auth.grab()` takes it from there.
		 */
		static isolate() {
			const king = $giper_baza_crdtbench.auth_next()
			const $$ = $giper_baza_crdtbench.isolate( $giper_baza_crdtbench.auth_next() )
			$$.$giper_baza_auth.embryos = [ king.toString() + king.toStringPrivate() ]
			return $$
		}

		/**
		 * Every `@$mol_action` on the write path is a one-shot fiber, and $mol defers their
		 * destruction to the next tick. The bench never yields to the event loop, so the queue
		 * would grow through the whole run. Draining it inline is what the runtime does anyway.
		 */
		static reap() {

			const fibers = $mol_wire_fiber.reaping
			if( !fibers.size ) return

			$mol_wire_fiber.reaping = new Set

			for( const fiber of fibers ) {
				if( !( fiber instanceof $mol_wire_task ) ) continue
				if( !fiber.sub_empty ) continue
				fiber.destructor()
			}

		}

		static text( seed: number, length = this.chars ) {
			const words = [
				'редактор', 'блок', 'страница', 'текст', 'база', 'синхронизация', 'курсор',
				'абзац', 'заголовок', 'ссылка', 'история', 'правка', 'документ', 'список',
			]
			let out = ''
			let i = seed
			while( out.length < length ) {
				out += ( out ? ' ' : '' ) + words[ i ++ % words.length ]
			}
			return out.slice( 0, length )
		}

		static event() {
			return new this.$.$mol_dom_context.Event( 'input' )
		}

		// === Document under test ===

		/** Land with `size` paragraph blocks, plus an editor already looking at it. */
		static build( size: number ) {

			const $$ = this.isolate()
			const land = $$.$giper_baza_glob.land_grab(
				[ [ null, $giper_baza_rank_post( 'just' ) ] ]
			) as unknown as $giper_baza_crdtbench_land
			const page = land.Data( $bog_wysiwyg_model_page )
			const list = page.Blocks( 'auto' )!

			for( let i = 0; i < size; ++ i ) {
				const block = list.make( null )
				$bog_wysiwyg_pawn_text( block.Type( 'auto' ), 'paragraph' )
				block.Content( 'auto' )!.val( this.text( i ) )
				if( i % 32 === 0 ) this.reap()
			}

			land.fresh_units = []
			this.reap()

			const editor = $bog_wysiwyg_bench_editor.create( editor => {
				editor.$ = $$
				editor.land_link = land.link().str
			} )

			// Warm the list up: the first read is the "open the page" cost, measured on its own.
			editor.block_ids()

			return { $$, land, editor }
		}

		// === Measuring ===

		/**
		 * `land` is optional and only used to count Units: every local `post` lands in
		 * `fresh_units`, and nothing here ever flushes them, so the length is the post count
		 * of one operation. It is the number that tells a rewritten list from a single edit.
		 */
		static measure(
			size: number,
			op: string,
			runs: number,
			task: ( i: number )=> void,
			land?: $giper_baza_crdtbench_land,
		) {

			const durs = [] as number[]
			const posts = [] as number[]

			for( let i = 0; i < runs; ++ i ) {
				if( land ) land.fresh_units = []
				const start = performance.now()
				task( i )
				durs.push( performance.now() - start )
				if( land ) posts.push( land.fresh_units.length )
				this.reap()
			}

			const sorted = [ ... durs ].sort( ( a, b )=> a - b )
			const row = {
				size,
				chars: size * this.chars,
				op,
				runs,
				med: sorted[ sorted.length >> 1 ],
				max: sorted[ sorted.length - 1 ],
				posts: posts.length ? posts.sort( ( a, b )=> a - b )[ posts.length >> 1 ] : -1,
			}

			this.rows.push( row )
			this.print_row( row )

			return row
		}

		// === Scenarios ===

		/**
		 * Opening a saved page: a fresh editor over an already filled Land reads the block order
		 * and then every block body, which is what the first render asks for.
		 */
		static probe_open( size: number ) {

			const donor = this.build( size )
			const link = donor.land.link()

			// A second Peer, with an empty Glob, taking the whole Land over: the cold state.
			const $$ = this.isolate()
			const land = $$.$giper_baza_glob.Land( link ) as unknown as $giper_baza_crdtbench_land

			this.measure( size, 'load units', 1, ()=> {
				land.units_steal( donor.land )
			} )

			const editor = $bog_wysiwyg_bench_editor.create( editor => {
				editor.$ = $$
				editor.land_link = link.str
			} )

			this.measure( size, 'open page', 1, ()=> {
				for( const id of editor.block_ids() ) {
					editor.block_html( id )
					editor.block_type( id )
				}
			} )

		}

		/** One character into a block at the head / middle / tail of the document. */
		static probe_typing( size: number ) {

			const { editor, land } = this.build( size )
			const ids = editor.block_ids()

			const spots = [
				[ 'type first', ids[ 0 ] ],
				[ 'type middle', ids[ ids.length >> 1 ] ],
				[ 'type last', ids[ ids.length - 1 ] ],
			] as const

			for( const [ op, id ] of spots ) {

				let html = editor.block_html( id )

				this.measure( size, op, 40, ()=> {
					html += 'x'
					editor.block_html( id, html )
					editor.block_input( id, this.event() )
				}, land )

				editor.history_cancel()

			}

			// The undo snapshot the debounce fires 500 ms after the burst stops.
			const id = ids[ ids.length >> 1 ]
			let html = editor.block_html( id )

			this.measure( size, 'undo snapshot', 10, ()=> {
				html += 'y'
				editor.block_html( id, html )
				editor.history_record()
			}, land )

		}

		/** Enter at the end of a block: a fresh block is spliced in after it. */
		static probe_enter( size: number ) {

			for( const [ op, at ] of [ [ 'enter at end', 1 ], [ 'enter in middle', 0.5 ] ] as const ) {

				const { editor, land } = this.build( size )

				this.measure( size, op, 10, ()=> {
					const ids = editor.block_ids()
					const index = Math.min( ids.length - 1, Math.floor( ids.length * at ) )
					editor.block_enter( ids[ index ], this.event() )
				}, land )

				// Same op with the undo stack switched off, to split Baza from bookkeeping.
				const bare = this.build( size )
				bare.editor.history_locked = true

				this.measure( size, op + ' (no undo)', 10, ()=> {
					const ids = bare.editor.block_ids()
					const index = Math.min( ids.length - 1, Math.floor( ids.length * at ) )
					bare.editor.block_enter( ids[ index ], this.event() )
				}, bare.land )

			}

		}

		/** Backspace on an empty block in the middle: the block goes away. */
		static probe_remove( size: number ) {

			const { editor, land } = this.build( size )

			this.measure( size, 'remove middle', 10, ()=> {
				const ids = editor.block_ids()
				editor.block_remove( ids[ ids.length >> 1 ], this.event() )
			}, land )

			const bare = this.build( size )
			bare.editor.history_locked = true

			this.measure( size, 'remove middle (no undo)', 10, ()=> {
				const ids = bare.editor.block_ids()
				bare.editor.block_remove( ids[ ids.length >> 1 ], this.event() )
			}, bare.land )

		}

		/** Twenty paragraphs from the clipboard, dropped into the middle of the page. */
		static probe_paste( size: number ) {

			const { editor, land } = this.build( size )

			const drafts = Array.from( { length: 20 }, ( _, i )=> ( {
				type: 'paragraph',
				content: this.text( i + 100 ),
			} ) )

			this.measure( size, 'paste 20 blocks', 5, ()=> {
				const ids = editor.block_ids()
				editor.block_paste_blocks( ids[ ids.length >> 1 ], { drafts, head: '', tail: '' } )
			}, land )

			// A paste that lands duplicates would read as flat units here, because reconciliation
			// finds the fresh links already sitting in the tail and never rewrites it. So the row
			// growing with the document is also the check that the order came out right.
			const ids = editor.block_ids()
			if( new Set( ids ).size !== ids.length ) {
				$mol_fail( new Error( 'Paste left duplicated blocks in the page order' ) )
			}

		}

		/**
		 * Writing a longread from scratch: type a paragraph, press Enter, repeat.
		 *
		 * This is the only probe where the document grows under its own edits, so it is the one
		 * that shows accumulation — both the Sands piling up in the Land and the undo stack.
		 */
		static probe_write( paragraphs: number, step: number ) {

			const { editor, land } = this.build( 1 )

			this.print_line(
				'blocks'.padStart( 6 ),
				'chars'.padStart( 7 ),
				'ms/char'.padStart( 10 ),
				'ms/enter'.padStart( 10 ),
				'units'.padStart( 7 ),
			)

			let typing = 0
			let entering = 0
			let posted = 0

			for( let p = 0; p < paragraphs; ++ p ) {

				const ids = editor.block_ids()
				const id = ids[ ids.length - 1 ]
				const text = this.text( p )

				land.fresh_units = []

				let html = ''
				let start = performance.now()

				for( const char of text ) {
					html += char
					editor.block_html( id, html )
					editor.block_input( id, this.event() )
				}

				typing += performance.now() - start

				// The debounce fires once the burst is over.
				editor.history_cancel()
				start = performance.now()
				editor.history_record()
				editor.block_enter( id, this.event() )
				entering += performance.now() - start

				posted += land.fresh_units.length
				this.reap()

				if( ( p + 1 ) % step ) continue

				const blocks = editor.block_ids().length

				this.print_line(
					String( blocks ).padStart( 6 ),
					String( blocks * this.chars ).padStart( 7 ),
					( typing / ( step * this.chars ) ).toFixed( 3 ).padStart( 10 ),
					( entering / step ).toFixed( 1 ).padStart( 10 ),
					String( Math.round( posted / step ) ).padStart( 7 ),
				)

				typing = 0
				entering = 0
				posted = 0

			}

		}

		/**
		 * Revising a finished article: go back into the middle and split a block there, over and
		 * over. Every split rewrites the tail of the block list, so this is where the Land grows
		 * fastest and where `sand_ordered` has the most Sands to walk.
		 */
		static probe_revise( size: number, edits: number, step: number ) {

			const { editor, land } = this.build( size )

			this.print_line(
				'edits'.padStart( 6 ),
				'blocks'.padStart( 7 ),
				'ms/edit'.padStart( 10 ),
				'units'.padStart( 7 ),
			)

			let dur = 0
			let posted = 0

			for( let e = 0; e < edits; ++ e ) {

				const ids = editor.block_ids()
				const id = ids[ ids.length >> 1 ]

				land.fresh_units = []
				const start = performance.now()
				editor.block_enter( id, this.event() )
				dur += performance.now() - start

				posted += land.fresh_units.length
				this.reap()

				if( ( e + 1 ) % step ) continue

				this.print_line(
					String( e + 1 ).padStart( 6 ),
					String( editor.block_ids().length ).padStart( 7 ),
					( dur / step ).toFixed( 1 ).padStart( 10 ),
					String( Math.round( posted / step ) ).padStart( 7 ),
				)

				dur = 0
				posted = 0

			}

		}

		/**
		 * Does a single block get slower as its own edit count grows?
		 *
		 * The body of a block is `$giper_baza_atom_text`, a solo register: every write reuses the
		 * same Self, so the old Sand is replaced instead of piling up. This is the probe that tells
		 * the editor apart from the `sand_ordered` result, where a text is a list of Sands.
		 */
		static probe_atom_growth() {

			const { editor } = this.build( 20 )
			const id = editor.block_ids()[ 10 ]

			let html = editor.block_html( id )
			let edits = 0

			for( const chunk of [ 100, 150, 250, 500, 1000 ] ) {

				const start = performance.now()

				for( let i = 0; i < chunk; ++ i ) {
					html += 'x'
					editor.block_html( id, html )
					++ edits
					if( edits % 64 === 0 ) this.reap()
				}

				const dur = performance.now() - start

				this.print_line(
					String( edits ).padStart( 6 ),
					( dur.toFixed( 0 ) + ' ms' ).padStart( 10 ),
					( dur / chunk ).toFixed( 3 ).padStart( 10 ),
				)

				this.reap()

			}

		}

		// === Report ===

		static print_line( ... cells: string[] ) {
			console.log( cells.join( '  ' ) )
		}

		static print_head() {
			this.print_line(
				'blocks'.padStart( 6 ),
				'chars'.padStart( 7 ),
				'operation'.padEnd( 24 ),
				'median ms'.padStart( 10 ),
				'max ms'.padStart( 8 ),
				'units'.padStart( 6 ),
			)
		}

		static print_row( row: $bog_wysiwyg_bench_row ) {
			this.print_line(
				String( row.size ).padStart( 6 ),
				String( row.chars ).padStart( 7 ),
				row.op.padEnd( 24 ),
				row.med.toFixed( 1 ).padStart( 10 ),
				row.max.toFixed( 1 ).padStart( 8 ),
				( row.posts < 0 ? '-' : String( row.posts ) ).padStart( 6 ),
			)
		}

		static run() {

			console.log( '\n=== One block body, growing edit count ===\n' )
			this.print_line( 'edits'.padStart( 6 ), 'total'.padStart( 10 ), 'ms/edit'.padStart( 10 ) )
			this.probe_atom_growth()

			console.log( '\n=== Document operations ===\n' )
			this.print_head()

			for( const size of this.sizes ) {
				this.probe_open( size )
				this.probe_typing( size )
				this.probe_enter( size )
				this.probe_remove( size )
				this.probe_paste( size )
				console.log( '' )
			}

			console.log( '\n=== Writing a longread from scratch ===\n' )
			this.probe_write( 300, 25 )

			console.log( '\n=== Revising the middle of a 200 block article ===\n' )
			this.probe_revise( 200, 300, 25 )

			return this.rows
		}

	}

}
