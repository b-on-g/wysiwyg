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

		/** Canvas pixel dimensions (accounting for DPR) */
		@ $mol_mem
		canvas_width() {
			return Math.ceil( ( this.view_rect()?.width ?? 600 ) * ( this.$.$mol_dom_context.devicePixelRatio || 1 ) )
		}

		@ $mol_mem
		canvas_height() {
			return Math.ceil( ( this.view_rect()?.height ?? 400 ) * ( this.$.$mol_dom_context.devicePixelRatio || 1 ) )
		}

		/** Logical canvas size (CSS pixels) */
		logical_width() {
			return this.canvas_width() / ( this.$.$mol_dom_context.devicePixelRatio || 1 )
		}

		logical_height() {
			return this.canvas_height() / ( this.$.$mol_dom_context.devicePixelRatio || 1 )
		}

		/** Extract page info as graph nodes in a circle layout */
		@ $mol_mem
		nodes(): Graph_node[] {
			const pages = this.pages() as {
				id(): string
				title(): string
			}[]

			const w = this.logical_width()
			const h = this.logical_height()
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
				block_ids(): readonly string[]
				block_html( id: string ): string
			}[]

			const page_ids = new Set( pages.map( p => p.id() ) )
			const result: Graph_edge[] = []

			for( const page of pages ) {
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

		/** Simulation state -- mutable positions updated each tick */
		@ $mol_mem
		sim_nodes(): Graph_node[] {
			return this.nodes().map( n => ({ ...n }) )
		}

		/** Run one tick of force simulation */
		sim_tick() {
			const nodes = this.sim_nodes()
			const edges = this.edges()

			if( nodes.length === 0 ) return

			const node_map = new Map( nodes.map( n => [ n.id, n ] ) )
			const w = this.logical_width()
			const h = this.logical_height()
			const cx = w / 2
			const cy = h / 2

			// Repulsion between all node pairs
			for( let i = 0; i < nodes.length; i++ ) {
				for( let j = i + 1; j < nodes.length; j++ ) {
					const a = nodes[ i ]
					const b = nodes[ j ]
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

			// Attraction along edges
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

			// Center gravity
			for( const n of nodes ) {
				n.vx += ( cx - n.x ) * 0.005
				n.vy += ( cy - n.y ) * 0.005
			}

			// Damping and position update
			for( const n of nodes ) {
				n.vx *= 0.85
				n.vy *= 0.85
				n.x += n.vx
				n.y += n.vy
				n.x = Math.max( 40, Math.min( w - 40, n.x ) )
				n.y = Math.max( 40, Math.min( h - 40, n.y ) )
			}
		}

		/** Dragged node id */
		@ $mol_mem
		drag_id( next?: string | null ) {
			return next ?? null
		}

		/** Attach native mouse events once to the canvas */
		_events_bound = false

		bind_events() {
			if( this._events_bound ) return
			this._events_bound = true

			const canvas = this.Canvas().dom_node() as HTMLCanvasElement

			canvas.addEventListener( 'mousedown', ( e: MouseEvent ) => {
				const rect = canvas.getBoundingClientRect()
				const node = this.node_at( e.clientX - rect.left, e.clientY - rect.top )
				if( node ) this.drag_id( node.id )
			})

			canvas.addEventListener( 'mousemove', ( e: MouseEvent ) => {
				const rect = canvas.getBoundingClientRect()
				const x = e.clientX - rect.left
				const y = e.clientY - rect.top
				const id = this.drag_id()
				if( !id ) {
					canvas.style.cursor = this.node_at( x, y ) ? 'pointer' : 'default'
					return
				}
				const node = this.sim_nodes().find( n => n.id === id )
				if( !node ) return
				node.x = x
				node.y = y
				node.vx = 0
				node.vy = 0
			})

			canvas.addEventListener( 'mouseup', () => {
				this.drag_id( null )
			})

			canvas.addEventListener( 'click', ( e: MouseEvent ) => {
				const rect = canvas.getBoundingClientRect()
				const node = this.node_at( e.clientX - rect.left, e.clientY - rect.top )
				if( node ) this.on_navigate( node.id )
			})
		}

		/** Find node at (x, y) in CSS pixel coords */
		node_at( x: number, y: number ): Graph_node | null {
			const nodes = this.sim_nodes()
			for( let i = nodes.length - 1; i >= 0; i-- ) {
				const n = nodes[ i ]
				const dx = n.x - x
				const dy = n.y - y
				if( dx * dx + dy * dy < 24 * 24 ) return n
			}
			return null
		}

		/** Read theme colors from computed style of own DOM node */
		read_theme_colors() {
			try {
				const el = this.dom_node()
				const style = this.$.$mol_dom_context.getComputedStyle( el )
				return {
					focus: style.getPropertyValue( '--mol_theme_focus' ).trim() || '#3b82f6',
					card: style.getPropertyValue( '--mol_theme_card' ).trim() || '#ffffff',
					line: style.getPropertyValue( '--mol_theme_line' ).trim() || '#cccccc',
					text: style.getPropertyValue( '--mol_theme_text' ).trim() || '#333333',
					shade: style.getPropertyValue( '--mol_theme_shade' ).trim() || '#888888',
				}
			} catch {
				return { focus: '#3b82f6', card: '#ffffff', line: '#cccccc', text: '#333333', shade: '#888888' }
			}
		}

		/** Animation frame tracking */
		_anim_id = 0
		_running = false

		start_sim() {
			if( this._running ) return
			this._running = true
			this.tick_loop()
		}

		tick_loop() {
			if( !this._running ) return
			this.sim_tick()
			this.render_canvas()
			this._anim_id = requestAnimationFrame( () => this.tick_loop() )
		}

		stop_sim() {
			this._running = false
			if( this._anim_id ) cancelAnimationFrame( this._anim_id )
			this._anim_id = 0
		}

		override auto() {
			this.bind_events()
			this.start_sim()
		}

		/** Main canvas draw routine (called from animation loop, not reactive) */
		render_canvas() {
			const canvas = this.Canvas().dom_node() as HTMLCanvasElement
			const ctx = canvas.getContext( '2d' )
			if( !ctx ) return

			const dpr = this.$.$mol_dom_context.devicePixelRatio || 1
			const w = this.logical_width()
			const h = this.logical_height()

			ctx.save()
			ctx.setTransform( dpr, 0, 0, dpr, 0, 0 )
			ctx.clearRect( 0, 0, w, h )

			const nodes = this.sim_nodes()
			const edges = this.edges()
			const node_map = new Map( nodes.map( n => [ n.id, n ] ) )
			const current = this.current_page_id()
			const colors = this.read_theme_colors()

			// Draw edges
			ctx.strokeStyle = colors.shade + '66'
			ctx.lineWidth = 1.5
			for( const edge of edges ) {
				const a = node_map.get( edge.source )
				const b = node_map.get( edge.target )
				if( !a || !b ) continue
				ctx.beginPath()
				ctx.moveTo( a.x, a.y )
				ctx.lineTo( b.x, b.y )
				ctx.stroke()

				// Arrow head
				const angle = Math.atan2( b.y - a.y, b.x - a.x )
				const ax = b.x - 20 * Math.cos( angle )
				const ay = b.y - 20 * Math.sin( angle )
				ctx.beginPath()
				ctx.moveTo( ax, ay )
				ctx.lineTo(
					ax - 8 * Math.cos( angle - 0.4 ),
					ay - 8 * Math.sin( angle - 0.4 ),
				)
				ctx.lineTo(
					ax - 8 * Math.cos( angle + 0.4 ),
					ay - 8 * Math.sin( angle + 0.4 ),
				)
				ctx.closePath()
				ctx.fillStyle = colors.shade + '66'
				ctx.fill()
			}

			// Draw nodes
			for( const n of nodes ) {
				const is_current = n.id === current
				const radius = is_current ? 20 : 16

				ctx.beginPath()
				ctx.arc( n.x, n.y, radius, 0, Math.PI * 2 )
				ctx.fillStyle = is_current ? colors.focus : colors.card
				ctx.fill()
				ctx.strokeStyle = is_current ? colors.focus : colors.line
				ctx.lineWidth = is_current ? 2.5 : 1.5
				ctx.stroke()

				// Title label
				ctx.fillStyle = colors.text
				ctx.font = is_current ? 'bold 12px system-ui' : '11px system-ui'
				ctx.textAlign = 'center'
				ctx.textBaseline = 'top'
				const label = n.title.length > 18 ? n.title.slice( 0, 16 ) + '..' : n.title
				ctx.fillText( label, n.x, n.y + radius + 4 )
			}

			ctx.restore()
		}

		destructor() {
			this.stop_sim()
			super.destructor()
		}

	}

}
