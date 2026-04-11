namespace $.$$ {

	export class $bog_wysiwyg_block extends $.$bog_wysiwyg_block {

		override minimal_height() {
			return 40
		}

		@ $mol_mem
		is_empty() {
			return !this.html()?.replace( /<[^>]*>/g, '' ).trim()
		}

		// Prevent $mol from managing DOM children — contenteditable manages its own
		override sub() {
			return null as any
		}

		// Sync HTML content to DOM after render
		override auto() {
			const node = this.dom_node() as HTMLElement
			const doc = this.$.$mol_dom_context.document

			// Only update innerHTML when not actively editing
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

		keydown_event( event?: KeyboardEvent ) {
			if( !event ) return null

			const node = event.target as HTMLElement

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

			// Bold: Ctrl/Cmd + B
			if( ( event.ctrlKey || event.metaKey ) && event.key === 'b' ) {
				event.preventDefault()
				document.execCommand( 'bold' )
				this.html( node.innerHTML )
				return event
			}

			// Italic: Ctrl/Cmd + I
			if( ( event.ctrlKey || event.metaKey ) && event.key === 'i' ) {
				event.preventDefault()
				document.execCommand( 'italic' )
				this.html( node.innerHTML )
				return event
			}

			// Underline: Ctrl/Cmd + U
			if( ( event.ctrlKey || event.metaKey ) && event.key === 'u' ) {
				event.preventDefault()
				document.execCommand( 'underline' )
				this.html( node.innerHTML )
				return event
			}

			return event
		}

	}

}
