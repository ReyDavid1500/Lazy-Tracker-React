---
alwaysApply: false
description: React component creation, organization, and namespace patterns. Apply when creating new components, pages, features, or refactoring existing components. Ensures consistent structure, proper typing, and maintainable code architecture.
---

# React Component Creation and Organization Rules

**When to use this rule**: Apply these patterns whenever you are:

- ✅ Creating new React components or pages
- ✅ Refactoring existing large components
- ✅ Organizing component structure
- ✅ Setting up new feature directories
- ✅ Working with component architecture

**Trigger keywords**: "create component", "new component", "component structure", "organize components", "refactor component", "component architecture", "page component", "feature component"

## Component Structure

### 1. Component Creation and Organization Rules

- **Single Responsibility**: Each component should have one clear purpose
- **Max Lines**: Keep components under 100 lines. If larger, break into smaller components
- **File Organization**: Place components in `components/` subdirectory with their own folder
- **Naming**: Use PascalCase for component names, kebab-case for folders
- **Always create separate files**: Never put multiple components in one file

### 2. Folder Structure (Apply to ALL new components)

```
component-name/
├── components/
│   ├── sub-component-1/
│   │   ├── sub-component-1.tsx
│   │   ├── sub-component-1.type.ts
│   │   └── index.ts
│   └── sub-component-2/
│       ├── sub-component-2.tsx
│       ├── sub-component-2.type.ts
│       └── index.ts
├── component-name.tsx
├── component-name.type.ts
└── index.ts
```

## Type Organization (Apply to ALL components)

### 6. Type File Structure

- **Always create separate type files**: `component-name.type.ts`
- **Never put interfaces in component files**: Extract all types to separate files
- **Export types from index.ts**: Make types available for import
- **Use descriptive interface names**: `ComponentNameProps`, `ComponentNameState`

```typescript
// ✅ Correct - separate type file
// component-name.type.ts
export interface ComponentNameProps {
  title: string;
  onAction: () => void;
}

// component-name.tsx
import { ComponentNameProps } from './component-name.type';
```

## Accessibility Requirements (Apply to ALL components)

### 7. HTML Semantic Structure

- **Use semantic HTML tags**: `<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<aside>`
- **Avoid excessive `<div>` usage**: Prefer semantic elements for better screen reader support
- **Proper heading hierarchy**: Use `<h1>` through `<h6>` in logical order
- **Landmark roles**: Implement proper page structure with landmarks

```typescript
// ✅ Correct - semantic HTML
<header className="flex items-center justify-between px-6 py-4">
  <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
</header>
<main className="flex-1 px-6 py-8">
  <section className="max-w-prose mx-auto">
    <article className="space-y-4">
      {/* Content */}
    </article>
  </section>
</main>

// ❌ Incorrect - excessive divs
<div className="flex items-center justify-between px-6 py-4">
  <div className="text-2xl font-bold text-gray-900">Page Title</div>
</div>
<div className="flex-1 px-6 py-8">
  <div className="max-w-prose mx-auto">
    <div className="space-y-4">
      {/* Content */}
    </div>
  </div>
</div>
```

### 8. ARIA Roles and Attributes

- **Implement appropriate ARIA roles**: `role="button"`, `role="tab"`, `role="tablist"`, `role="tabpanel"`
- **Use aria-label for descriptive text**: Provide context for screen readers
- **Implement aria-expanded for collapsible content**: Indicate state changes
- **Use aria-selected for tab-like interfaces**: Show current selection
- **Add aria-controls for related elements**: Connect interactive elements

```typescript
// ✅ Correct - proper ARIA implementation
<button
  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
  role="tab"
  aria-selected={isActive}
  aria-controls="content-panel"
  aria-label="User Profile Tab"
>
  Profile
</button>

<div
  id="content-panel"
  role="tabpanel"
  aria-labelledby="profile-tab"
>
  {/* Tab content */}
</div>
```

### 9. Form and Input Accessibility

- **Always include labels**: Use `<label>` elements or `aria-label` for inputs
- **Implement proper form structure**: Use `<form>` elements with semantic markup
- **Add required field indicators**: Use `aria-required="true"` and visual cues
- **Provide error messages**: Use `aria-describedby` to connect errors to inputs
- **Support keyboard navigation**: Ensure all interactive elements are keyboard accessible

