---
name: editor-architecture
description: Use when building, extending, or reviewing architecture for web editors.
---

# Generic editor architecture

A web editor is a part of the application whose main job is create and change a persistent self-contained document (project).

## Concepts

- Clear separation of React view layer and business logic layer. No business logic should be implemented in React components or hooks.

## Ownership hierarchy

- Editor
    - EditorController (handles mutation of runtime project)
        - Runtime project model (serialized from and serialized to persisted Project)
            - Tools
            - HistoryController
            - Commands
        - Save/Load services (serialization and async api calls)
    - Services/Repositories
        - ReactBridge (handles ui, UI-only ephemeral state)
        - Workspaces (handles visuals - canvas/pixi.js/three.js canvas)
        - Interaction system

# Editor

- Editor - root object owns everything, services, controller, ReactBridge, three.js / pixi.js rendering. An instance of editor.

- Project represents persistent state, which should be serialized between editor sessions.

- EditorController owns application state including project and methods to modify it. Also it owns tools, HistoryController, commands. All the abstractions that do mutate application state.

## Model

Runtime project model. Data container. Methods for instance lookups. Instances are modeled with separate value classes.

## Commands

- HistoryController - application's state is mutated via command interface - undoable / redoable. Applies / tracks / unapplies commands. Commands are built via CommandFactory

```
interface EditorCommand {
	execute(): void
	undo?(): void
	redo?(): void
	isUndoable?(): boolean
}
```

transactions/batching, and coalescing for series of interactions, for example drag.

## Services

Use DI if available for Services/utility classes (stateless). Editor if not. No free floating functions.

Resource repositories, save/load controllers, service classes, math processors and such are owned by editor controller.

## React integration

React components are kept dumb presentation only. View/ViewModel/Model separation. All logic is extracted to Editor Controller and Editor Services. Only local state is allowed.

### React-authored

Applicable for Next.js - based apps. Vite SPAs.

If editor is mounted via React application, root editor component and only it may use `useEditorLoader` hook. It executes async operation, acquires resources and creates editor instance. Editor instance may be used by components by useEditor hook (useContext).

### Class-authored

Editor owns presenter which creates react view instance. ViewModel is used instead of ReactBridge.

### React bridge

One or several class which are used for data-binding and exposing methods to components. Owns state that must be synchronized with react ui. Either a single ReactBridge or split into logical parts if it becomes too heavy. Used via hook - useReactBridge (access editor.bridge).

## Editor workspace

- single interactable surface
    - svg canvas
    - three.js canvas
    - HTML5 canvas
    - pixi.js canvas
    - etc
- dom element
- attaches event listeners per wrapper element
- owns interaction system

## Interaction system

Is owned by editor workspace. Consists of:

- CanvasEventHandler - raw events pre-processor, detects drag, double click, single click. Builds synthetic InteractionEvent object. Owns hit tester and anything else, required to build InteractionEvent.

- InteractionEvent - synthetic event abstraction, wrapped around native event. Contains all the required event payload, including hit testing result. Event payload can be wrapped into InteractionInfo and InteractionContext objects.

```
interface InteractionEvent {
	type: CanvasEventType
	x: number
	y: number
	dx: number
	dy: number
	modifiers: InteractionEventModifiers
	info: InteractionInfo
	context: InteractionContext
	raw: Event
}
```

- InteractionHandlerRouter - dispatches synthetic event object to handlers. Decides which handler should be called based on handler's ability to handle certain event, whether handler is capturing the events, handlers prority.

- InteractionHandler interface - event handler interface. Consumes and handles InteractionEvent. Uses commands and controller to mutate application state. Has priority numeric value - handlers are selected and executed based on priority. Is able to capture/release event processing pipeline.

```
interface InteractionHandler {
	id: string
	priority: number
	isEnabled(context: InteractionEvent): boolean
	onEvent(event: InteractionEvent): Promise<InteractionHandlerResult>
}
```

- Each event handler returns InteractionHandlerResult.

```
interface InteractionHandlerResult {
	kind: 'pass' | 'handled' | 'capture' | 'release'
	setHandled(): InteractionHandlerResult
	setCapture(): InteractionHandlerResult
	setReleaseCapture(): InteractionHandlerResult
	setPass(): InteractionHandlerResult
}
```

### Tool

Tools describe current state of interaction. Treated like states of state machine. Tools switch hit testable objects. Tools switch state of individual InteractionHandler's. In general they adjust Interaction System to current state of the application.

### InteractionInfo and hit testing

InteractionInfo ia a part of synthetic event shape, based on which concrete InteractionHandler performs app state mutations (via commands).

Hit testing usually is performed each frame or during mouse moves for performance.

InteractionInfo usually owns current hit results testing info.

## InteractionContext

InteractionContext - persistent info per gesture (group of events).

### Hit testing context (repository)

A class owned by editor workspace describing current available hit testable elements. Switching current interaction tool rebuilds current list of colliders.

3d widgets consisting of separate 3d objects as handles always have visual Object3D element and invisible collider, sphere or rectangle, used only for hit testing.

3d widget elements react to hover indicating that hit testing did succeed and correct manipulator will be affected during operation.
