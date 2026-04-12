namespace $.$$ {

	const markdown_patterns = [
		{
			// **bold** → <b>bold</b>
			regex: /\*\*(.+?)\*\*/,
			tag: 'b',
		},
		{
			// *italic* → <i>italic</i> — but NOT inside ** sequences
			regex: /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/,
			tag: 'i',
		},
		{
			// `code` → <code>code</code>
			regex: /`(.+?)`/,
			tag: 'code',
		},
		{
			// ~~strike~~ → <s>strike</s>
			regex: /~~(.+?)~~/,
			tag: 's',
		},
	] as const

	const link_pattern = /\[(.+?)\]\((\S+?)\)/

	export class $bog_wysiwyg_block extends $.$bog_wysiwyg_block {

		override minimal_height() {
			return 40
		}

		@ $mol_mem
		is_empty() {
			const html = this.html()
			if( this.type() === 'image' && html?.includes( '<img' ) ) return false
			return !html?.replace( /<[^>]*>/g, '' ).trim()
		}

		override sub() {
			return null as any
		}

		is_image() {
			return this.type() === 'image'
		}

		override auto() {
			const node = this.dom_node() as HTMLElement
			const doc = this.$.$mol_dom_context.document

			if( this.is_image() ) {
				node.contentEditable = 'false'
				const html = this.html()
				if( node.innerHTML !== html ) {
					node.innerHTML = html
				}
				return
			}

			node.contentEditable = 'true'

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
			this.try_markdown( node )
			this.html( node.innerHTML )
			return event
		}

		try_markdown( container: HTMLElement ) {
			const doc = container.ownerDocument
			const sel = doc.defaultView?.getSelection()
			if( !sel || sel.rangeCount === 0 ) return

			const cursor = sel.getRangeAt( 0 )
			const text_node = cursor.startContainer
			if( text_node.nodeType !== Node.TEXT_NODE ) return

			const text = text_node.textContent ?? ''

			// Try link pattern first: [text](url)
			const link_match = link_pattern.exec( text )
			if( link_match ) {
				const link_text = link_match[ 1 ]
				const url = link_match[ 2 ]
				if( link_text && url ) {
					const el = doc.createElement( 'a' )
					el.href = url
					el.textContent = link_text
					this.replace_match_in_text( text_node as Text, link_match, el, sel )
					return
				}
			}

			// Try inline formatting patterns
			for( const pattern of markdown_patterns ) {
				const match = pattern.regex.exec( text )
				if( !match ) continue

				const content = match[ 1 ]
				if( !content ) continue

				const el = doc.createElement( pattern.tag )
				el.textContent = content
				this.replace_match_in_text( text_node as Text, match, el, sel )
				return
			}
		}

		replace_match_in_text( text_node: Text, match: RegExpExecArray, el: HTMLElement, sel: Selection ) {
			const start = match.index
			const end = start + match[ 0 ].length

			const range = text_node.ownerDocument.createRange()
			range.setStart( text_node, start )
			range.setEnd( text_node, end )
			range.deleteContents()
			range.insertNode( el )

			// Place cursor after the inserted element
			const after = text_node.ownerDocument.createRange()
			after.setStartAfter( el )
			after.collapse( true )
			sel.removeAllRanges()
			sel.addRange( after )
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

		strike_exec( event?: KeyboardEvent ) {
			if( !event ) return null
			event.preventDefault()
			document.execCommand( 'strikeThrough' )
			this.html( ( this.dom_node() as HTMLElement ).innerHTML )
			return event
		}

		link_exec( event?: KeyboardEvent ) {
			if( !event ) return null
			event.preventDefault()

			const url = prompt( this.$.$mol_locale.text( '$bog_wysiwyg_block_link_url_prompt' ) )
			if( !url ) return event

			const sel = this.$.$mol_dom_context.document.defaultView?.getSelection()
			if( sel && sel.toString().length > 0 ) {
				document.execCommand( 'createLink', false, url )
			} else {
				const a = this.$.$mol_dom_context.document.createElement( 'a' )
				a.href = url
				a.textContent = url
				document.execCommand( 'insertHTML', false, a.outerHTML )
			}

			this.html( ( this.dom_node() as HTMLElement ).innerHTML )
			return event
		}

		paste_event( event?: ClipboardEvent ) {
			if( !event ) return null

			const items = event.clipboardData?.items
			if( !items ) return event

			for( const item of items ) {
				if( item.type.startsWith( 'image/' ) ) {
					event.preventDefault()
					const file = item.getAsFile()
					if( file ) this.insert_image_file( file )
					return event
				}
			}

			return event
		}

		drop_event( event?: DragEvent ) {
			if( !event ) return null

			const files = event.dataTransfer?.files
			if( !files ) return event

			for( const file of files ) {
				if( file.type.startsWith( 'image/' ) ) {
					event.preventDefault()
					this.insert_image_file( file )
					return event
				}
			}

			return event
		}

		dragover_event( event?: DragEvent ) {
			if( !event ) return null
			event.preventDefault()
			return event
		}

		insert_image_file( file: File ) {
			const reader = new FileReader()
			reader.onload = () => {
				const src = reader.result as string
				this.on_image( src )
			}
			reader.readAsDataURL( file )
		}

		keydown_event( event?: KeyboardEvent ) {
			if( !event ) return null

			const node = event.target as HTMLElement

			// Image blocks: only allow Backspace to remove
			if( this.is_image() ) {
				if( event.key === 'Backspace' || event.key === 'Delete' ) {
					event.preventDefault()
					this.on_remove( event )
					return event
				}
				if( event.key === 'Enter' && !event.shiftKey ) {
					event.preventDefault()
					this.on_enter( event )
					return event
				}
				return event
			}

			// When AI menu is open, delegate navigation keys
			if( this.ai_open() ) {
				if( [ 'ArrowDown', 'ArrowUp', 'Enter', 'Escape' ].includes( event.key ) ) {
					event.preventDefault()
					this.on_ai_key( event )
					return event
				}
				if( event.key.length === 1 && !event.ctrlKey && !event.metaKey ) {
					this.on_ai_key( event )
					return event
				}
			}

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

			// Ctrl/Cmd+J: open AI menu
			if( event.key === 'j' && ( event.ctrlKey || event.metaKey ) && !event.shiftKey ) {
				event.preventDefault()
				this.on_ai( event )
				return event
			}

			// Ctrl/Cmd+K: insert link
			if( event.key === 'k' && ( event.ctrlKey || event.metaKey ) && !event.shiftKey ) {
				this.link_exec( event )
				return event
			}

			return event
		}

	}

}
