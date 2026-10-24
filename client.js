/**
 * Client half of the composer Enter swap.
 *
 * The resident composer resolves Enter inside the bundled Lexical editor: plain
 * Enter reaches KEY_ENTER_COMMAND, which the conversation package binds to
 * "submit", while Shift+Enter falls through to the editor's default line-break
 * command. That mapping is hardcoded, so this plugin swaps the two gestures by
 * intercepting Enter in the capture phase on the composer card and re-playing
 * the *other* gesture as a synthetic Enter keydown on the editor, keeping every
 * shipped guard intact (upload-in-flight toast, busy steering/queueing,
 * empty-draft no-op, ...):
 *
 *   - Shift+Enter -> synthetic Enter keydown (no shift) => shipped submit path
 *   - Enter       -> synthetic Shift+Enter keydown     => shipped line break
 *
 * Only the composer card that mounts this component is affected; every other
 * text surface keeps its normal key handling. While a composer popup (command
 * menu, reference menu, ...) is open, or the input is not in its plain phase,
 * the keys are left to the shipped handlers so menus and command chips keep
 * working.
 */

window.__ModuleLoader__.load({
  id: '@local/dsh-enter-send-swap',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const CARD_SELECTOR = '[data-composer-card]';
    const EDITOR_SELECTOR = '[data-composer-input]';
    // A popup rendered into the card owns Enter while it is open.
    const POPUP_SELECTOR = [
      '[data-trigger-menu]',
      '[role="listbox"]',
      'button[aria-haspopup="listbox"][aria-expanded="true"]',
    ].join(', ');

    function isEnter(event) {
      return event.key === 'Enter' || event.keyCode === 13;
    }

    function isComposing(event) {
      return event.isComposing === true || event.keyCode === 229;
    }

    function isEditor(element) {
      return element !== null
        && element.getAttribute('data-lexical-editor') === 'true'
        && element.getAttribute('contenteditable') === 'true';
    }

    // Re-enter the shipped gesture: the editor turns the synthetic keydown into
    // the very command the same physical key would produce (KEY_ENTER_COMMAND),
    // so submit guards and the line-break command both stay authoritative.
    function replayEnter(editor, shiftKey) {
      editor.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        shiftKey,
        bubbles: true,
        cancelable: true,
      }));
    }

    function ComposerEnterSwap({ useInput }) {
      const anchorRef = React.useRef(null);
      const phaseRef = React.useRef('plain');
      // Guards against the replayed events being intercepted again.
      const replayingRef = React.useRef(false);

      const phase = typeof useInput === 'function'
        ? useInput((state) => state.phase)
        : undefined;
      if (phase !== undefined) phaseRef.current = phase;

      React.useLayoutEffect(() => {
        const anchor = anchorRef.current;
        const card = anchor === null ? null : anchor.closest(CARD_SELECTOR);
        if (card === null) return undefined;

        const onKeyDown = (event) => {
          if (replayingRef.current) return;
          if (!isEnter(event)) return;
          if (isComposing(event)) return;
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          if (phaseRef.current !== 'plain') return;

          const target = event.target;
          const editor = target instanceof Element
            ? target.closest(EDITOR_SELECTOR)
            : null;
          if (editor === null || !card.contains(editor) || !isEditor(editor)) return;
          if (card.querySelector(POPUP_SELECTOR) !== null) return;

          event.preventDefault();
          event.stopPropagation();

          replayingRef.current = true;
          try {
            replayEnter(editor, !event.shiftKey);
          } finally {
            replayingRef.current = false;
          }
        };

        card.addEventListener('keydown', onKeyDown, true);
        return () => card.removeEventListener('keydown', onKeyDown, true);
      }, []);

      return h('span', { ref: anchorRef, hidden: true, 'aria-hidden': 'true' });
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.input.overlay', () => ctx.slots.register({
          name: 'conversation.input.overlay',
          id: 'enter-send-swap',
          order: 50,
        }, ComposerEnterSwap));
      },
    };
  },
});