```typescript
// ✅ Correct - accessible form
<form className="space-y-4" role="form">
  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
    Email Address
  </label>
  <input
    id="email"
    type="email"
    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    aria-required="true"
    aria-describedby="email-error"
  />
  {error && (
    <div id="email-error" className="text-sm text-red-600" role="alert">
      {error}
    </div>
  )}
</form>
```

### 10. Interactive Element Accessibility

- **Buttons with icons must have aria-label**: Never leave icon-only buttons without description
- **Implement keyboard support**: Handle Enter, Space, and arrow key navigation
- **Add focus indicators**: Ensure focus is visible and logical
- **Support screen readers**: Use `aria-label`, `aria-describedby`, and `aria-hidden` appropriately

```typescript
// ✅ Correct - accessible interactive elements
<button
  className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  aria-label="Close dialog"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  }}
>
  <CloseIcon aria-hidden="true" />
</button>

// ❌ Incorrect - missing accessibility
<button className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
  <CloseIcon />
</button>
```

### 11. Image and Media Accessibility

- **Always include alt text**: Provide descriptive `alt` attributes for images
- **Use aria-label for decorative images**: When alt="" is not sufficient
- **Implement media controls**: Ensure video/audio players have accessible controls
- **Provide captions and transcripts**: For multimedia content

```typescript
// ✅ Correct - accessible images
<img
  src={user.avatar}
  alt={`Profile picture of ${user.name}`}
  className="h-10 w-10 rounded-full object-cover"
/>

// For decorative images
<img
  src={decorationImage}
  alt=""
  aria-hidden="true"
  className="pointer-events-none select-none"
/>
```

### 12. State and Dynamic Content

- **Use aria-live regions**: For content that updates dynamically
- **Implement loading states**: Use `aria-busy` and `aria-live` for async operations
- **Provide status updates**: Use `role="status"` for progress and completion messages
- **Handle loading and error states**: Ensure all states are communicated to assistive technology

```typescript
// ✅ Correct - accessible dynamic content
<div
  className="text-sm text-gray-600"
  role="status"
  aria-live="polite"
  aria-busy={isLoading}
>
  {isLoading ? 'Loading...' : 'Content loaded successfully'}
</div>
```

## Export Patterns

### 13. Named Exports (Use for ALL components)

- **Always use named exports**: `export const ComponentName`
- **Never use default exports**: `export default ComponentName`
- **Create index.ts files** for clean imports

### 14. Export Structure

```typescript
// ✅ Correct
export { ComponentName } from './component-name';
export * from './components';

// ❌ Incorrect
export { default as ComponentName } from './component-name';
```

## Style Organization with Tailwind CSS

### 15. Tailwind Class Organization (Apply to ALL components)

- **Each component owns its classes inline** — no separate stylesheet needed for utility classes
- **Group classes by concern** using a consistent order: layout → spacing → sizing → typography → color → border → effects → state
- **Extract repeated class strings to variables** when the same combination appears 3+ times in one file
- **Use the `cn()` / `clsx()` helper** for conditional and dynamic classes — never string interpolation
- **Never construct class names dynamically** from partial strings; Tailwind's static analysis requires full class names to be present in source

```typescript
// ✅ Correct - full class names always present
const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  danger:  'bg-red-600  text-white hover:bg-red-700',
} as const;
<button className={variants[variant]}>Save</button>

// ❌ Incorrect - Tailwind cannot detect partial strings at build time
const color = 'blue';
<button className={`bg-${color}-600`}>Save</button>
```

### 16. Class Ordering Convention

Follow the Prettier plugin for Tailwind order or this manual grouping — pick one and apply it consistently:

```
1. Layout        display, position, inset, z-index, float, clear
2. Box model     w, h, min-w, max-w, overflow, aspect-ratio
3. Flex / Grid   flex, grid, items, justify, gap, col, row
4. Spacing       p, px, py, pt, pb, m, mx, my, mt, mb
5. Typography    font, text, leading, tracking, truncate, whitespace
6. Color         text-*, bg-*, fill-*, stroke-*
7. Border        border, rounded, outline, ring
8. Effects       shadow, opacity, blur, backdrop
9. Transitions   transition, duration, ease, animate
10. State        hover:, focus:, active:, disabled:, dark:, aria-*
```

```typescript
// ✅ Correct - classes grouped by concern
<button className="
  inline-flex items-center justify-center gap-2
  px-4 py-2
  text-sm font-semibold
  text-white bg-blue-600
  rounded-lg border border-transparent
  shadow-sm
  transition-colors duration-150
  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50
">
  Save changes
</button>
```

