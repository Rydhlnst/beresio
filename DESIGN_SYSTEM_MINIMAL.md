# Beres.io Minimalist Design System
## Notion-Inspired Clean Aesthetic

---

## Design Philosophy

- **Flat Design**: No gradients, no glassmorphism
- **Subtle Depth**: Minimal shadows, clean layers
- **Functional First**: Every element serves a purpose
- **Generous Whitespace**: Breathing room between elements
- **Monochromatic Base**: Neutral colors with minimal accents
- **Clean Typography**: Clear hierarchy, readable at all sizes

---

## 1. Color Palette (Notion-Inspired)

### Neutral Scale (Primary)
```css
:root {
  /* Pure neutrals - Notion style */
  --white: #ffffff;
  --gray-50: #f7f6f3;    /* Page background */
  --gray-100: #f5f5f5;   /* Hover states */
  --gray-200: #e3e2e0;   /* Borders */
  --gray-300: #d3d1cb;   /* Disabled */
  --gray-400: #9ca3af;   /* Muted text */
  --gray-500: #6b7280;   /* Secondary text */
  --gray-600: #4b5563;   /* Body text */
  --gray-700: #374151;   /* Strong text */
  --gray-800: #1f2937;   /* Headings */
  --gray-900: #111827;   /* Primary text */
  
  /* Semantic neutrals */
  --background: #ffffff;
  --background-secondary: #f7f6f3;
  --background-tertiary: #f5f5f5;
  
  --text-primary: #37352f;      /* Notion's primary text */
  --text-secondary: #6b6b6b;    /* Muted text */
  --text-tertiary: #9ca3af;     /* Placeholder text */
  
  --border-light: #e3e2e0;
  --border-default: #d3d1cb;
  --border-strong: #9ca3af;
}
```

### Accent Color (Coral - Desaturated)
```css
:root {
  /* Desaturated coral for minimal look */
  --accent: #e16259;           /* Notion-style red/coral */
  --accent-hover: #c9544c;
  --accent-light: #fdecec;     /* Very subtle bg */
  --accent-text: #ffffff;
  
  /* Keep your existing hue but desaturate */
  --primary: 11 60% 55%;       /* Less saturated */
  --primary-foreground: 0 0% 100%;
}
```

### Semantic Colors (Muted)
```css
:root {
  /* Success - Muted green */
  --success: #4caf50;
  --success-bg: #e8f5e9;
  --success-text: #2e7d32;
  
  /* Warning - Muted yellow/orange */
  --warning: #ff9800;
  --warning-bg: #fff3e0;
  --warning-text: #e65100;
  
  /* Error - Muted red */
  --error: #ef4444;
  --error-bg: #fee2e2;
  --error-text: #b91c1c;
  
  /* Info - Muted blue */
  --info: #3b82f6;
  --info-bg: #dbeafe;
  --info-text: #1d4ed8;
}
```

### Dark Mode (Notion Dark)
```css
.dark {
  --background: #191919;           /* Notion dark bg */
  --background-secondary: #202020; /* Card bg */
  --background-tertiary: #2f2f2f;  /* Hover */
  
  --text-primary: #ffffff;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
  
  --border-light: #2f2f2f;
  --border-default: #373737;
  --border-strong: #4b5563;
  
  /* Muted accent for dark */
  --accent: #ff6b6b;
  --accent-hover: #ff8585;
  --accent-light: #3d2828;
}
```

---

## 2. Shadows (Minimal & Subtle)

```css
:root {
  /* Almost flat - very subtle */
  --shadow-none: none;
  --shadow-xs: 0 0.5px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  
  /* No colored shadows - keep it flat */
  --shadow-focus: 0 0 0 2px rgba(225, 98, 89, 0.2);
}
```

---

## 3. Typography (Clean & Readable)

```css
:root {
  /* Font stack - system fonts for native feel */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
               "Helvetica Neue", Arial, sans-serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", 
               Consolas, "Courier New", monospace;
  
  /* Sizes - Slightly smaller for density */
  --text-xs: 0.75rem;     /* 12px - captions */
  --text-sm: 0.8125rem;   /* 13px - secondary */
  --text-base: 0.9375rem; /* 15px - body */
  --text-lg: 1.0625rem;   /* 17px - lead */
  --text-xl: 1.25rem;     /* 20px - h3 */
  --text-2xl: 1.5rem;     /* 24px - h2 */
  --text-3xl: 1.875rem;   /* 30px - h1 */
  
  /* Weights - Minimal variation */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  
  /* Line heights - Comfortable */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### Typography Patterns
```css
/* Page title */
.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

