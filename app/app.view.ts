namespace $.$$ {

	/** Registry land stores a list of page land links */
	const Registry = $giper_baza_list_link

	export class $bog_wysiwyg_app extends $.$bog_wysiwyg_app {

		/** Current page land link from URL */
		@ $mol_mem
		override page_land_link( next?: string ) {
			if( next !== undefined ) {
				this.$.$mol_state_arg.value( 'page', next || null )
				return next
			}
			return this.$.$mol_state_arg.value( 'page' ) ?? ''
		}

		/** Registry land link from URL or auto-created */
		@ $mol_mem
		registry_land_link( next?: string ) {
			if( next !== undefined ) {
				this.$.$mol_state_arg.value( 'registry', next || null )
				return next
			}
			return this.$.$mol_state_arg.value( 'registry' ) ?? ''
		}

		/** Registry land (stores list of page links). Do NOT put @$mol_mem on land access. */
		registry_land() {
			const link = this.registry_land_link()
			if( !link ) return null
			return this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
		}

		/** Page list from registry. Do NOT put @$mol_mem on pawn access. */
		registry_list() {
			const land = this.registry_land()
			if( !land ) return null
			return land.Data( Registry )
		}

		/** Create registry land if none exists, return registry list */
		@ $mol_action
		registry_ensure() {
			let list = this.registry_list()
			if( list ) return list
			const land = this.$.$giper_baza_glob.land_grab(
				[[ null, $giper_baza_rank_post( 'just' ) ]]
			)
			this.registry_land_link( land.link().str )
			return land.Data( Registry )
		}

		/** All page land link strings from registry */
		@ $mol_mem
		page_links(): readonly string[] {
			const list = this.registry_list()
			if( !list ) return []
			const items = list.items_vary() ?? []
			return items
				.map( v => $giper_baza_vary_cast_link( v ) )
				.filter( $mol_guard_defined )
				.map( link => link.str )
		}

		/** Read page title from a land link */
		page_title_by_link( link: string ): string {
			const land = this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
			const data = land.Data( $bog_wysiwyg_model_page )
			return data.Title()?.val() ?? ''
		}

		/** Read block IDs from a page land */
		page_block_ids( link: string ): readonly string[] {
			const land = this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
			const data = land.Data( $bog_wysiwyg_model_page )
			const blocks = data.Blocks()
			if( !blocks ) return []
			return blocks.remote_list().map( ( b: $giper_baza_pawn ) => b.link().str )
		}

		/** Read block HTML content */
		page_block_html( link: string, block_link: string ): string {
			const block = this.$.$giper_baza_glob.Pawn(
				new $giper_baza_link( block_link ),
				$bog_wysiwyg_model_block,
			)
			return block.Content()?.val() ?? ''
		}

		/** All pages info for backlinks — array of {id, title, blocks_html} */
		@ $mol_mem
		override all_pages_info() {
			return this.page_links().map( link => ({
				id: link,
				title: this.page_title_by_link( link ),
				blocks_html: this.page_block_ids( link ).map(
					bid => this.page_block_html( link, bid )
				),
			}) )
		}

		/** Page rows for sidebar */
		@ $mol_mem
		override page_rows() {
			return this.page_links().map( ( link, i ) => this.Page_item( i ) )
		}

		/** Title for page item in sidebar */
		page_item_title( index: number ) {
			const link = this.page_links()[ index ]
			if( !link ) return ''
			const title = this.page_title_by_link( link )
			return title || `Page ${ index + 1 }`
		}

		/** Is this page currently active? */
		page_item_active( index: number ) {
			return this.page_links()[ index ] === this.page_land_link()
		}

		/** Click page in sidebar — navigate */
		page_item_click( index: number, event?: Event ) {
			if( !event ) return null
			const link = this.page_links()[ index ]
			if( link ) this.page_land_link( link )
			return event
		}

		/** Create new page land and add to registry */
		@ $mol_action
		page_create( event?: Event ) {
			if( !event ) return null

			const list = this.registry_ensure()

			const land = this.$.$giper_baza_glob.land_grab(
				[[ null, $giper_baza_rank_post( 'just' ) ]]
			)

			// Init page with empty title
			const data = land.Data( $bog_wysiwyg_model_page )
			data.Title( 'auto' )?.val( '' )

			// Add to registry
			const current = list.items_vary() ?? []
			list.items_vary([ ...current, land.link() ])

			// Navigate to new page
			this.page_land_link( land.link().str )

			return event
		}

		/** Navigate to a page (from graph click) */
		page_navigate( id?: string ) {
			if( id ) this.page_land_link( id )
			return id ?? null
		}

		/** Auto-navigate to first page if no page selected */
		@ $mol_mem
		auto() {
			const current = this.page_land_link()
			if( current ) return

			const pages = this.page_links()
			if( pages.length > 0 ) {
				this.page_land_link( pages[ 0 ] )
			}
		}

		/** Layout content depends on graph toggle */
		@ $mol_mem
		override layout_content() {
			if( this.graph_showed() ) {
				return [ this.Sidebar(), this.Graph_panel() ]
			} else {
				return [ this.Sidebar(), this.Main() ]
			}
		}

		/** Graph pages — proxy objects with methods matching graph interface */
		@ $mol_mem
		override graph_pages() {
			const self = this
			return this.page_links().map( link => ({
				id() { return link },
				title() { return self.page_title_by_link( link ) },
				block_ids() { return self.page_block_ids( link ) },
				block_html( bid: string ) { return self.page_block_html( link, bid ) },
			}) )
		}

	}

}