### 17. Conditional Classes with `cn()` / `clsx()`

Install `clsx` + `tailwind-merge` and expose them through a single `cn` utility. Use it everywhere classes depend on props or state.

```typescript
// lib/cn.ts  — create this once and import everywhere
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```typescript
// ✅ Correct - conditional classes via cn()
import { cn } from '@/lib/cn';

<div
  className={cn(
    'rounded-xl border px-4 py-3 text-sm transition-colors',
    isError  && 'border-red-300 bg-red-50 text-red-700',
    isSuccess && 'border-green-300 bg-green-50 text-green-700',
    !isError && !isSuccess && 'border-gray-200 bg-white text-gray-700',
  )}
/>

// ❌ Incorrect - string interpolation breaks merging and readability
<div className={`rounded-xl border px-4 py-3 text-sm ${isError ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200'}`} />
```

### 18. Reusable Class Sets with `cva()` (Component Variants)

Use `class-variance-authority` (`cva`) when a component has multiple mutually exclusive variants. This replaces the SCSS modifier pattern.

```typescript
// ✅ Correct - cva for multi-variant components
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  // Base classes always applied
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      intent: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400',
        danger:  'bg-red-600  text-white hover:bg-red-700  focus:ring-red-500',
        ghost:   'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
      },
      size: {
        sm: 'h-8  px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: { intent: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button: React.FC<ButtonProps> = ({ intent, size, className, ...props }) => (
  <button className={cn(buttonVariants({ intent, size }), className)} {...props} />
);
```

### 19. Extracting Repeated Utilities to a `styles` Object

When a combination of classes is used in 3 or more places **within the same file**, extract it to a typed `styles` constant at the top. Do not create a global shared stylesheet — keep styles co-located with the component that owns them.

```typescript
// ✅ Correct - local styles object for repeated combinations
const styles = {
  card:        'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm',
  cardHeader:  'mb-4 flex items-center justify-between',
  cardTitle:   'text-lg font-semibold text-gray-900',
  badge:       'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
} as const;

// Used across the component
<div className={styles.card}>
  <div className={styles.cardHeader}>
    <h2 className={styles.cardTitle}>Title</h2>
  </div>
</div>

// ❌ Incorrect - inline duplication
<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
  ...
</div>
<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
  ...