/* Section heading */
.section-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

/* Body text */
.body-text {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  color: var(--text-primary);
  line-height: var(--leading-normal);
}

/* Secondary/Muted */
.text-muted {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Caption */
.caption {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
```

---

## 4. Spacing (Generous & Consistent)

```css
:root {
  /* Base unit: 4px */
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### Spacing Patterns
- **Card padding**: 16px - 20px
- **Section gaps**: 24px - 32px
- **Element gaps**: 8px - 12px
- **Text margins**: 4px - 8px

---

## 5. Components (Flat & Functional)

### 5.1 Cards (No Elevation)

```tsx
// Clean card - flat with subtle border
const CardMinimal = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "hoverable" | "selected"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-background border-border-light",
    hoverable: "bg-background border-border-light hover:bg-background-secondary hover:border-border-default cursor-pointer",
    selected: "bg-accent-light border-accent",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border transition-colors duration-150",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
```

### 5.2 Buttons (Clean & Flat)

```tsx
// Minimal button variants
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        // Primary - Filled accent
        default: 
          "bg-accent text-white hover:bg-accent-hover rounded-md",
        
        // Secondary - Light background
        secondary: 
          "bg-background-secondary text-text-primary hover:bg-background-tertiary border border-border-light rounded-md",
        
        // Ghost - Transparent
        ghost: 
          "text-text-primary hover:bg-background-secondary rounded-md",
        
        // Muted - For less important actions
        muted: 
          "text-text-secondary hover:text-text-primary hover:bg-background-secondary rounded-md",
        
        // Danger
        destructive: 
          "bg-error text-white hover:bg-error/90 rounded-md",
        
        // Link
        link: 
          "text-accent hover:underline underline-offset-2 rounded-none",
      },
      size: {
        sm: "h-7 px-2.5 text-xs",
        default: "h-8 px-3",
        lg: "h-9 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### 5.3 Inputs (Clean Borders)

```tsx
// Minimal input
const InputMinimal = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-8 w-full rounded-md border border-border-default bg-background px-3 py-1.5",
      "text-sm text-text-primary placeholder:text-text-tertiary",
      "transition-colors duration-150",
      "hover:border-border-strong",
      "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/20",
      "disabled:cursor-not-allowed disabled:opacity-40",
      className
    )}
    {...props}
  />
))
```

### 5.4 Badges (Subtle & Rounded)

```tsx
// Minimal badges
const badgeVariants = cva(
  "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        // Default - subtle gray
        default: "bg-background-secondary text-text-secondary",
        
        // Status badges
        success: "bg-success-bg text-success-text",
        warning: "bg-warning-bg text-warning-text",
        error: "bg-error-bg text-error-text",
        info: "bg-info-bg text-info-text",
        
        // Accent
        accent: "bg-accent-light text-accent",
        
        // Outline
        outline: "border border-border-default text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### 5.5 Navigation Items (Clean)

```tsx
// Sidebar menu item - Notion style
const NavItem = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & { isActive?: boolean }
>(({ className, isActive, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150",
      isActive 
        ? "bg-background-secondary text-text-primary font-medium" 
        : "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
      className
    )}
    {...props}
  />
))
```

---

## 6. Dashboard Patterns

### 6.1 KPI Card (Minimal)

```tsx
function KPICardMinimal({ label, value, trend }) {
  return (
    <div className="rounded-lg border border-border-light bg-background p-4">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className="text-xl font-semibold text-text-primary">{value}</p>
      {trend && (
        <p className={cn(
          "text-xs mt-1",
          trend.isPositive ? "text-success" : "text-error"
        )}>
          {trend.isPositive ? "↑" : "↓"} {trend.value}%
        </p>
      )}
    </div>
  )
}
```

### 6.2 Section Card (Clean)

```tsx
function SectionCardMinimal({ title, children, action }) {
  return (
    <div className="rounded-lg border border-border-light bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
```

### 6.3 Table (Clean)

```tsx
function TableMinimal({ children }) {
  return (
    <div className="rounded-lg border border-border-light overflow-hidden">
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  )
}

// Table head
function TableHeadMinimal({ children }) {
  return (
    <thead className="bg-background-secondary border-b border-border-light">
      <tr>{children}</tr>
    </thead>
  )
}

// Table header cell
function TableHeaderCellMinimal({ children }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
      {children}
    </th>
  )
}

// Table row
function TableRowMinimal({ children, highlighted }) {
  return (
    <tr className={cn(
      "border-b border-border-light last:border-0",
      "hover:bg-background-secondary/50 transition-colors",
      highlighted && "bg-warning-bg/30"
    )}>
      {children}
    </tr>
  )
}

// Table cell
function TableCellMinimal({ children }) {
  return (
    <td className="px-4 py-2.5 text-text-primary">
      {children}
    </td>
  )
}
```

---

## 7. Layout Patterns

### 7.1 Page Layout

```tsx
function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - clean */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-background border-r border-border-light">
        <div className="p-3">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 py-1.5 mb-4">
            <div className="w-5 h-5 bg-accent rounded-sm" />
            <span className="font-semibold text-text-primary">Beres</span>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-0.5">
            <NavItem href="/dashboard" isActive>
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </NavItem>
            {/* ... */}
          </nav>
        </div>
      </aside>
      
      {/* Main */}
      <main className="ml-60 min-h-screen">
        {/* Header - clean */}
        <header className="h-12 border-b border-border-light flex items-center px-6">
          <h1 className="text-sm font-medium text-text-primary">Dashboard</h1>
        </header>
        
        {/* Content */}
        <div className="p-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
}
```

### 7.2 Grid Patterns

```tsx
// Standard grid - generous gaps
<div className="grid gap-6">
  {/* Content */}
</div>

// Two column
<div className="grid grid-cols-2 gap-6">
  {/* Content */}
</div>

// Three column
<div className="grid grid-cols-3 gap-6">
  {/* Content */}
</div>

// Mixed (like Notion database view)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main content */}
  </div>
  <div>
    {/* Sidebar */}
  </div>
</div>
```

---

## 8. Interactions (Subtle)

### 8.1 Hover States

```css
/* Cards */
.card-hover:hover {
  background-color: var(--background-secondary);
}

/* Buttons */
.btn-hover:hover {
  opacity: 0.9;
}

/* Links */
.link-hover:hover {
  text-decoration: underline;
}
```

### 8.2 Focus States

```css
/* Clean focus ring */
.focus-ring:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(225, 98, 89, 0.2);
}
```

### 8.3 Active States

```css
/* Subtle press effect */
.active-press:active {
  opacity: 0.8;
}
```

---

## 9. Comparison: Before vs After

### Before (Current)
- Rounded-2xl cards (24px radius)
- Pill buttons (full rounded)
- Gradient backgrounds
- Shadow-heavy cards
- Colorful badges

### After (Notion-Style Minimal)
- Rounded-lg cards (8px radius) - **SAME AS NOW**
- Rounded-md buttons (6px radius) - **SAME AS NOW**
- Flat white/gray backgrounds
- Almost no shadows
- Muted, subtle badges
- Generous whitespace

---

## 10. Quick Implementation

### Update globals.css

```css
:root {
  /* Override with Notion-style colors */
  --background: 0 0% 100%;
  --foreground: 40 8% 20%;        /* #37352f */
  --card: 0 0% 100%;
  --card-foreground: 40 8% 20%;
  
  --primary: 4 60% 55%;           /* Desaturated coral */
  --primary-foreground: 0 0% 100%;
  
  --secondary: 40 8% 96%;         /* #f7f6f3 */
  --secondary-foreground: 40 8% 20%;
  
  --muted: 40 8% 96%;
  --muted-foreground: 0 0% 42%;   /* #6b6b6b */
  
  --accent: 4 60% 55%;
  --accent-foreground: 0 0% 100%;
  
  --border: 40 6% 88%;            /* #e3e2e0 */
  --input: 40 6% 88%;
  --ring: 4 60% 55%;
  
  /* Keep your existing radius */
  --radius: 0.5rem;
}
```

### Update Card Styles

```tsx
// Simpler, flatter cards
<div className="rounded-lg border bg-background p-4">
  {/* Content */}
</div>
```

### Update Button Styles

```tsx
// Flat buttons
<button className="h-8 px-3 bg-primary text-white rounded-md hover:opacity-90">
  Action
</button>

// Secondary
<button className="h-8 px-3 bg-secondary text-foreground rounded-md border hover:bg-secondary/80">
  Secondary
</button>
```

---

## 11. Key Principles to Remember

1. **No Gradients** - Keep everything flat
2. **Minimal Shadows** - Use only for focus states
3. **Generous Padding** - Notion uses lots of whitespace
4. **Muted Colors** - Less saturation, more grays
5. **Clean Typography** - System fonts, clear hierarchy
6. **Functional** - Every element has a clear purpose
7. **Subtle Interactions** - No flashy animations
