namespace $.$$ {

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

		/** Registry land link from URL */
		@ $mol_mem
		registry_land_link( next?: string ) {
			if( next !== undefined ) {
				this.$.$mol_state_arg.value( 'registry', next || null )
				return next
			}
			return this.$.$mol_state_arg.value( 'registry' ) ?? ''
		}

		/** User data from home land. Do NOT put @$mol_mem. */
		user_data() {
			const home = this.$.$giper_baza_glob.home()
			if( !home ) return null
			return home.land().Data( $bog_wysiwyg_model_user_data )
		}

		/** List of registry link strings from home land */
		@ $mol_mem
		user_registry_links(): readonly string[] {
			const data = this.user_data()
			if( !data ) return []
			const list = data.Registries()
			if( !list ) return []
			const items = list.items_vary() ?? []
			return items
				.map( v => $giper_baza_vary_cast_link( v ) )
				.filter( $mol_guard_defined )
				.map( link => link.str )
		}

		/** Add a registry link to user's home land */
		@ $mol_action
		user_registries_add( link_str: string ) {
			const data = this.user_data()
			if( !data ) return
			const list = data.Registries( 'auto' )
			if( !list ) return
			const current = list.items_vary() ?? []
			list.items_vary([ ...current, new $giper_baza_link( link_str ) ])
		}

		/** Registry data (dict with Title + Pages). Do NOT put @$mol_mem. */
		registry_data() {
			const link = this.registry_land_link()
			if( !link ) return null
			const land = this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
			return land.Data( $bog_wysiwyg_model_registry )
		}

		/** Create registry land if none exists, return registry data */
		@ $mol_action
		registry_ensure() {
			let data = this.registry_data()
			if( data ) return data
			const land = this.$.$giper_baza_glob.land_grab(
				[[ null, $giper_baza_rank_post( 'just' ) ]]
			)
			const link_str = land.link().str
			this.registry_land_link( link_str )
			this.user_registries_add( link_str )
			return land.Data( $bog_wysiwyg_model_registry )
		}

