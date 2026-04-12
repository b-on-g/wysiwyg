namespace $ {

	if( typeof KeyboardEvent === 'undefined' ) {
		( globalThis as any ).KeyboardEvent = class KeyboardEvent extends Event {
			readonly key: string
			readonly code: string
			readonly ctrlKey: boolean
			readonly shiftKey: boolean
			readonly altKey: boolean
			readonly metaKey: boolean
			constructor( type: string, init?: KeyboardEventInit ) {
				super( type, init )
				this.key = init?.key ?? ''
				this.code = init?.code ?? ''
				this.ctrlKey = init?.ctrlKey ?? false
				this.shiftKey = init?.shiftKey ?? false
				this.altKey = init?.altKey ?? false
				this.metaKey = init?.metaKey ?? false
			}
		}
	}

	if( typeof MouseEvent === 'undefined' ) {
		( globalThis as any ).MouseEvent = class MouseEvent extends Event {
			readonly clientX: number
			readonly clientY: number
			readonly button: number
			constructor( type: string, init?: MouseEventInit ) {
				super( type, init )
				this.clientX = init?.clientX ?? 0
				this.clientY = init?.clientY ?? 0
				this.button = init?.button ?? 0
			}
		}
	}

	if( typeof ClipboardEvent === 'undefined' ) {
		( globalThis as any ).ClipboardEvent = class ClipboardEvent extends Event {
			readonly clipboardData: DataTransfer | null
			constructor( type: string, init?: any ) {
				super( type, init )
				this.clipboardData = init?.clipboardData ?? null
			}
		}
	}

	if( typeof DragEvent === 'undefined' ) {
		( globalThis as any ).DragEvent = class DragEvent extends Event {
			readonly dataTransfer: DataTransfer | null
			constructor( type: string, init?: any ) {
				super( type, init )
				this.dataTransfer = init?.dataTransfer ?? null
			}
		}
	}

	if( typeof InputEvent === 'undefined' ) {
		( globalThis as any ).InputEvent = class InputEvent extends Event {
			readonly data: string | null
			readonly inputType: string
			constructor( type: string, init?: any ) {
				super( type, init )
				this.data = init?.data ?? null
				this.inputType = init?.inputType ?? ''
			}
		}
	}

}
