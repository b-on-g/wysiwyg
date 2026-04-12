namespace $.$$ {

	interface Graph_node {
		id: string
		title: string
		x: number
		y: number
		vx: number
		vy: number
	}

	interface Graph_edge {
		source: string
		target: string
	}

	/** Wiki link pattern: [[page_id]] or [[page_id|display text]] */
	const wiki_link_re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g

	export class $bog_wysiwyg_graph extends $.$bog_wysiwyg_graph {

		override sub() {
			return null as any
		}

		override auto() {
			const node = this.dom_node() as HTMLElement
			const pages = this.pages()

			if( pages.length === 0 ) {
				node.textContent = 'No pages yet'
				return
			}

			// Ensure canvas exists
			let canvas = node.querySelector( 'canvas' ) as HTMLCanvasElement | null
			if( !canvas ) {
				node.textContent = ''
				canvas = this.$.$mol_dom_context.document.createElement( 'canvas' )
				canvas.style.position = 'absolute'
				canvas.style.top = '0'
				canvas.style.left = '0'
				canvas.style.display = 'block'
				node.appendChild( canvas )
				this.bind_events( canvas )
			}

			const rect = node.getBoundingClientRect()
			if( rect.width < 1 || rect.height < 1 ) return

			const dpr = this.$.$mol_dom_context.devicePixelRatio || 1
			const w = rect.width
			const h = rect.height

			canvas.style.width = w + 'px'
			canvas.style.height = h + 'px'
			canvas.width = Math.ceil( w * dpr )
			canvas.height = Math.ceil( h * dpr )

			const nodes = this.compute_nodes( w, h )
			const sim = this.simulate( nodes, this.edges(), w, h )
			const current = this.current_page_id()

			const ctx = canvas.getContext( '2d' )
			if( !ctx ) return

			const style = this.$.$mol_dom_context.getComputedStyle( node )
			const colors = {
				edge: style.getPropertyValue( '--mol_theme_line' ).trim() || '#88888866',
				focus: style.getPropertyValue( '--mol_theme_focus' ).trim() || '#3b82f6',
				back: style.getPropertyValue( '--mol_theme_back' ).trim() || '#ffffff',
				line: style.getPropertyValue( '--mol_theme_line' ).trim() || '#cccccc',
				text: style.getPropertyValue( '--mol_theme_text' ).trim() || '#333333',
			}

			this._sim_cache = sim
			this.paint( ctx, dpr, w, h, sim, this.edges(), current, colors )
		}

		_sim_cache: Graph_node[] = []

		compute_nodes( w: number, h: number ): Graph_node[] {
			const pages = this.pages() as {
				id(): string
				title(): string
			}[]

			const cx = w / 2
			const cy = h / 2
			const r = Math.min( w, h ) * 0.3

			return pages.map( ( page, i ) => ({
				id: page.id(),
				title: page.title() || page.id().slice( 0, 8 ),
				x: cx + r * Math.cos( 2 * Math.PI * i / Math.max( pages.length, 1 ) ),
				y: cy + r * Math.sin( 2 * Math.PI * i / Math.max( pages.length, 1 ) ),
				vx: 0,
				vy: 0,
			}) )
		}

		/** Extract [[wiki_link]] edges from all pages' block content */
		@ $mol_mem
		edges(): Graph_edge[] {
			const pages = this.pages() as {
				id(): string
				block_ids?: () => readonly string[]
				block_html?: ( id: string ) => string
			}[]

			const page_ids = new Set( pages.map( p => p.id() ) )
			const result: Graph_edge[] = []

			for( const page of pages ) {
				if( !page.block_ids || !page.block_html ) continue
				const seen = new Set<string>()
				for( const bid of page.block_ids() ) {
					const html = page.block_html( bid ) ?? ''
					let match: RegExpExecArray | null
					wiki_link_re.lastIndex = 0
					while( ( match = wiki_link_re.exec( html ) ) !== null ) {
						const target = match[ 1 ].trim()
						if( page_ids.has( target ) && target !== page.id() && !seen.has( target ) ) {
							seen.add( target )
							result.push({ source: page.id(), target })
						}
					}
				}
			}

			return result
		}

		simulate( nodes: Graph_node[], edges: Graph_edge[], w: number, h: number ): Graph_node[] {
			const result = nodes.map( n => ({ ...n }) )
			if( result.length === 0 ) return result

			const cx = w / 2
			const cy = h / 2
			const node_map = new Map( result.map( n => [ n.id, n ] ) )

			for( let iter = 0; iter < 80; iter++ ) {

				for( let i = 0; i < result.length; i++ ) {
					for( let j = i + 1; j < result.length; j++ ) {
						const a = result[ i ]
						const b = result[ j ]
						let dx = b.x - a.x
						let dy = b.y - a.y
						let dist = Math.sqrt( dx * dx + dy * dy )
						if( dist < 1 ) { dx = 1; dy = 1; dist = 1.41 }
						const force = 5000 / ( dist * dist )
						const fx = dx / dist * force
						const fy = dy / dist * force
						a.vx -= fx
						a.vy -= fy
						b.vx += fx
						b.vy += fy
					}
				}

				for( const edge of edges ) {
					const a = node_map.get( edge.source )
					const b = node_map.get( edge.target )
					if( !a || !b ) continue
					const dx = b.x - a.x
					const dy = b.y - a.y
					const dist = Math.sqrt( dx * dx + dy * dy )
					if( dist < 1 ) continue
					const force = ( dist - 120 ) * 0.02
					const fx = dx / dist * force
					const fy = dy / dist * force
					a.vx += fx
					a.vy += fy
					b.vx -= fx
					b.vy -= fy
				}

				for( const n of result ) {
					n.vx += ( cx - n.x ) * 0.005
					n.vy += ( cy - n.y ) * 0.005
				}

				for( const n of result ) {
					n.vx *= 0.85
					n.vy *= 0.85
					n.x += n.vx
					n.y += n.vy
					n.x = Math.max( 40, Math.min( w - 40, n.x ) )
					n.y = Math.max( 40, Math.min( h - 40, n.y ) )
				}
			}

			return result
		}

		/** Find node at (x, y) in CSS pixel coords */
		node_at( x: number, y: number ): Graph_node | null {
			const nodes = this._sim_cache
			for( let i = nodes.length - 1; i >= 0; i-- ) {
				const n = nodes[ i ]
				const dx = n.x - x
				const dy = n.y - y
				if( dx * dx + dy * dy < 24 * 24 ) return n
			}
			return null
		}

		paint(
			ctx: CanvasRenderingContext2D,
			dpr: number,
			w: number,
			h: number,
			nodes: readonly Graph_node[],
			edges: readonly Graph_edge[],
			current: string,
			colors: { edge: string, focus: string, back: string, line: string, text: string },
		) {
			ctx.save()
			ctx.setTransform( dpr, 0, 0, dpr, 0, 0 )
			ctx.clearRect( 0, 0, w, h )

			const node_map = new Map( nodes.map( n => [ n.id, n ] ) )

			ctx.strokeStyle = colors.edge
			ctx.lineWidth = 1.5
			for( const edge of edges ) {
				const a = node_map.get( edge.source )
				const b = node_map.get( edge.target )
				if( !a || !b ) continue
				ctx.beginPath()
				ctx.moveTo( a.x, a.y )
				ctx.lineTo( b.x, b.y )
				ctx.stroke()

				const angle = Math.atan2( b.y - a.y, b.x - a.x )
				const ax = b.x - 20 * Math.cos( angle )
				const ay = b.y - 20 * Math.sin( angle )
				ctx.beginPath()
				ctx.moveTo( ax, ay )
				ctx.lineTo( ax - 8 * Math.cos( angle - 0.4 ), ay - 8 * Math.sin( angle - 0.4 ) )
				ctx.lineTo( ax - 8 * Math.cos( angle + 0.4 ), ay - 8 * Math.sin( angle + 0.4 ) )
				ctx.closePath()
				ctx.fillStyle = colors.edge
				ctx.fill()
			}

			for( const n of nodes ) {
				const is_current = n.id === current
				const radius = is_current ? 20 : 16

				ctx.beginPath()
				ctx.arc( n.x, n.y, radius, 0, Math.PI * 2 )
				ctx.fillStyle = is_current ? colors.focus : colors.back
				ctx.fill()
				ctx.strokeStyle = is_current ? colors.focus : colors.line
				ctx.lineWidth = is_current ? 2.5 : 1.5
				ctx.stroke()

				ctx.fillStyle = colors.text
				ctx.font = is_current ? 'bold 12px system-ui' : '11px system-ui'
				ctx.textAlign = 'center'
				ctx.textBaseline = 'top'
				const label = n.title.length > 18 ? n.title.slice( 0, 16 ) + '..' : n.title
				ctx.fillText( label, n.x, n.y + radius + 4 )
			}

			ctx.restore()
		}

		_events_bound = false

		bind_events( canvas: HTMLCanvasElement ) {
			if( this._events_bound ) return
			this._events_bound = true

			canvas.addEventListener( 'click', ( e: MouseEvent ) => {
				const rect = canvas.getBoundingClientRect()
				const node = this.node_at( e.clientX - rect.left, e.clientY - rect.top )
				if( node ) this.on_navigate( node.id )
			})

			canvas.addEventListener( 'mousemove', ( e: MouseEvent ) => {
				const rect = canvas.getBoundingClientRect()
				const x = e.clientX - rect.left
				const y = e.clientY - rect.top
				canvas.style.cursor = this.node_at( x, y ) ? 'pointer' : 'default'
			})
		}

	}

}