		/** All page land link strings from registry */
		@ $mol_mem
		page_links(): readonly string[] {
			const data = this.registry_data()
			if( !data ) return []
			const list = data.Pages()
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

		/** All pages info for backlinks */
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

		/** Read registry title from a land link */
		registry_title_by_link( link: string ): string {
			const land = this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
			const data = land.Data( $bog_wysiwyg_model_registry )
			return data.Title()?.val() ?? ''
		}

		// === Permissions ===

		/** Current user's lord link. Do NOT put @$mol_mem. */
		my_lord() {
			return this.$.$giper_baza_auth.current().pass().lord()
		}

		/** Get the Giper Baza land for the current page. Do NOT put @$mol_mem. */
		current_page_land() {
			const link = this.page_land_link()
			if( !link ) return null
			return this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
		}

		/** Current user's tier on the current page land */
		@ $mol_mem
		page_tier(): $giper_baza_rank_tier {
			const land = this.current_page_land()
			if( !land ) return $giper_baza_rank_tier.deny
			const auth = this.$.$giper_baza_auth.current()
			return $giper_baza_rank_tier_of( land.pass_rank( auth.pass() ) )
		}

		/** Whether current user can edit the current page */
		@ $mol_mem
		can_edit() {
			return this.page_tier() >= $giper_baza_rank_tier.post
		}

		/** Whether current user is owner (rule) of the current page */
		@ $mol_mem
		is_owner() {
			return this.page_tier() >= $giper_baza_rank_tier.rule
		}

		/** Editor is readonly when user cannot edit */
		@ $mol_mem
		editor_readonly() {
			return !this.can_edit()
		}

		/** Label showing current user's role */
		@ $mol_mem
		permissions_role_label() {
			const tier = this.page_tier()
			if( tier >= $giper_baza_rank_tier.rule ) return 'You: Owner'
			if( tier >= $giper_baza_rank_tier.post ) return 'You: Editor'
			if( tier >= $giper_baza_rank_tier.read ) return 'You: Viewer'
			return 'You: No access'
		}

		/** List known lords (gift recipients) in current page land */
		@ $mol_mem
		page_gift_lords(): string[] {
			const land = this.current_page_land()
			if( !land ) return []
			const lords: string[] = []
			for( const [ key ] of land._gift ) {
				if( key ) lords.push( key )
			}
			return lords
		}

		/** Permissions member rows */
		@ $mol_mem
		override permissions_member_rows() {
			if( !this.is_owner() ) return []
			return this.page_gift_lords().map( ( _, i ) => this.Permissions_member( i ) )
		}

		/** Lord title for member row */
		permissions_member_lord_title( index: number ) {
			const lords = this.page_gift_lords()
			const lord = lords[ index ]
			if( !lord ) return ''
			const my = this.my_lord()
			if( lord === my.str ) return lord + ' (you)'
			return lord
		}

		/** Role value for member row */
		@ $mol_mem_key
		permissions_member_role_value( index: number, next?: string ): string {
			const lords = this.page_gift_lords()
			const lord_str = lords[ index ]
			if( !lord_str ) return 'viewer'

			if( next !== undefined ) {
				const land = this.current_page_land()
				if( !land ) return next
				const lord = new $giper_baza_link( lord_str )
				const pass = land.lord_pass( lord )
				if( !pass ) return next
				const rank = next === 'rule'
					? $giper_baza_rank_make( 'rule', 'just' )
					: next === 'editor'
					? $giper_baza_rank_post( 'just' )
					: $giper_baza_rank_make( 'read', 'late' )
				land.pass_rank( pass, rank )
				return next
			}

			const land = this.current_page_land()
			if( !land ) return 'viewer'
			const lord = new $giper_baza_link( lord_str )
			const tier = land.lord_tier( lord )
			if( tier >= $giper_baza_rank_tier.rule ) return 'rule'
			if( tier >= $giper_baza_rank_tier.post ) return 'editor'
			return 'viewer'
		}

		/** Add a user to the current page land */
		@ $mol_action
		permissions_add_click( event?: Event ) {
			if( !event ) return null
			const land = this.current_page_land()
			if( !land ) return null

			const lord_str = this.permissions_add_link().trim()
			if( !lord_str ) return null

			const role = this.permissions_add_role_value()
			const rank = role === 'editor'
				? $giper_baza_rank_post( 'just' )
				: $giper_baza_rank_make( 'read', 'late' )

			const lord = new $giper_baza_link( lord_str )
			const pass = land.lord_pass( lord )
			if( pass ) {
				land.pass_rank( pass, rank )
			}

			this.permissions_add_link( '' )
			return event
		}

		/** Hide add-member controls for non-owners */
		@ $mol_mem
		override permissions_add_content() {
			if( !this.is_owner() ) return []
			return [
				this.Permissions_add_input(),
				this.Permissions_add_role(),
				this.Permissions_add_button(),
			]
		}

		// === Sidebar: hide New page button for viewers ===

		@ $mol_mem
		override sidebar_head_content() {
			const parts: any[] = [ this.Sidebar_title() ]
			if( this.can_edit() ) {
				parts.push( this.New_page() )
			}
			return parts
		}

		// === Page item: hide rename for viewers ===

		page_item_can_edit( index: number ) {
			return this.can_edit()
		}

		/** Registry rows for panel */
		@ $mol_mem
		override registry_rows() {
			return this.user_registry_links().map( ( _, i ) => this.Registry_item( i ) )
		}

		/** Title for registry item */
		registry_item_title( index: number ) {
			const link = this.user_registry_links()[ index ]
			if( !link ) return ''
			const title = this.registry_title_by_link( link )
			return title || `Registry ${ index + 1 }`
		}

		/** Is this registry currently active? */
		registry_item_active( index: number ) {
			return this.user_registry_links()[ index ] === this.registry_land_link()
		}

		/** Click registry in panel — switch to it */
		registry_item_click( index: number, event?: Event ) {
			if( !event ) return null
			const link = this.user_registry_links()[ index ]
			if( link ) {
				this.registry_land_link( link )
				// Auto-select first page
				const land = this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
				const data = land.Data( $bog_wysiwyg_model_registry )
				const pages = data.Pages()
				if( pages ) {
					const items = pages.items_vary() ?? []
					const first = items[0]
					if( first ) {
						const first_link = $giper_baza_vary_cast_link( first )
						if( first_link ) this.page_land_link( first_link.str )
					}
				}
			}
			return event
		}

		/** Create new registry land, add to home, switch to it */
		@ $mol_action
		registry_create( event?: Event ) {
			if( !event ) return null

			const land = this.$.$giper_baza_glob.land_grab(
				[[ null, $giper_baza_rank_post( 'just' ) ]]
			)

			// Init registry with empty title
			const data = land.Data( $bog_wysiwyg_model_registry )
			data.Title( 'auto' )?.val( '' )

			const link_str = land.link().str

			// Add to home
			this.user_registries_add( link_str )

			// Switch to it
			this.registry_land_link( link_str )

			// Create first page
			this.page_create( new Event( 'auto' ) )

			return event
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

		/** Rename page title in Baza */
		page_item_rename( index: number, val?: string ) {
			if( val === undefined ) return null
			const link = this.page_links()[ index ]
			if( !link ) return val
			const land = this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
			const data = land.Data( $bog_wysiwyg_model_page )
			data.Title( 'auto' )?.val( val )
			return val
		}

		/** Create new page land and add to registry */
		@ $mol_action
		page_create( event?: Event ) {
			if( !event ) return null

			const reg = this.registry_ensure()

			const land = this.$.$giper_baza_glob.land_grab(
				[[ null, $giper_baza_rank_post( 'just' ) ]]
			)

			// Init page with empty title
			const data = land.Data( $bog_wysiwyg_model_page )
			data.Title( 'auto' )?.val( '' )

			// Add to registry via Pages
			const pages = reg.Pages( 'auto' )
			if( pages ) {
				const current = pages.items_vary() ?? []
				pages.items_vary([ ...current, land.link() ])
			}

			// Navigate to new page
			this.page_land_link( land.link().str )

			return event
		}

		/** Navigate to a page (from graph click) */
		page_navigate( id?: string ) {
			if( id ) this.page_land_link( id )
			return id ?? null
		}

		/** Auto-init: ensure registry + page on first visit */
		@ $mol_mem
		auto() {
			// If registry is set in URL, just auto-select first page
			const reg_link = this.registry_land_link()
			if( reg_link ) {
				const current = this.page_land_link()
				if( current ) return
				const pages = this.page_links()
				if( pages.length > 0 ) {
					this.page_land_link( pages[0] )
				}
				return
			}

			// No registry in URL — check home for saved registries
			const saved = this.user_registry_links()
			if( saved.length > 0 ) {
				this.registry_land_link( saved[0] )
				return
			}

			// Nothing saved — create fresh registry + page
			this.registry_ensure()
			this.page_create( new Event( 'auto' ) )
		}

		/** Layout content depends on panels */
		@ $mol_mem
		override layout_content() {
			const parts: any[] = []

			if( this.registry_panel_showed() ) {
				parts.push( this.Registry_panel() )
			}

			parts.push( this.Sidebar() )

			if( this.profile_showed() ) {
				parts.push( this.Profile_panel() )
			} else if( this.permissions_showed() ) {
				parts.push( this.Permissions_panel() )
			} else if( this.graph_showed() ) {
				if( this.page_links().length === 0 ) {
					this.page_create( new Event( 'auto' ) )
				}
				parts.push( this.Graph_panel() )
			} else {
				parts.push( this.Main() )
			}

			return parts
		}

		/** Graph pages */
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

	export class $bog_wysiwyg_app_page extends $.$bog_wysiwyg_app_page {

		@ $mol_mem
		override page_content() {
			if( this.editing() ) {
				return [ this.Title_input(), this.Rename_confirm() ]
			}
			if( !this.can_edit() ) {
				return [ this.Title_nav() ]
			}
			return [ this.Title_nav(), this.Rename_trigger() ]
		}

		@ $mol_action
		override start_rename( event?: Event ) {
			if( !event ) return null
			if( !this.can_edit() ) return null
			this.edit_title( this.title() )
			this.editing( true )
			return event
		}

		@ $mol_action
		override confirm_rename( event?: Event ) {
			if( !event ) return null
			this.on_rename( this.edit_title() )
			this.editing( false )
			return event
		}

	}

}
