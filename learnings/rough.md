Good question to ask now, before the CSS grows. Here's the mental model, a structure that fits your project, and what to read.

## The one idea that matters most: scope

Every CSS rule has a "blast radius." Organize by how wide that radius is:

| Layer | What goes here | Where | Blast radius |
|---|---|---|---|
| **Tokens** | Colors, spacing, font sizes as variables | `index.css` `:root` | Everything (but only *values*, not rules) |
| **Base / reset** | `body`, default font, `box-sizing`, link color | `index.css` | Every element of that type |
| **Layout** | Page shells: centered column, sidebar+main | `layouts/*.css` or `App.css` | Wrappers |
| **Components** | Button, card, file tree, chat bubble | `components/X.css` next to `X.jsx` | Only elements with that class |
| **Page-specific** | Tweaks for one page only | `pages/chat/chat.css` | One page |

Rule of thumb: **the wider the radius, the fewer rules should live there.** Your earlier `* { background-color: ... }` broke this — a universal selector at the widest radius set a *component-level* decision, so it stomped everything below it.

## Structure that fits repo-recall

```text
client/src/
  index.css                  ← tokens + base only (~40 lines max)
  App.css                    ← app shell layout (or delete if unused)
  components/
    FileTree.jsx
    FileTree.css             ← .file-tree, .file-tree__item ...
  pages/
    homepage/
      Homepage.jsx
      homepage.css           ← .homepage, .homepage__form ...
    chat/
      Chat.jsx
      chat.css               ← .chat, .chat__answer, .chat__sources ...
    Login.jsx + auth.css     ← Login/Signup share one file
```

Each `.jsx` imports its own `.css`. Vite bundles them all into one stylesheet, so this is about *your* organization, not performance.

## Three rules to avoid pain

**1. Class selectors only (in components/pages).**
Never `div`, `p`, `*`, or `#id` in component CSS. Tags are too broad, IDs are too strong.

```css
/* bad — hits every <p> in the app */
p { line-height: 1.6; }

/* good — hits only answer text */
.chat__answer p { line-height: 1.6; }
```

**2. Prefix classes with the component name.**
`.chat__answer`, `.homepage__form`, `.file-tree__item`. This is the BEM convention (block__element--modifier). Guarantees `.chat` CSS never collides with `.homepage` CSS even though they're in one bundle.

**3. Values come from tokens, never hardcoded twice.**
If a color appears in two files, it should be `var(--something)`. Your `index.css` already does this — keep it up.

```css
:root {
  --bg: #0f1419;
  --surface: #1a2332;
  --text: #e7ecf1;
  --text-muted: #8b98a5;
  --accent: #3d8bfd;
  --radius: 8px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
}
```

## Why your `:root` colors look off

`--bg: #c3c2b1` (light beige) with `--text: #4077ae` (mid blue) has weak contrast. Pick a pair with clear separation: dark bg + light text, or light bg + near-black text. Use accent (`#3d8bfd`) only for buttons/links, not body text.

## What to read, in order

1. **[MDN: CSS Cascade and inheritance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Handling_conflicts)** — explains *why* `App.css` beat `index.css`. Specificity + source order. 20 minutes, most valuable thing on this list.
2. **[BEM naming quick start](https://getbem.com/naming/)** — the `.block__element--modifier` convention. 10 minutes.
3. **[MDN: CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)** — the `var(--x)` you're already using; learn scoping to a component.
4. **[Vite: CSS Modules](https://vite.dev/guide/features.html#css-modules)** — when your app grows, rename `chat.css` → `chat.module.css` and Vite makes class names unique automatically. Same file layout, zero collisions. Skip until you feel pain.
5. **[Josh Comeau: The Rules of Margin Collapse](https://www.joshwcomeau.com/css/rules-of-margin-collapse/)** and his **[Interactive Guide to Flexbox](https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/)** — for layout once structure is sorted.

Skip Tailwind/styled-components for now. They solve the same scoping problem differently; learn the underlying cascade first so you understand what they're abstracting.

## Concrete next step for your files

- `index.css`: tokens + `body` + `*, *::before, *::after { box-sizing: border-box; }`. Nothing else.
- `App.css`: delete the import from `App.jsx` if it stays empty.
- `homepage.css`: wrap the JSX in `<div className="homepage">` and start with `.homepage__form`, `.homepage__branches`, `.homepage__files`.
- Move `Chat.jsx` into `pages/chat/` with `chat.css` so it mirrors homepage.