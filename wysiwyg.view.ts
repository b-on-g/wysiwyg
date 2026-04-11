namespace $.$$ {

	export class $bog_wysiwyg extends $.$bog_wysiwyg {

		generate_id() {
			return Math.random().toString( 36 ).slice( 2, 10 )
		}

		@ $mol_mem
		override block_ids( next?: readonly string[] ): readonly string[] {
			return next ?? [ this.generate_id() ]
		}

		@ $mol_mem
		block_views() {
			return this.block_ids().map( id => this.Block( id ) )
		}

		@ $mol_mem
		active_block_id( next?: string ) {
			return next ?? ''
		}

		block_enter( id: string, event?: Event ) {
			if( !event ) return null

			const ids = [ ...this.block_ids() ]
			const index = ids.indexOf( id )
			const new_id = this.generate_id()
			ids.splice( index + 1, 0, new_id )
			this.block_ids( ids )

			setTimeout( () => {
				try {
					const node = this.Block( new_id ).dom_node() as HTMLElement
					node.focus()
				} catch( e ) {
					$mol_fail_log( e )
				}
			}, 0 )

			return event
		}

		block_remove( id: string, event?: Event ) {
			if( !event ) return null

			const ids = [ ...this.block_ids() ]
			if( ids.length <= 1 ) return null

			const index = ids.indexOf( id )
			ids.splice( index, 1 )
			this.block_ids( ids )

			const prev_id = ids[ Math.max( 0, index - 1 ) ]
			setTimeout( () => {
				try {
					const node = this.Block( prev_id ).dom_node() as HTMLElement
					node.focus()
					const sel = window.getSelection()
					if( sel ) {
						sel.selectAllChildren( node )
						sel.collapseToEnd()
					}
				} catch( e ) {
					$mol_fail_log( e )
				}
			}, 0 )

			return event
		}

		block_slash( id: string, event?: Event ) {
			if( !event ) return null
			this.active_block_id( id )

			const block_node = this.Block( id ).dom_node() as HTMLElement
			const editor_node = this.dom_node() as HTMLElement
			const block_rect = block_node.getBoundingClientRect()
			const editor_rect = editor_node.getBoundingClientRect()

			this.menu_pos_y( block_rect.bottom - editor_rect.top )
			this.menu_pos_x( block_rect.left - editor_rect.left )
			this.menu_showed( true )

			return event
		}

		@ $mol_mem
		override menu_picked( next?: string ) {
			const val = next ?? ''
			if( !val ) return val

			const id = this.active_block_id()
			if( !id ) return val

			if( val.startsWith( 'heading' ) ) {
				const level = parseInt( val.replace( 'heading', '' ) ) || 1
				this.block_type( id, 'heading' )
				this.block_level( id, level )
			} else {
				this.block_type( id, val )
			}

			this.menu_showed( false )
			this.block_html( id, '' )

			setTimeout( () => {
				try {
					const node = this.Block( id ).dom_node() as HTMLElement
					node.focus()
				} catch( e ) {
					$mol_fail_log( e )
				}
			}, 0 )

			return val
		}

	}

}
