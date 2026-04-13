namespace $.$$ {

	const Comments_list = $giper_baza_list_link_to( () => $bog_wysiwyg_model_comment )

	export class $bog_wysiwyg_comment_thread extends $.$bog_wysiwyg_comment_thread {

		comment_land() {
			const link = this.comment_land_link()
			if( !link ) return null
			return this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
		}

		comments_list() {
			const land = this.comment_land()
			if( !land ) return null
			return land.Data( Comments_list )
		}

		comment_items() {
			const list = this.comments_list()
			if( !list ) return []
			return list.remote_list()
		}

		@ $mol_mem
		comment_views() {
			return this.comment_items().map( ( _: any, i: number ) => this.Comment_row( i ) )
		}

		/** Lord ID for avatar */
		comment_author_id( index: number ) {
			const item = this.comment_items()[ index ]
			if( !item ) return ''
			return item.Author()?.val() ?? ''
		}

		/** Display name + date */
		comment_author( index: number ) {
			const item = this.comment_items()[ index ]
			if( !item ) return ''

			const lord_id = item.Author()?.val() ?? ''
			const name = this.author_name( lord_id )

			const time = item.Time()?.val() ?? 0
			const date = time ? new Date( time ).toLocaleString() : ''
			return name + ( date ? ' \u00b7 ' + date : '' )
		}

		/** Resolve lord ID to profile name */
		author_name( lord_id: string ) {
			if( !lord_id ) return ''
			try {
				const home_land = this.$.$giper_baza_glob.Land(
					new $giper_baza_link( lord_id )
				)
				const profile = home_land.Data( $bog_blitz_profile )
				const name = profile.Name()?.val()
				if( name ) return name
			} catch {}
			return lord_id.slice( 0, 8 )
		}

		comment_text( index: number ) {
			const item = this.comment_items()[ index ]
			if( !item ) return ''
			return item.Text()?.val() ?? ''
		}

		@ $mol_mem
		override draft( next?: string ) {
			return next ?? ''
		}

		comment_count() {
			return this.comment_items().length
		}

		@ $mol_action
		send( event?: Event ) {
			if( !event ) return null
			const text = this.draft()
			if( !text.trim() ) return null

			const list = this.comments_list()
			if( !list ) return null

			const comment = list.make( null )
			comment.Text( 'auto' )?.val( text.trim() )

			const pass = this.$.$giper_baza_auth.current().pass()
			comment.Author( 'auto' )?.val( pass.lord().str )
			comment.Time( 'auto' )?.val( Date.now() )

			this.draft( '' )

			return event
		}

	}

}
