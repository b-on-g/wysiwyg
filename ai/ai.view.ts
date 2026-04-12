namespace $.$$ {

	export class $bog_wysiwyg_ai extends $.$bog_wysiwyg_ai {

		commands() {
			return [
				{ id: 'continue', title: '\u270D \u0414\u043E\u043F\u0438\u0441\u0430\u0442\u044C', prompt: '\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438 \u0442\u0435\u043A\u0441\u0442 \u0432 \u0442\u043E\u043C \u0436\u0435 \u0441\u0442\u0438\u043B\u0435. \u0412\u0435\u0440\u043D\u0438 \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u043E\u0432\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 (\u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0435\u043D\u0438\u0435), \u0431\u0435\u0437 \u0438\u0441\u0445\u043E\u0434\u043D\u043E\u0433\u043E.' },
				{ id: 'rewrite', title: '\u{1F504} \u041F\u0435\u0440\u0435\u043F\u0438\u0441\u0430\u0442\u044C', prompt: '\u041F\u0435\u0440\u0435\u043F\u0438\u0448\u0438 \u0442\u0435\u043A\u0441\u0442 \u0431\u043E\u043B\u0435\u0435 \u044F\u0441\u043D\u043E \u0438 \u0447\u0438\u0442\u0430\u0431\u0435\u043B\u044C\u043D\u043E.' },
				{ id: 'translate', title: '\u{1F310} \u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438', prompt: 'Translate to English.' },
				{ id: 'simplify', title: '\u{1F4A1} \u0423\u043F\u0440\u043E\u0441\u0442\u0438\u0442\u044C', prompt: '\u0423\u043F\u0440\u043E\u0441\u0442\u0438 \u0442\u0435\u043A\u0441\u0442, \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0432 \u0441\u043C\u044B\u0441\u043B.' },
			]
		}

		option_rows() {
			if( this.loading() ) {
				return [ '\u2026 \u0413\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F...' ]
			}
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
			this.run_command( id )
			return event
		}

		run_command( id: string ) {
			const cmd = this.commands().find( c => c.id === id )
			if( !cmd ) return

			const context = this.context()
			if( !context ) return

			this.loading( true )

			const keys = this.$.$mol_github_model_keys
			const key = keys[ Math.floor( Math.random() * keys.length ) ]
			const models = this.$.$mol_github_model_polyglots
			const model_name = models[ Math.floor( Math.random() * models.length ) ]

			const body = JSON.stringify( {
				model: model_name,
				stream: false,
				response_format: { type: 'json_object' },
				messages: [
					{ role: 'system', content: 'You are a writing assistant. Respond in JSON: {"text": "your result"}. Return only the result text, no explanations.' },
					{ role: 'user', content: `${ cmd.prompt }\n\n\u0422\u0435\u043A\u0441\u0442:\n${ context }` },
				],
			} )

			fetch( 'https://models.github.ai/inference/chat/completions', {
				method: 'POST',
				headers: {
					'Authorization': 'Bearer ' + key,
					'Content-Type': 'application/json',
				},
				body,
			} )
			.then( resp => {
				if( !resp.ok ) throw new Error( `AI request failed: ${ resp.status }` )
				return resp.json()
			} )
			.then( data => {
				const content = data?.choices?.[ 0 ]?.message?.content ?? ''
				let text: string
				try {
					const parsed = JSON.parse( content )
					text = parsed?.text ?? content
				} catch {
					text = content
				}
				this.loading( false )
				this.showed( false )
				this.on_result( text )
			} )
			.catch( error => {
				this.loading( false )
				this.showed( false )
				console.error( 'AI error:', error )
			} )
		}

		pos_y_str() {
			return this.pos_y() + 'px'
		}

		pos_x_str() {
			return this.pos_x() + 'px'
		}

	}

}
