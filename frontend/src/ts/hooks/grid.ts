import { StyleValue } from 'vue'
import { Orientation } from './useCollectionViewer'

export function grid(columns: number, orientation: Orientation, scale: number, x: number, y: number): StyleValue {
	let style = {
		transform: `translate(${x}px, ${y}px) scale(${scale})`,
	}
	switch (orientation) {
		case Orientation.vertical: {
			return {
				...style,
				gridTemplateColumns: `repeat(${columns}, 400px)`,
				gridAutoRows: '40px',
				gridAutoFlow: 'row',
			}
		}
		case Orientation.horizontal: {
			return {
				...style,
				gridTemplateRows: `repeat(${columns}, 400px)`,
				gridAutoColumns: '40px',
				gridAutoFlow: 'column',
			}
		}
	}
}

export function gridElement(orientation: Orientation, aspect: number) {
	switch (orientation) {
		case Orientation.vertical:
			return { gridRowStart: `span ${Math.floor(10 * aspect)}` }
		case Orientation.horizontal:
			return { gridColumnStart: `span ${Math.floor((10 * 1) / aspect)}` }
	}
}
