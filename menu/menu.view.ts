namespace $.$$ {

	export class $bog_wysiwyg_menu extends $.$bog_wysiwyg_menu {

		commands() {
			return [
				{ id: 'paragraph', title: '\u00B6 \u0422\u0435\u043A\u0441\u0442' },
				{ id: 'heading1', title: 'H1 \u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A 1' },
				{ id: 'heading2', title: 'H2 \u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A 2' },
				{ id: 'heading3', title: 'H3 \u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A 3' },
				{ id: 'code', title: '</> \u041A\u043E\u0434' },
				{ id: 'quote', title: '\u275D \u0426\u0438\u0442\u0430\u0442\u0430' },
				{ id: 'list', title: '\u2022 \u0421\u043F\u0438\u0441\u043E\u043A' },
				{ id: 'divider', title: '\u2014 \u0420\u0430\u0437\u0434\u0435\u043B\u0438\u0442\u0435\u043B\u044C' },
			]
		}

		option_rows() {
			return this.commands().map( cmd => this.Option( cmd.id ) )
		}

		option_title( id: string ) {
			return this.commands().find( c => c.id === id )?.title ?? ''
		}

		option_active( id: string ) {
			const cmds = this.commands()
			const idx = this.index()
			return cmds[ idx ]?.id === id
		}

		option_click( id: string, event?: Event ) {
			if( !event ) return null
			this.picked( id )
			this.showed( false )
			return event
		}

		handle_key( event?: KeyboardEvent ) {
			if( !event ) return null

			const cmds = this.commands()

			if( event.key === 'ArrowDown' ) {
				this.index( Math.min( this.index() + 1, cmds.length - 1 ) )
				return event
			}

			if( event.key === 'ArrowUp' ) {
				this.index( Math.max( this.index() - 1, 0 ) )
				return event
			}

			if( event.key === 'Enter' ) {
				const cmd = cmds[ this.index() ]
				if( cmd ) {
					this.picked( cmd.id )
					this.showed( false )
				}
				return event
			}

			return event
		}

		pos_y_str() {
			return this.pos_y() + 'px'
		}

		pos_x_str() {
			return this.pos_x() + 'px'
		}

	}

}
