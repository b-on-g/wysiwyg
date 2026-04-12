namespace $.$$ {

	export class $bog_wysiwyg_menu extends $.$bog_wysiwyg_menu {

		commands() {
			const t = ( key: string ) => this.$.$mol_locale.text( key )
			const builtin = [
				{ id: 'paragraph', title: '\u00B6 ' + t( '$bog_wysiwyg_menu_command_paragraph' ) },
				{ id: 'heading1', title: 'H1 ' + t( '$bog_wysiwyg_menu_command_heading1' ) },
				{ id: 'heading2', title: 'H2 ' + t( '$bog_wysiwyg_menu_command_heading2' ) },
				{ id: 'heading3', title: 'H3 ' + t( '$bog_wysiwyg_menu_command_heading3' ) },
				{ id: 'code', title: '</> ' + t( '$bog_wysiwyg_menu_command_code' ) },
				{ id: 'quote', title: '\u275D ' + t( '$bog_wysiwyg_menu_command_quote' ) },
				{ id: 'list', title: '\u2022 ' + t( '$bog_wysiwyg_menu_command_list' ) },
				{ id: 'divider', title: '\u2014 ' + t( '$bog_wysiwyg_menu_command_divider' ) },
				{ id: 'image', title: '\uD83D\uDDBC ' + t( '$bog_wysiwyg_menu_command_image' ) },
			]

			const plugins = $bog_wysiwyg_plugin_registry.all().map( p => ({
				id: p.id,
				title: p.title,
			}) )

			return [ ...builtin, ...plugins ]
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

		pos_y_str() {
			return this.pos_y() + 'px'
		}

		pos_x_str() {
			return this.pos_x() + 'px'
		}

	}

}
