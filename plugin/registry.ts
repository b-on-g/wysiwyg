namespace $ {

	export class $bog_wysiwyg_plugin_registry {

		static plugins = new Map< string, $bog_wysiwyg_plugin_config >()

		static register( config: $bog_wysiwyg_plugin_config ) {
			this.plugins.set( config.id, config )
		}

		static all() {
			return [ ...this.plugins.values() ]
		}

		static get( id: string ) {
			return this.plugins.get( id ) ?? null
		}

	}

}
