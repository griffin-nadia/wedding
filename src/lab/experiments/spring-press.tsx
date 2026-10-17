/**
 * Experiment: spring button press. The press dips to 0.97 and springs back a touch past 1 with a CSS linear()
 * spring, no script. Still under reduced motion. To promote: move the two rules into the btn-primary / state
 * utilities in index.css.
 */
const css = `
.x-spring { transition: transform 420ms linear(0, 0.5 8%, 1.06 22%, 1.02 32%, 0.99 45%, 1 60%, 1); }
.x-spring:active { transform: scale(0.97); transition-duration: 90ms; transition-timing-function: ease-out; }
@media (prefers-reduced-motion: reduce) { .x-spring, .x-spring:active { transition: none; transform: none; } }
`
export default function SpringPress() {
  return (
    <div className="flex flex-wrap gap-3">
      <style>{css}</style>
      <button type="button" className="btn-primary x-spring h-(--button-height) rounded-(--button-radius) px-(--button-pad) font-label font-medium">RSVP</button>
      <button type="button" className="state x-spring h-(--button-height) rounded-(--button-radius) px-(--button-pad) font-label font-medium text-foreground">Show the driver</button>
    </div>
  )
}