</div>
```

### 20. Custom Tokens via `@theme` (Tailwind v4) or `tailwind.config.ts` (v3)

Define design tokens once in the Tailwind config, not as arbitrary values scattered across JSX. Use arbitrary values (`text-[#f00]`, `mt-[13px]`) only for true one-offs that will never repeat.

```typescript
// tailwind.config.ts (v3) — define custom tokens here
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a5f',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
} satisfies Config;

// ✅ Use the token — refactoring the token updates every usage
<div className="bg-brand-500 text-white rounded-4xl" />

// ❌ Avoid repeating arbitrary values
<div className="bg-[#3b82f6] text-white rounded-[2rem]" />
<div className="bg-[#3b82f6] border border-[#3b82f6]" />  // same value, no single source of truth
```

### 21. Dark Mode

Use the `dark:` variant consistently. Define semantic color tokens in config (e.g. `surface`, `on-surface`) so you toggle meaning, not raw values.

```typescript
// ✅ Correct - semantic tokens, dark: variant on every color-carrying class
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-50">
  <p className="text-gray-600 dark:text-gray-400">Supporting text</p>
</div>

// ❌ Incorrect - dark: missing on some classes
<div className="bg-white text-gray-900">          {/* bg will stay white in dark mode */}
  <p className="dark:text-gray-400">Supporting</p>
</div>
```

### 22. Responsive Design

Use Tailwind's mobile-first breakpoint prefixes. Start with the smallest layout and override upward. Never use max-width media queries — use `sm:`, `md:`, `lg:`, `xl:` only.

```typescript
// ✅ Correct - mobile-first, stacking upward
<div className="flex flex-col gap-4 sm:flex-row sm:gap-6 lg:gap-8">
  <aside className="w-full sm:w-64 lg:w-72">...</aside>
  <main className="flex-1">...</main>
</div>

// ❌ Incorrect - desktop-first thinking expressed in Tailwind
<div className="flex flex-row gap-8 [some override to stack on mobile]">
```

## Component Creation Checklist

### 23. When Creating New Components (Use EVERY time)

1. **Create component folder** with kebab-case naming
2. **Create component file** with PascalCase naming
3. **Create type file** for all interfaces and props
4. **Create index.ts** for clean exports
5. **Install and use `cn()` helper** for all conditional classes
6. **Use `cva()`** if the component has multiple visual variants
7. **Extract repeated class sets** to a local `styles` object
8. **Use named exports only** — never default exports
9. **Implement semantic HTML structure** — use proper tags
10. **Add ARIA roles and attributes** — ensure accessibility
11. **Include proper labels and descriptions** — for screen readers
12. **Test keyboard navigation** — ensure tab order is logical
13. **Verify screen reader compatibility** — test with assistive technology

### 24. Example New Component Creation

```typescript
// ✅ Correct structure for NEW components
// user-profile/
// ├── components/
// │   └── user-avatar/
// │       ├── user-avatar.tsx
// │       ├── user-avatar.type.ts
// │       └── index.ts
// ├── user-profile.tsx
// ├── user-profile.type.ts
// └── index.ts

// user-profile.type.ts
export interface UserProfileProps {
  userId: string;
}

// user-profile.tsx
import { cn } from '@/lib/cn';
import { UserProfileProps } from './user-profile.type';
import { UserAvatar } from './components/user-avatar';

const styles = {
  root:    'flex flex-col gap-6 p-6',
  header:  'flex items-center gap-4',
  title:   'text-2xl font-bold text-gray-900 dark:text-gray-50',
  content: 'flex-1 space-y-4',
} as const;

export const UserProfile: React.FC<UserProfileProps> = ({ userId }) => (
  <main className={styles.root} role="main">
    <header className={styles.header}>
      <UserAvatar userId={userId} />
      <h1 className={styles.title}>User Profile</h1>
    </header>
    <section className={styles.content}>
      {/* Content */}
    </section>
  </main>
);
```

## Component Refactoring Checklist

### 25. When Refactoring Large Components

1. **Identify logical sections** (header, content, footer, etc.)
2. **Create component folders** for each section
3. **Extract interfaces** and props to type files
4. **Extract repeated class strings** to a `styles` object or `cva()` call
5. **Introduce `cn()` helper** to replace string interpolation
6. **Update imports** and exports
7. **Test functionality** remains intact
8. **Verify accessibility** is maintained or improved
9. **Check semantic structure** is preserved
10. **Test with screen readers** to ensure no regression

### 26. Example Refactor

```typescript
// Before: Large component with inline, duplicated classes
const LargeComponent = () => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6">
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      {/* 100+ lines */}
    </div>
  </div>
);

// After: Extracted components and styles object
const styles = { card: 'rounded-2xl border border-gray-200 bg-white p-6' } as const;

const LargeComponent = () => (
  <main className={styles.card} role="main">
    <ComponentHeader />
    <ComponentContent />
    <ComponentFooter />
  </main>
);
```

## Best Practices Summary

- ✅ Use `cn()` / `clsx()` + `tailwind-merge` for ALL conditional classes
- ✅ Use `cva()` for components with multiple visual variants
- ✅ Extract repeated class strings to a local `styles` object (3+ usages)
- ✅ Keep components under 100 lines
- ✅ Named exports only
- ✅ Separate types per component
- ✅ Clear folder structure
- ✅ Single responsibility principle
- ✅ **Always use full class names** — never dynamic string interpolation
- ✅ **Follow mobile-first responsive design** with `sm:`, `md:`, `lg:`
- ✅ **Apply `dark:` variant to every color-carrying class**
- ✅ **Define design tokens in Tailwind config** — not as repeated arbitrary values
- ✅ **Create type files for ALL components**
- ✅ **Implement semantic HTML structure**
- ✅ **Add proper ARIA roles and attributes**
- ✅ **Include descriptive labels and alt text**
- ✅ **Ensure keyboard navigation support**
- ✅ **Test with screen readers**
- ✅ **Avoid redundant comments** — only add comments that clarify non-obvious logic

## Comment Guidelines

### 27. Writing Meaningful Comments

- **✅ Good comments**: Explain complex business logic, algorithms, or non-obvious decisions
- **❌ Bad comments**: State the obvious, repeat what the code already shows
- **Examples**:

  ```typescript
  // ❌ Redundant - code is self-explanatory
  // Apply hover background
  className="hover:bg-gray-100"

  // ✅ Useful - explains business logic
  // Only show premium features for users with active subscription
  if (user.subscriptionStatus === 'active') {
    // ...
  }
  ```

### 28. Variable Verification

- **Always verify Tailwind tokens exist** before using them in className strings
- **Check the Tailwind config** (or `@theme` in v4) for available custom tokens — don't assume
- **Common built-in patterns**:
  - **Colors**: `gray-50` … `gray-950`, `blue-500`, etc.
  - **Spacing**: `p-1` (4px) … `p-96` (384px), `gap-4`, `mt-8`
  - **Typography**: `text-xs`, `text-sm` … `text-5xl`; `font-medium`, `font-semibold`, `font-bold`
- **Never use class names that don't exist** — Tailwind will silently drop unknown utilities at build time

**Example of verification**:

```typescript
// ❌ Wrong - custom token not defined in config
<div className="bg-brand-200" />   // 'brand-200' doesn't exist → no style applied

// ✅ Correct - token defined in tailwind.config.ts
// tailwind.config.ts: colors: { brand: { 200: '#bfdbfe' } }
<div className="bg-brand-200" />   // works correctly
```

## Common Mistakes to Avoid

- ❌ Using default exports
- ❌ Mixing multiple responsibilities in one component
- ❌ Not separating large components
- ❌ Inconsistent naming conventions
- ❌ **Building class names from partial string interpolation** (`bg-${color}-500`)
- ❌ **Scattering the same arbitrary value** (`text-[#1a2b3c]`) in multiple places
- ❌ **Missing `dark:` on color classes** — causes invisible text or washed-out backgrounds
- ❌ **Overriding Tailwind classes without `tailwind-merge`** — both classes land in the DOM and the wrong one may win
- ❌ **Putting types in component files**
- ❌ **Not creating separate type files**
- ❌ **Using excessive `<div>` elements instead of semantic HTML**
- ❌ **Missing aria-label for icon-only buttons**
- ❌ **Not implementing keyboard navigation**
- ❌ **Missing alt text for images**
- ❌ **Not testing with screen readers**

## Troubleshooting

### 29. Styles Not Applying? Check Class Detection

**Problem**: Tailwind class is in the source but generates no CSS.

**Solution**: Tailwind scans source files statically. A class that is never written out in full will not be in the output bundle.

**Debugging Steps**:

1. **Search the source file** for the complete class string — it must appear verbatim
2. **Check `content` globs** in `tailwind.config.ts` (v3) or `@source` in `index.css` (v4) include your file
3. **Restart the dev server** after editing the config
4. **Use browser dev tools** to confirm the class exists in the element but no rule matches — that points to a missing config token

**Quick Fix Checklist**:

- [ ] Full class name is present as a literal string in source
- [ ] File is covered by Tailwind's content scan paths
- [ ] Custom token is defined in `tailwind.config.ts` / `@theme`
- [ ] No typos in the class name

### 30. Conflicting Classes? Use `tailwind-merge`

**Problem**: Two classes targeting the same property both land on the element — the wrong one wins based on stylesheet order.

```typescript
// ❌ Without tailwind-merge — both 'p-4' and 'p-8' are in the DOM
<Button className="p-8" />   // Button base has 'p-4' — which wins?

// ✅ With cn() / tailwind-merge — last one wins, predictably
export const Button = ({ className, ...props }) => (
  <button className={cn('p-4 rounded-lg bg-blue-600', className)} {...props} />
);
// cn('p-4 ... ', 'p-8') → 'rounded-lg bg-blue-600 p-8'  ✔
```

**Quick Fix Checklist**:

- [ ] `tailwind-merge` is installed and `cn()` wraps all class concatenations
- [ ] Overridable classes are in the base, caller classes are last in `cn()`
- [ ] No manual string concatenation bypassing `cn()`

### 31. Accessibility Issues? Check Common Problems

**Problem**: Component is not accessible to screen readers or keyboard users.

**Solution**: Verify all accessibility requirements are implemented.

**Debugging Steps**:

1. **Check semantic HTML structure** — use proper tags
2. **Verify ARIA roles and attributes** — implement appropriate roles
3. **Test keyboard navigation** — ensure tab order is logical
4. **Check screen reader compatibility** — test with assistive technology

**Quick Fix Checklist**:

- [ ] Semantic HTML tags are used appropriately
- [ ] ARIA roles and attributes are implemented
- [ ] All interactive elements have labels or aria-label
- [ ] Keyboard navigation works correctly
- [ ] Screen reader announces content properly

---

**Remember**: Apply these patterns to EVERY new component, page, or feature you create. This ensures consistency, maintainability, and accessibility across the entire project.
