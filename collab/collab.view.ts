namespace $.$$ {

	export class $bog_wysiwyg_collab extends $.$bog_wysiwyg_collab {

		/** Get the page land (do NOT put @$mol_mem — returns land object). */
		page_land() {
			const link = this.page_land_link()
			if( !link ) return null
			return this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
		}

		/** Sync status based on yard master connection. */
		@ $mol_mem
		override sync_status() {
			const land = this.page_land()
			if( !land ) return 'offline'

			try {
				const yard = this.$.$giper_baza_glob.yard()
				const master = yard.master()
				return master ? 'online' : 'offline'
			} catch( error: unknown ) {
				if( error instanceof Promise ) $mol_fail_hidden( error )
				return 'offline'
			}
		}

		@ $mol_mem
		override sync_label() {
			const status = this.sync_status()
			if( status === 'online' ) return '\u25CF'  // filled circle
			return '\u25CB'  // empty circle
		}

		/** List of lord link strings from the land's gift map. */
		@ $mol_mem
		peer_ids(): readonly string[] {
			const land = this.page_land()
			if( !land ) return []

			const lords: string[] = []
			for( const [ lord_str ] of land._gift ) {
				// Skip the "hole" (anonymous/everyone) gift
				if( !lord_str ) continue
				lords.push( lord_str )
			}
			return lords
		}

		@ $mol_mem
		override peer_views() {
			return this.peer_ids().map( id => this.Peer( id ) )
		}

		/** Short display name for a peer — first 4 chars of lord link. */
		peer_short( id: string ) {
			return id.slice( 0, 4 )
		}

		/** Full lord link as tooltip. */
		peer_title( id: string ) {
			return id
		}

	}

}
