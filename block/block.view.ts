namespace $.$$ {

	export class $bog_wysiwyg_block extends $.$bog_wysiwyg_block {

		override minimal_height() {
			return 40
		}

		@ $mol_mem
		is_empty() {
			return !this.html()?.replace( /<[^>]*>/g, '' ).trim()
		}

		override sub() {
			return null as any
		}

		override auto() {
			const node = this.dom_node() as HTMLElement
			const doc = this.$.$mol_dom_context.document

			if( node !== doc.activeElement ) {
				const html = this.html()
				if( node.innerHTML !== html ) {
					node.innerHTML = html
				}
			}
		}

		input_event( event?: Event ) {
			if( !event ) return null
			const node = event.target as HTMLElement
			this.html( node.innerHTML )
			return event
		}

		bold_exec( event?: KeyboardEvent ) {
			if( !event ) return null
			event.preventDefault()
			document.execCommand( 'bold' )
			this.html( ( this.dom_node() as HTMLElement ).innerHTML )
			return event
		}

		italic_exec( event?: KeyboardEvent ) {
			if( !event ) return null
			event.preventDefault()
			document.execCommand( 'italic' )
			this.html( ( this.dom_node() as HTMLElement ).innerHTML )
			return event
		}

		underline_exec( event?: KeyboardEvent ) {
			if( !event ) return null
			event.preventDefault()
			document.execCommand( 'underline' )
			this.html( ( this.dom_node() as HTMLElement ).innerHTML )
			return event
		}

		keydown_event( event?: KeyboardEvent ) {
			if( !event ) return null

			const node = event.target as HTMLElement

			// When menu is open, delegate navigation keys
			if( this.menu_open() ) {
				if( [ 'ArrowDown', 'ArrowUp', 'Enter', 'Escape' ].includes( event.key ) ) {
					event.preventDefault()
					this.on_menu_key( event )
					return event
				}
				// Any printable character: close menu and let character through
				if( event.key.length === 1 && !event.ctrlKey && !event.metaKey ) {
					this.on_menu_key( event )
					return event
				}
			}

			// Enter: create new block
			if( event.key === 'Enter' && !event.shiftKey ) {
				event.preventDefault()
				this.on_enter( event )
				return event
			}

			// Backspace on empty: remove block
			if( event.key === 'Backspace' && !node.textContent?.trim() ) {
				event.preventDefault()
				this.on_remove( event )
				return event
			}

			// Slash on empty: open slash menu
			if( event.key === '/' && !node.textContent?.trim() ) {
				event.preventDefault()
				this.on_slash( event )
				return event
			}

			return event
		}

	}

}
