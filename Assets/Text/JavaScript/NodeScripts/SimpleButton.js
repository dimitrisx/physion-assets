/**
 * Turns a node into a clickable button. By default it becomes semi-transparent normally and
 * fully opaque while hovered, with a pointer cursor to signal it's interactive.
 *
 * This script has no UI-exposed parameters; open the script and edit the onPointer* methods to
 * customize the hover and click behavior.
 */
class SimpleButton {

	constructor(node) {
		this.node = node;

		this.eventMap = {
			"pointerdown": "onPointerDown",
			"pointerup": "onPointerUp",
			"pointermove": "onPointerMove",
			"pointerover": "onPointerOver",
			"pointerout": "onPointerOut"
		};

		this.boundHandlers = {};
		for (const [event, handler] of Object.entries(this.eventMap)) {
			this.boundHandlers[event] = this[handler].bind(this);
		}

		this.eventsConnected = false; // Tracks whether event listeners are currently attached.
		this.stopEventPropagation = true; // If true, prevents pointer events from bubbling to the UI.

		this.hoverAlpha = 1;
		this.normalAlpha = 0.8;
		this.node.alpha = this.normalAlpha;
	}

	/** Called when the pointer (mouse, pen, or touch) is pressed on the Node. */
	onPointerDown(e) {
		this.processEvent(e);
	}

	/** Called when the pointer is released over the Node. */
	onPointerUp(e) {
		this.processEvent(e);
	}

	/** Called when the pointer moves over the Node. */
	onPointerMove(e) {
		this.processEvent(e);
	}

	/** Called when the pointer enters the boundary of the Node. */
	onPointerOver(e) {
		this.processEvent(e);

		this.node.alpha = this.hoverAlpha;
		this.node.container.cursor = "pointer";
	}

	/** Called when the pointer leaves the boundary of the Node. */
	onPointerOut(e) {
		this.processEvent(e);

		this.node.alpha = this.normalAlpha;
		this.node.container.cursor = "auto";
	}

	// --- internals below this line ---
	destroy() {
		this.toggleEvents(false);
	}

	update(delta) {
		if (!this.eventsConnected) {
			this.toggleEvents(true);
		}
	}

	onSceneStarted(scene) {
		this.toggleEvents(true);
	}

	onSceneStopped(scene) {
		this.toggleEvents(false);
	}

	toggleEvents(connect) {

		if (this.eventsConnected === connect) {
			return;
		}

		this.eventsConnected = connect;

		const container = this.node.container;
		const method = connect ? "on" : "off";

		container.eventMode = connect ? "static" : "none";

		for (const [event, boundHandler] of Object.entries(this.boundHandlers)) {
			container[method](event, boundHandler);
		}
	}

	processEvent(e) {
		if (this.stopEventPropagation) {
			e.stopPropagation();
		}
	}
}
