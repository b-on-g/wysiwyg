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

		/** Create a snapshot (fork) of the current page land */
		@ $mol_action
		save_version( event?: Event ) {
			if( !event ) return null

			const land = this.page_land()
			if( !land ) return null

			const fork = land.fork()
			const data = this.page_data()
			if( !data ) return null

			const versions = data.Versions( 'auto' )
			if( !versions ) return null

			const current = versions.items_vary() ?? []
			versions.items_vary([ fork.link(), ...current ])

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

		/** Whether this version is currently being previewed */
		version_active( link: string ) {
			return false
		}

		/** Restore content from a version snapshot into the current page */
		version_click( link: string, event?: Event ) {
			if( !event ) return null

			const land = this.page_land()
			if( !land ) return null

			land.Tine().items_vary([ new $giper_baza_link( link ) ])

			return event
		}

	}

}
