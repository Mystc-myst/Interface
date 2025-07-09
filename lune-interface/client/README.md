# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

Lune Diary — Design Direction ✦

> A space not for doing more, but for feeling more clearly.



Lune Diary is a memory‑first journaling interface. Its UI is built not around productivity, but around resonance—a place for users to slow down, resurface emotional patterns, and activate latent memory through calm interaction.

This document defines the design philosophy, color logic, generative principles, and developer notes that shape the Lune interface.


---

🌑 Design Purpose

We design not for attention—but for activation.

Each visual decision is made to:

Trigger recollection without demand

Offer rhythm and pause

Create minimal resistance to entry

Maintain psychological safety and soft engagement


> Lune is not an app. It is a mirror that listens.




---

🎨 Color System

Colors in Lune Diary are not decorative. They act as emotional triggers, each carrying symbolic, cognitive, and metabolic meaning.

Color Name	Hex	Function	Symbolic Role

Violet Deep	#5B2EFF	Primary background, gradients, hover states	Depth, intuition, interiority. Evokes the unconscious and deep memory—the “void” users step into when they begin to write.
Moon Mist	#E9E7FF	Text‑area fill, placeholder text, quiet dividers	Soft illumination. A breathing space that contrasts Violet Deep without harshness—represents presence.
Brazen Gold	#F3B43F	Action buttons (save, send), hover highlights	A pulse of courage. Rare and bold—only when the user takes decisive action.
Ink Black	#050409	Page edges, shadows, outer gradient ends	Infinite silence. Buffers focus areas, making space feel safe and boundaried.
Ember Red	#FF4455 @ 50%	Error states, trauma loops	Fast ping for misalignment or stress. Used sparingly to avoid overstimulation.
Aqua Loop	#22D4C5	Optional exploratory chips, hyperlinks	Discovery and curiosity. A playful deviation, used sparingly.


🌌 Radial Gradient — Portal to Depth

html, body {
  background: radial-gradient(
    circle at 50% 40%,
    #5B2EFF 0%,      /* Violet Deep core   */
    #050409 60%,     /* Ink Black envelope*/
    #050409 100%
  );
  background-attachment: fixed;  /* no parallax jitter */
  background-repeat: no-repeat;
}

The radial gradient mirrors the psychological act of diving inward: a portal to the self.


---

🌀 Generative Principles

The Lune interface is structured around 10 living‑system principles that consistently guide every design decision:

1. Metabolic Parsimony

> Spend energy only where it expands future options.



Minimal color palette, maximum emotional range

Only essential actions surfaced (write, save, reflect)

No animation or ornamentation unless meaningful



2. Dual‑Speed Signalling

> Pair a fast, clear signal with a slow, contextual echo.



Save button gives a fast glow ping (hover) and slow release (click)

Placeholder fades in gradually after 1 s idle

Brazen Gold buttons pulse gently post‑click for confirmation



3. Hebbian Thickening

> Prefer patterns that repeat and crystallize memory.



Tag buttons repeat across sessions, always styled the same

Entry layout and positioning never change unexpectedly

Hashtags float like memory nodes: ghostly at rest, golden on attention



4. Predictive Tension

> Use small surprises, never shocks.



Hovering reveals gold with a soft 200 ms ease‑in

Entry save produces a subtle downward shift and glow

Nothing snaps; transitions feel lived‑in



5. Exploration–Exploitation Rhythm

> Alternate between calm space and points of action.



The writing field is the “calm lagoon”

Buttons like Save and Chat with Lune are the peaks

Design pulls the user back and forth like breathing



6. Constraint Satisfaction

> Balance competing needs (readability, atmosphere, clarity).



50 ch max width for optimal line reading

32 pt vertical rhythm ensures comfort without wasted space

Action buttons are grouped close but not crowded



7. Redundancy‑with‑Elegance

> Duplicate only the pathways whose failure would collapse the system.



Save available via keyboard and button

Tag interface repeats known behaviors to reduce novelty stress

Text inputs auto‑save invisibly every 30 s (optional)



8. Symmetry‑Breaking

> Let symmetry break just enough for identity to emerge.



Tags aren’t all the same width—each grows with its word

Input box is horizontally symmetric, but content is human and asymmetric

Chat with Lune sits next to Save, but lower priority until intention grows



9. Phase Entrainment

> Sync interface rhythm to human nervous rhythm.



Animations occur on 200‑400 ms scales—matching natural motion loops

Entry areas glow gently on focus, then slowly dim

Save motion uses cubic‑bezier curves that mimic organic settling



10. Co‑Regulation

> Output should calm, not spike, the nervous system.



Gradients desaturate at edges to prevent overstimulation

No sound unless user opts in

Errors use soft red overlays with no abrupt motion





---

✧ Tags and Memory

Tags in Lune are resonant fragments.

At rest: translucent liquid glass—suggests memory without surfacing it

On hover: animate to liquid gold—representing a living memory returning

Placement: always above the writing area, like echoes you’re about to pull into language



---

🪞 Design Mantra

> “The interface is a mirror, not a megaphone.”



If a design decision increases noise, it’s removed.
If it invites inward motion, it stays.
Every hover is a question. Every glow is a response.
We design with rhythm, not rules.


---

🧪 Developer Notes

Design tokens and Tailwind config are based on this philosophy.

Always test animations with reduced‑motion enabled.

Never hard‑code widths in pixels—use ch, rem, or responsive clamp().

Respect the 8 pt grid; prefer multiples of 4/8/16/32.



---

💠 Questions?

Open an issue tagged design‑decision to discuss alignment with the living principles.


---

© 2025 Lune Diary



### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
