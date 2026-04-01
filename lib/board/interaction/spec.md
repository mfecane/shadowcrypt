class EventPreprocessor

attached to pixi canvas

puts native events to it

handleing those it detects:

detects pointer tap/click event
detects ponter double tap/double click event
detects pointer/mouse drag event - dragstart/move/end
detects pinch zoom/rotate event

class InteractionEvent

events are classes with payload (clicked element of pixi scene), coordinates, delta coordinates, raw event and other relevant data
provision for transform widgets as interctable objects in future

class EventRouter

then events are routed to tools

tool can capture, all events captured until released

interface Tool

tool have interface
and many implementations

Navigation Tool
add pinch zoom/pan/rotate tool that handles those events
handes wheel events

SelectTool
add select envent that handles click if there is an selectable element

FulscreenTool
double tap/click to view image at fullscreen overlay

Other tools will be based on widgets

reference @interaction2 implementation from another project for guidance
