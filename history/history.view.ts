namespace $.$$ {

	export class $bog_wysiwyg_history extends $.$bog_wysiwyg_history {

		/** Giper Baza land for the page. Do NOT put @$mol_mem here (land/pawn). */
		page_land() {
			const link = this.page_land_link()
			if( !link ) return null
			return this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
		}

		/** Page data from the land. Do NOT put @$mol_mem here (land/pawn). */
		page_data() {
			const land = this.page_land()
			if( !land ) return null
			return land.Data( $bog_wysiwyg_model_page )
		}

		/** List of version land link strings, newest first */
		@ $mol_mem
		version_links(): readonly string[] {
			const data = this.page_data()
			if( !data ) return []
			const versions = data.Versions()
			if( !versions ) return []
			const items = versions.items_vary() ?? []
			return items
				.map( v => $giper_baza_vary_cast_link( v ) )
				.filter( $mol_guard_defined )
				.map( link => link.str )
		}

		/** Create a true snapshot of the current page by copying all block data into a new land */
		@ $mol_action
		save_version( event?: Event ) {
			if( !event ) return null

			const src_data = this.page_data()
			if( !src_data ) return null

			// Create a new independent land for the snapshot
			const snap_land = this.$.$giper_baza_glob.land_grab()
			const snap_data = snap_land.Data( $bog_wysiwyg_model_page )

			// Copy title
			const title_val = src_data.Title()?.val() ?? ''
			if( title_val ) {
				snap_data.Title( 'auto' )?.val( title_val )
			}

			// Copy all blocks into the snapshot land
			const src_blocks = src_data.Blocks()
			if( src_blocks ) {
				const blocks = src_blocks.remote_list() ?? []
				const snap_blocks = snap_data.Blocks( 'auto' )
				if( snap_blocks ) {
					for( const block of blocks ) {
						const snap_block = snap_blocks.make( null )
						const type_val = block.Type()?.val() ?? ''
						const level_val = block.Level()?.val() ?? 0
						const content_val = block.Content()?.val() ?? ''
						snap_block.Type( 'auto' )?.val( type_val )
						snap_block.Level( 'auto' )?.val( level_val )
						snap_block.Content( 'auto' )?.val( content_val )
					}
				}
			}

			// Add snapshot link to versions list (newest first)
			const versions = src_data.Versions( 'auto' )
			if( !versions ) return null

			const current = versions.items_vary() ?? []
			versions.items_vary([ snap_land.link(), ...current ])

			return event
		}

		/** Rows for the version list */
		@ $mol_mem
		version_rows() {
			return this.version_links().map( link => this.Version( link ) )
		}

		/** Title for a version entry */
		version_title( link: string ) {
			const land = this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
			const data = land.Data( $bog_wysiwyg_model_page )
			const title = data.Title()?.val() ?? ''
			const index = this.version_links().indexOf( link )
			const num = this.version_links().length - index
			const label = this.$.$mol_locale.text( '$bog_wysiwyg_history_version_label' )
			return title
				? `#${ num } — ${ title }`
				: `${ label } #${ num }`
		}

		/** Which version link is currently selected */
		@ $mol_mem
		current_version( next?: string | null ): string | null {
			return next ?? null
		}

		/** Whether this version is currently being previewed */
		version_active( link: string ) {
			return this.current_version() === link
		}

		/** Restore content from a version snapshot into the current page */
		@ $mol_action
		version_click( link: string, event?: Event ) {
			if( !event ) return null

			const dst_data = this.page_data()
			if( !dst_data ) return null

			// Read blocks from the snapshot land
			const snap_land = this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
			const snap_data = snap_land.Data( $bog_wysiwyg_model_page )

			// Restore title
			const snap_title = snap_data.Title()?.val() ?? ''
			if( snap_title ) {
				dst_data.Title( 'auto' )?.val( snap_title )
			}

			// Clear current blocks and copy from snapshot
			const dst_blocks = dst_data.Blocks( 'auto' )
			const snap_blocks = snap_data.Blocks()
			if( dst_blocks && snap_blocks ) {
				const src_list = snap_blocks.remote_list() ?? []

				// Remove existing blocks
				const existing = dst_blocks.remote_list() ?? []
				for( const block of existing ) {
					dst_blocks.cut( block.link() )
				}

				// Copy snapshot blocks into current land
				for( const block of src_list ) {
					const new_block = dst_blocks.make( null )
					const type_val = block.Type()?.val() ?? ''
					const level_val = block.Level()?.val() ?? 0
					const content_val = block.Content()?.val() ?? ''
					new_block.Type( 'auto' )?.val( type_val )
					new_block.Level( 'auto' )?.val( level_val )
					new_block.Content( 'auto' )?.val( content_val )
				}
			}

			this.current_version( link )
			return event
		}

	}

}
