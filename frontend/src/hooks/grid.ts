import { StyleValue } from 'vue'
import { Orientation } from './useCollectionViewer'

export function grid(columns: number, orientation: Orientation): StyleValue {
	switch (orientation) {
		case Orientation.vertical: {
			return {
				gridTemplateColumns: `repeat(${columns}, 400px)`,
				gridAutoRows: '40px',
				gridAutoFlow: 'row',
			}
		}
		case Orientation.horizontal: {
			return {
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
			return { gridRowStart: `span ${Math.round(10 * aspect)}` }
		case Orientation.horizontal:
			return { gridColumnStart: `span ${Math.round((10 * 1) / aspect)}` }
	}
}
