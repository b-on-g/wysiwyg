namespace $.$$ {

	export class $bog_wysiwyg extends $.$bog_wysiwyg {

		// === Giper Baza integration ===

		/** Whether this editor is connected to a Giper Baza page */
		has_baza() {
			return !!this.page_land_link()
		}

		/** Giper Baza land for this page. Do NOT put @$mol_mem here (land/pawn). */
		page_land() {
			const link = this.page_land_link()
			if( !link ) return null
			return this.$.$giper_baza_glob.Land( new $giper_baza_link( link ) )
		}

		/** Page data (dict) from the land. Do NOT put @$mol_mem here (land/pawn). */
		page_data() {
			const land = this.page_land()
			if( !land ) return null
			return land.Data( $bog_wysiwyg_model_page )
		}

		/** Get a Baza block model by its link string. Do NOT put @$mol_mem here. */
		baza_block( link_str: string ) {
			return this.$.$giper_baza_glob.Pawn(
				new $giper_baza_link( link_str ),
				$bog_wysiwyg_model_block,
			)
		}

		/** Read page title from Baza */
		@ $mol_mem
		page_title( next?: string ) {
			if( !this.has_baza() ) return next ?? ''
			const data = this.page_data()
			if( !data ) return next ?? ''
			if( next !== undefined ) {
				data.Title( 'auto' )?.val( next )
				return next
			}
			return data.Title()?.val() ?? ''
		}

		// === Block management ===

		generate_id() {
			return Math.random().toString( 36 ).slice( 2, 10 )
		}

		@ $mol_mem
		override block_ids( next?: readonly string[] ): readonly string[] {
			if( !this.has_baza() ) return next ?? [ this.generate_id() ]

			const data = this.page_data()
			if( !data ) return next ?? [ this.generate_id() ]

			const blocks_list = data.Blocks( 'auto' )
			if( !blocks_list ) return next ?? [ this.generate_id() ]

			if( next !== undefined ) {
				// Rebuild the Baza list to match new link order
				const links = next.map( id => new $giper_baza_link( id ) )
				blocks_list.items_vary( links )
				return next
			}

			const blocks = blocks_list.remote_list()
			if( !blocks.length ) {
				// Auto-create first empty block
				const block = blocks_list.make( null )
				block.Type( 'auto' )?.val( 'paragraph' )
				return [ block.link().str ]
			}

			return blocks.map( ( b: $giper_baza_pawn ) => b.link().str )
		}

		/** Override block_html to sync with Baza when connected */
		override block_html( id: string, next?: string ): string {
			if( !this.has_baza() ) return super.block_html( id, next )
			const block = this.baza_block( id )
			if( next !== undefined ) {
				block.Content( 'auto' )?.val( next )
				return next
			}
			return block.Content()?.val() ?? ''
		}

		/** Override block_type to sync with Baza when connected */
		override block_type( id: string, next?: string ): string {
			if( !this.has_baza() ) return super.block_type( id, next )
			const block = this.baza_block( id )
			if( next !== undefined ) {
				block.Type( 'auto' )?.val( next )
				return next
			}
			return block.Type()?.val() ?? 'paragraph'
		}

		/** Override block_level to sync with Baza when connected */
		override block_level( id: string, next?: number ): number {
			if( !this.has_baza() ) return super.block_level( id, next )
			const block = this.baza_block( id )
			if( next !== undefined ) {
				block.Level( 'auto' )?.val( next )
				return next
			}
			return block.Level()?.val() ?? 1
		}

		@ $mol_mem
		block_row_views() {
			return this.block_ids().map( id => this.Block_row( id ) )
		}

		@ $mol_mem
		block_views() {
			return this.block_ids().map( id => this.Block( id ) )
		}

		@ $mol_mem
		active_block_id( next?: string ) {
			return next ?? ''
		}

		focus_block( id: string ) {
			setTimeout( () => {
				try {
					const node = this.Block( id ).dom_node() as HTMLElement
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
		}

		block_enter( id: string, event?: Event ) {
			if( !event ) return null

			if( this.has_baza() ) {
				const data = this.page_data()
				const blocks_list = data?.Blocks( 'auto' )
				if( blocks_list ) {
					const block = blocks_list.make( null )
					block.Type( 'auto' )?.val( 'paragraph' )
					const new_id = block.link().str
					const ids = [ ...this.block_ids() ]
					const index = ids.indexOf( id )
					ids.splice( index + 1, 0, new_id )
					this.block_ids( ids )
					this.focus_block( new_id )
					return event
				}
			}

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

			if( this.has_baza() ) {
				const data = this.page_data()
				const blocks_list = data?.Blocks( 'auto' )
				if( blocks_list ) {
					blocks_list.cut( new $giper_baza_link( id ) )
				}
			}

			const prev_id = ids[ Math.max( 0, index - 1 ) ]
			this.focus_block( prev_id )

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
			this.menu_index( 0 )
			this.menu_showed( true )

			return event
		}

		block_menu_key( id: string, event?: KeyboardEvent ) {
			if( !event ) return null

			if( event.key === 'Escape' ) {
				this.menu_showed( false )
				return event
			}

			// Any printable character: close menu, let character through
			if( event.key.length === 1 && !event.ctrlKey && !event.metaKey ) {
				this.menu_showed( false )
				return event
			}

			const cmds = this.Menu().commands()

			if( event.key === 'ArrowDown' ) {
				this.menu_index( Math.min( this.menu_index() + 1, cmds.length - 1 ) )
				return event
			}

			if( event.key === 'ArrowUp' ) {
				this.menu_index( Math.max( this.menu_index() - 1, 0 ) )
				return event
			}

			if( event.key === 'Enter' ) {
				const cmd = cmds[ this.menu_index() ]
				if( cmd ) this.menu_picked( cmd.id )
				return event
			}

			return event
		}

		apply_menu_command( cmd: string ) {
			const id = this.active_block_id()
			if( !id ) return

			const plugin = $bog_wysiwyg_plugin_registry.get( cmd )
			if( plugin ) {
				if( plugin.on_select ) {
					plugin.on_select( this, id )
				} else {
					this.block_type( id, cmd )
				}
				this.menu_showed( false )
				this.focus_block( id )
				return
			}

			if( cmd === 'image' ) {
				this.menu_showed( false )
				const url = prompt( this.$.$mol_locale.text( '$bog_wysiwyg_image_url_prompt' ) )
				if( !url ) {
					this.focus_block( id )
					return
				}
				this.block_type( id, 'image' )
				this.block_html( id, '<img src="' + url.replace( /"/g, '&quot;' ) + '">' )
				return
			}

			if( cmd.startsWith( 'heading' ) ) {
				const level = parseInt( cmd.replace( 'heading', '' ) ) || 1
				this.block_type( id, 'heading' )
				this.block_level( id, level )
			} else {
				this.block_type( id, cmd )
			}

			this.menu_showed( false )
			this.block_html( id, '' )
			this.focus_block( id )
		}

		block_image( id: string, src?: string ) {
			if( !src ) return null
			this.block_type( id, 'image' )
			this.block_html( id, '<img src="' + src.replace( /"/g, '&quot;' ) + '">' )
			return src
		}

		@ $mol_mem
		override menu_picked( next?: string ) {
			const val = next ?? ''
			if( !val ) return val

			this.apply_menu_command( val )

			return val
		}

		// === AI ===

		block_ai( id: string, event?: Event ) {
			if( !event ) return null
			this.active_block_id( id )

			const block_node = this.Block( id ).dom_node() as HTMLElement
			const editor_node = this.dom_node() as HTMLElement
			const block_rect = block_node.getBoundingClientRect()
			const editor_rect = editor_node.getBoundingClientRect()

			const text = block_node.textContent ?? ''
			this.ai_context( text )

			this.ai_pos_y( block_rect.bottom - editor_rect.top )
			this.ai_pos_x( block_rect.left - editor_rect.left )
			this.ai_index( 0 )
			this.ai_showed( true )

			return event
		}

		block_ai_key( id: string, event?: KeyboardEvent ) {
			if( !event ) return null

			if( event.key === 'Escape' ) {
				this.ai_showed( false )
				return event
			}

			if( event.key.length === 1 && !event.ctrlKey && !event.metaKey ) {
				this.ai_showed( false )
				return event
			}

			const cmds = this.Ai().commands()

			if( event.key === 'ArrowDown' ) {
				this.ai_index( Math.min( this.ai_index() + 1, cmds.length - 1 ) )
				return event
			}

			if( event.key === 'ArrowUp' ) {
				this.ai_index( Math.max( this.ai_index() - 1, 0 ) )
				return event
			}

			if( event.key === 'Enter' ) {
				const cmd = cmds[ this.ai_index() ]
				if( cmd ) this.ai_picked( cmd.id )
				return event
			}

			return event
		}

		@ $mol_mem
		ai_result( next?: string ) {
			const text = next ?? null
			if( !text ) return text

			const id = this.active_block_id()
			if( !id ) return text

			const current_html = this.block_html( id )
			const cmd = this.ai_picked()

			if( cmd === 'continue' ) {
				this.block_html( id, current_html + ' ' + text )
			} else {
				this.block_html( id, text )
			}

			this.ai_loading( false )
			this.focus_block( id )

			return text
		}

		// === Drag & Drop ===

		row_is_drag_over( id: string ) {
			return this.drag_over_id() === id && this.drag_source_id() !== id
		}

		row_drag_position( id: string ) {
			if( this.drag_over_id() !== id ) return ''
			return this.drag_over_position()
		}

		row_is_dragging( id: string ) {
			return this.drag_source_id() === id
		}

		handle_dragstart( id: string, event?: DragEvent ) {
			if( !event ) return null
			this.drag_source_id( id )
			if( event.dataTransfer ) {
				event.dataTransfer.effectAllowed = 'move'
				event.dataTransfer.setData( 'text/plain', id )
			}
			return event
		}

		row_dragover( id: string, event?: DragEvent ) {
			if( !event ) return null
			event.preventDefault()
			if( event.dataTransfer ) {
				event.dataTransfer.dropEffect = 'move'
			}

			const row_node = this.Block_row( id ).dom_node() as HTMLElement
			const rect = row_node.getBoundingClientRect()
			const mid = rect.top + rect.height / 2
			const position = event.clientY < mid ? 'before' : 'after'

			this.drag_over_id( id )
			this.drag_over_position( position )
			return event
		}

		row_drop( id: string, event?: DragEvent ) {
			if( !event ) return null
			event.preventDefault()
			const source_id = this.drag_source_id()
			if( source_id && source_id !== id ) {
				this.move_block( source_id, id, this.drag_over_position() as 'before' | 'after' )
			}
			this.clear_drag_state()
			return event
		}

		row_dragend( id: string, event?: Event ) {
			if( !event ) return null
			this.clear_drag_state()
			return event
		}

		clear_drag_state() {
			this.drag_source_id( '' )
			this.drag_over_id( '' )
			this.drag_over_position( 'after' )
		}

		move_block( from_id: string, to_id: string, position: 'before' | 'after' ) {
			const ids = [ ...this.block_ids() ]
			const from = ids.indexOf( from_id )
			if( from < 0 ) return

			ids.splice( from, 1 )
			const to = ids.indexOf( to_id )
			if( to < 0 ) return

			const insert = position === 'before' ? to : to + 1
			ids.splice( insert, 0, from_id )
			this.block_ids( ids )
		}

	}

}
