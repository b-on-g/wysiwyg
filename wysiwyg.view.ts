namespace $ {

	export function $bog_wysiwyg_html_to_md( html: string ): string {
		let text = html
		text = text.replace( /<br\s*\/?>/gi, '\n' )
		text = text.replace( /<(?:b|strong)>(.+?)<\/(?:b|strong)>/gi, '**$1**' )
		text = text.replace( /<(?:i|em)>(.+?)<\/(?:i|em)>/gi, '*$1*' )
		text = text.replace( /<code>(.+?)<\/code>/gi, '`$1`' )
		text = text.replace( /<(?:s|del)>(.+?)<\/(?:s|del)>/gi, '~~$1~~' )
		text = text.replace( /<a[^>]*href="([^"]*)"[^>]*>(.+?)<\/a>/gi, '[$2]($1)' )
		text = text.replace( /<[^>]*>/g, '' )
		text = text.replace( /&amp;/g, '&' )
		text = text.replace( /&lt;/g, '<' )
		text = text.replace( /&gt;/g, '>' )
		text = text.replace( /&quot;/g, '"' )
		text = text.replace( /&nbsp;/g, ' ' )
		return text
	}

}

namespace $.$$ {

	export class $bog_wysiwyg extends $.$bog_wysiwyg {

		/** Block row content: hide drag handle and comments when readonly */
		block_row_sub( id: string ) {
			if( this.readonly() ) {
				return [ this.Block( id ) ]
			}
			return [
				this.Drag_handle( id ),
				this.Block( id ),
				this.Block_comment( id ),
			]
		}

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
			if( this.readonly() ) return null

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
			if( this.readonly() ) return null

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
			if( this.readonly() ) return null
			this.active_block_id( id )

			const block_node = this.Block( id ).dom_node() as HTMLElement
			const block_rect = block_node.getBoundingClientRect()

			this.menu_pos_y( block_rect.bottom )
			this.menu_pos_x( block_rect.left )
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
				const url = this.$.$mol_dom_context.prompt( this.$.$mol_locale.text( '$bog_wysiwyg_image_url_prompt' ) )
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

		block_paste_blocks( id: string, val?: { type: string, content: string, level?: number }[] ) {
			if( !val || !val.length ) return null

			// First block replaces the current one
			this.block_type( id, val[ 0 ].type )
			this.block_html( id, val[ 0 ].content )
			if( val[ 0 ].level ) this.block_level( id, val[ 0 ].level )

			// Remaining blocks are inserted after
			const ids = [ ...this.block_ids() ]
			const index = ids.indexOf( id )
			let last_id = id

			for( let i = 1; i < val.length; i++ ) {
				const block = val[ i ]

				let new_id: string
				if( this.has_baza() ) {
					const data = this.page_data()
					const blocks_list = data?.Blocks( 'auto' )
					if( blocks_list ) {
						const pawn = blocks_list.make( null )
						pawn.Type( 'auto' )?.val( block.type )
						pawn.Content( 'auto' )?.val( block.content )
						if( block.level ) pawn.Level( 'auto' )?.val( block.level )
						new_id = pawn.link().str
					} else {
						new_id = this.generate_id()
					}
				} else {
					new_id = this.generate_id()
				}

				const insert_at = ids.indexOf( last_id ) + 1
				ids.splice( insert_at, 0, new_id )
				last_id = new_id
			}

			this.block_ids( ids )

			// Set data for non-baza blocks
			if( !this.has_baza() ) {
				let pos = index + 1
				for( let i = 1; i < val.length; i++ ) {
					const new_id = ids[ pos ]
					this.block_type( new_id, val[ i ].type )
					this.block_html( new_id, val[ i ].content )
					if( val[ i ].level ) this.block_level( new_id, val[ i ].level )
					pos++
				}
			}

			this.focus_block( last_id )
			return val
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
			if( this.readonly() ) return null
			this.active_block_id( id )

			const block_node = this.Block( id ).dom_node() as HTMLElement
			const block_rect = block_node.getBoundingClientRect()

			const text = block_node.textContent ?? ''
			this.ai_context( text )

			this.ai_pos_y( block_rect.bottom )
			this.ai_pos_x( block_rect.left )
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
				if( cmd ) {
					this.ai_picked( cmd.id )
					;( this.Ai() as $bog_wysiwyg_ai ).run_command( cmd.id )
				}
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

		// === Comments ===

		/** Dict mapping block_id -> comment land link string. Do NOT put @$mol_mem here. */
		comments_dict() {
			const data = this.page_data()
			if( !data ) return null
			return data.Comments( 'auto' )
		}

		/** Get existing comment land link for a block, or empty string */
		block_comment_land_link( id: string ): string {
			if( !this.has_baza() ) return ''
			const dict = this.comments_dict()
			if( !dict ) return ''
			return dict.key( id )?.val() ?? ''
		}

		/** When comment panel opens, ensure a comment land exists for this block */
		@ $mol_mem_key
		block_comment_open( id: string, next?: boolean ): boolean {
			if( next === undefined ) return false
			if( next && this.has_baza() && !this.block_comment_land_link( id ) ) {
				this.comment_land_ensure( id )
			}
			return next
		}

		/** Create a comment land for a block and store its link in the registry */
		@ $mol_action
		comment_land_ensure( block_id: string ) {
			const dict = this.comments_dict()
			if( !dict ) return
			const land = this.$.$giper_baza_glob.land_grab( [[ null, $giper_baza_rank_post( 'just' ) ]] )
			const atom = dict.key( block_id, 'auto' )
			if( atom ) atom.val( land.link().str )
		}

		// === Select All & Copy as Markdown ===

		editor_keydown( event?: KeyboardEvent ) {
			if( !event ) return null
			if( ( event.ctrlKey || event.metaKey ) && event.key === 'a' ) {
				event.preventDefault()
				this.select_all_blocks()
				return event
			}
			if( event.key === 'Backspace' || event.key === 'Delete' ) {
				const selected = this.selected_block_ids()
				if( selected.length > 1 ) {
					event.preventDefault()
					this.delete_blocks( selected )
					return event
				}
			}
			return event
		}

		selected_block_ids() {
			const sel = this.$.$mol_dom_context.document.defaultView?.getSelection()
			if( !sel || sel.isCollapsed ) return []

			const ids = this.block_ids()
			return ids.filter( id => {
				const node = this.Block( id ).dom_node() as HTMLElement
				return sel.containsNode( node, true )
			})
		}

		delete_blocks( selected: string[] ) {
			const ids = [ ...this.block_ids() ]

			for( const id of selected ) {
				const index = ids.indexOf( id )
				if( index >= 0 ) {
					ids.splice( index, 1 )
					if( this.has_baza() ) {
						const data = this.page_data()
						const blocks_list = data?.Blocks( 'auto' )
						if( blocks_list ) {
							blocks_list.cut( new $giper_baza_link( id ) )
						}
					}
				}
			}

			if( ids.length === 0 ) {
				if( this.has_baza() ) {
					const data = this.page_data()
					const blocks_list = data?.Blocks( 'auto' )
					if( blocks_list ) {
						const block = blocks_list.make( null )
						block.Type( 'auto' )?.val( 'paragraph' )
						ids.push( block.link().str )
					}
				} else {
					ids.push( this.generate_id() )
				}
			}

			this.block_ids( ids )
			this.focus_block( ids[ 0 ] )
		}

		select_all_blocks() {
			const ids = this.block_ids()
			if( !ids.length ) return

			const first = this.Block( ids[ 0 ] ).dom_node() as HTMLElement
			const last = this.Block( ids[ ids.length - 1 ] ).dom_node() as HTMLElement

			const sel = this.$.$mol_dom_context.document.defaultView?.getSelection()
			if( !sel ) return

			sel.removeAllRanges()
			const range = this.$.$mol_dom_context.document.createRange()
			range.setStart( first, 0 )
			range.setEnd( last, last.childNodes.length )
			sel.addRange( range )
		}

		editor_copy( event?: ClipboardEvent ) {
			if( !event ) return null

			const sel = this.$.$mol_dom_context.document.defaultView?.getSelection()
			if( !sel || sel.isCollapsed ) return event

			const ids = this.block_ids()
			const md_parts: string[] = []

			for( const id of ids ) {
				const node = this.Block( id ).dom_node() as HTMLElement
				if( !sel.containsNode( node, true ) ) continue

				const type = this.block_type( id )
				const html = node.innerHTML

				switch( type ) {
					case 'heading': {
						const level = this.block_level( id )
						md_parts.push( '#'.repeat( level ) + ' ' + $bog_wysiwyg_html_to_md( html ) )
						break
					}
					case 'code':
						md_parts.push( '```\n' + ( node.textContent ?? '' ) + '\n```' )
						break
					case 'quote':
						md_parts.push(
							$bog_wysiwyg_html_to_md( html )
								.split( '\n' )
								.map( l => '> ' + l )
								.join( '\n' )
						)
						break
					case 'divider':
						md_parts.push( '---' )
						break
					case 'image': {
						const img = node.querySelector( 'img' )
						if( img ) md_parts.push( `![](${img.src})` )
						break
					}
					default:
						md_parts.push( $bog_wysiwyg_html_to_md( html ) )
				}
			}

			if( md_parts.length > 1 ) {
				event.preventDefault()
				const md = md_parts.join( '\n\n' )
				event.clipboardData?.setData( 'text/plain', md )
				// Also set HTML for rich paste targets
				const html = ids
					.filter( id => sel.containsNode( this.Block( id ).dom_node(), true ) )
					.map( id => ( this.Block( id ).dom_node() as HTMLElement ).outerHTML )
					.join( '' )
				event.clipboardData?.setData( 'text/html', html )
			}

			return event
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
