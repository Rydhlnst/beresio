# Beres.io Modern Design System
## Beautiful Minimalism with Curves & Depth

---

## 1. Design Foundations

### 1.1 Color Palette (Refined)

#### Primary Colors (Warm Coral)
```css
:root {
  /* Primary - Warm Coral */
  --primary-50: 11 100% 97%;
  --primary-100: 11 100% 94%;
  --primary-200: 11 95% 88%;
  --primary-300: 11 90% 78%;
  --primary-400: 11 85% 65%;
  --primary-500: 11 86% 53%;    /* Main brand color */
  --primary-600: 11 85% 48%;
  --primary-700: 11 80% 42%;
  --primary-800: 11 75% 35%;
  --primary-900: 11 70% 28%;

  /* Neutral - Soft Gray Scale */
  --neutral-50: 0 0% 99%;
  --neutral-100: 0 0% 97%;
  --neutral-200: 0 0% 93%;
  --neutral-300: 0 0% 85%;
  --neutral-400: 0 0% 68%;
  --neutral-500: 0 0% 52%;
  --neutral-600: 0 0% 40%;
  --neutral-700: 0 0% 28%;
  --neutral-800: 0 0% 18%;
  --neutral-900: 0 0% 10%;

  /* Semantic Colors */
  --success: 142 76% 45%;
  --success-light: 142 76% 95%;
  --warning: 38 92% 55%;
  --warning-light: 38 92% 95%;
  --danger: 0 84% 60%;
  --danger-light: 0 84% 95%;
  --info: 217 91% 60%;
  --info-light: 217 91% 95%;
}
```

#### Surface Colors (Light Mode)
```css
:root {
  --background: 0 0% 100%;
  --foreground: 220 15% 8%;
  
  /* Cards with subtle warmth */
  --card: 30 20% 99%;
  --card-foreground: 220 15% 8%;
  --card-elevated: 0 0% 100%;
  
  --popover: 0 0% 100%;
  --popover-foreground: 220 15% 8%;
  
  /* Muted surfaces */
  --muted: 30 10% 97%;
  --muted-foreground: 220 10% 45%;
  
  /* Accent surfaces */
  --accent: 11 85% 96%;
  --accent-foreground: 11 80% 45%;
  
  /* Borders - softer */
  --border: 30 15% 90%;
  --border-subtle: 30 10% 94%;
  --input: 30 15% 90%;
  
  /* Focus ring */
  --ring: 11 86% 53%;
  --ring-offset: 0 0% 100%;
}
```

#### Surface Colors (Dark Mode)
```css
.dark {
  --background: 220 15% 6%;
  --foreground: 0 0% 98%;
  
  --card: 220 12% 10%;
  --card-foreground: 0 0% 98%;
  --card-elevated: 220 12% 14%;
  
  --popover: 220 12% 10%;
  --popover-foreground: 0 0% 98%;
  
  --muted: 220 12% 16%;
  --muted-foreground: 220 10% 60%;
  
  --accent: 11 60% 18%;
  --accent-foreground: 11 90% 65%;
  
  --border: 220 12% 20%;
  --border-subtle: 220 12% 16%;
  --input: 220 12% 20%;
  
  --ring: 11 86% 58%;
  --ring-offset: 220 15% 6%;
}
```

---

### 1.2 Border Radius Scale (More Curves)

```css
:root {
  --radius-none: 0;
  --radius-xs: 0.375rem;    /* 6px - small pills */
  --radius-sm: 0.5rem;      /* 8px - buttons, inputs */
  --radius-md: 0.75rem;     /* 12px - cards */
  --radius-lg: 1rem;        /* 16px - large cards */
  --radius-xl: 1.25rem;     /* 20px - modals */
  --radius-2xl: 1.5rem;     /* 24px - hero cards */
  --radius-3xl: 2rem;       /* 32px - feature sections */
  --radius-full: 9999px;    /* Pills, avatars */
}
```

**Usage Guidelines:**
- Buttons: `rounded-full` (pill shape) or `rounded-lg`
- Cards: `rounded-2xl` for dashboard cards, `rounded-xl` for smaller cards
- Inputs: `rounded-xl` for modern feel
- Modals/Sheets: `rounded-2xl` top corners
- Avatars: `rounded-full`
- Badges: `rounded-full`

---

### 1.3 Elevation & Shadows (Soft & Layered)

```css
:root {
  /* Subtle shadows for depth */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.03);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.08);
  
  /* Colored shadows for primary elements */
  --shadow-primary: 0 4px 14px 0 hsl(var(--primary-500) / 0.25);
  --shadow-primary-lg: 0 8px 24px 0 hsl(var(--primary-500) / 0.2);
  
  /* Inner shadows */
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.03);
  
  /* Dark mode shadows (softer) */
  --shadow-dark-xs: 0 1px 2px 0 rgb(0 0 0 / 0.2);
  --shadow-dark-sm: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3);
  --shadow-dark-md: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);
}
```

---

### 1.4 Spacing Scale (Refined)

```css
:root {
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
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

---

### 1.5 Motion & Transitions (Smooth & Purposeful)

```css
:root {
  /* Durations */
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
  
  /* Easing functions */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Standard transitions */
  --transition-all: all var(--duration-normal) var(--ease-in-out);
  --transition-colors: color, background-color, border-color, text-decoration-color, fill, stroke var(--duration-fast) var(--ease-in-out);
  --transition-transform: transform var(--duration-normal) var(--ease-spring);
  --transition-opacity: opacity var(--duration-fast) var(--ease-in-out);
  --transition-shadow: box-shadow var(--duration-normal) var(--ease-in-out);
}
```

---

## 2. Component Library Enhancements

### 2.1 Buttons (Modern & Curved)

```tsx
// Enhanced Button Variants
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary - Filled with shadow
        default: 
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 rounded-full",
        
        // Secondary - Soft background
        secondary: 
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full",
        
        // Outline - Bordered with hover fill
        outline: 
          "border-2 border-border bg-transparent hover:bg-muted hover:border-border/60 rounded-full",
        
        // Ghost - Transparent with hover
        ghost: 
          "hover:bg-muted hover:text-foreground rounded-full",
        
        // Soft - Subtle colored background
        soft: 
          "bg-primary/10 text-primary hover:bg-primary/15 rounded-full",
        
        // Destructive
        destructive: 
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full",
        
        // Glass - Modern glassmorphism
        glass: 
          "bg-white/80 backdrop-blur-sm border border-white/20 text-foreground hover:bg-white/90 rounded-full dark:bg-white/10 dark:hover:bg-white/15",
        
        // Link
        link: 
          "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-10 px-6",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

**Button Usage Examples:**
```tsx
// Primary CTA
<Button size="lg">Get Started</Button>

// Secondary action
<Button variant="soft" size="sm">Learn More</Button>

// Icon button
<Button variant="ghost" size="icon" className="rounded-xl">
  <Settings className="h-4 w-4" />
</Button>

// Destructive with icon
<Button variant="destructive">
  <Trash2 className="h-4 w-4" />
  Delete
</Button>
```

---

### 2.2 Cards (Rounded & Elevated)

```tsx
// Enhanced Card Component
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "outline" | "ghost";
    hover?: boolean;
  }
>(({ className, variant = "default", hover = false, ...props }, ref) => {
  const variants = {
    default: "bg-card text-card-foreground",
    elevated: "bg-card-elevated text-card-foreground shadow-lg shadow-black/5",
    outline: "border-2 bg-transparent",
    ghost: "bg-transparent",
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl transition-all duration-200",
        variants[variant],
        hover && "hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  );
});

// Card Header with better spacing
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));

// Card with gradient border option
const CardGradient = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative rounded-2xl p-[1px] bg-gradient-to-br from-primary/20 via-border to-primary/20",
      className
    )}
    {...props}
  >
    <div className="relative rounded-2xl bg-card p-6 h-full">
      {children}
    </div>
  </div>
));
```

---

### 2.3 Input Fields (Modern & Rounded)

```tsx
// Enhanced Input
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    variant?: "default" | "filled" | "outline";
    size?: "sm" | "default" | "lg";
  }
>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-background border-input",
    filled: "bg-muted border-transparent focus:bg-background",
    outline: "bg-transparent border-2",
  };
  
  const sizes = {
    sm: "h-9 px-4 text-xs rounded-xl",
    default: "h-11 px-4 rounded-xl",
    lg: "h-13 px-5 text-base rounded-2xl",
  };
  
  return (
    <input
      ref={ref}
      className={cn(
        "flex w-full transition-all duration-200",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
```

---

### 2.4 Badges (Pills & Soft)

```tsx
// Enhanced Badge
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Filled
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        
        // Soft (subtle background)
        soft: "border-transparent bg-primary/10 text-primary",
        "soft-secondary": "border-transparent bg-muted text-muted-foreground",
        "soft-success": "border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        "soft-warning": "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        "soft-danger": "border-transparent bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
        
        // Outlined
        outline: "text-foreground border-border",
        "outline-primary": "text-primary border-primary/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
```

---

### 2.5 Avatar (Enhanced)

```tsx
// Enhanced Avatar with status indicator
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    status?: "online" | "offline" | "away" | "busy";
    size?: "sm" | "default" | "lg" | "xl";
  }
>(({ className, status, size = "default", ...props }, ref) => {
  const sizes = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };
  
  const statusColors = {
    online: "bg-emerald-500",
    offline: "bg-gray-400",
    away: "bg-amber-500",
    busy: "bg-rose-500",
  };
  
  return (
    <div className="relative inline-block">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full ring-2 ring-background",
          sizes[size],
          className
        )}
        {...props}
      />
      {status && (
        <span className={cn(
          "absolute bottom-0 right-0 block rounded-full ring-2 ring-background",
          size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
          statusColors[status]
        )} />
      )}
    </div>
  );
});
```

---

## 3. Dashboard-Specific Enhancements

### 3.1 KPI Cards (Enhanced)

```tsx
// Modern KPI Card with curves and depth
interface ModernKPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: { value: number; isPositive: boolean };
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "gradient" | "outline";
}

export function ModernKPICard({ 
  label, 
  value, 
  icon: Icon, 
  delta, 
  trend,
  variant = "default" 
}: ModernKPICardProps) {
  const variantStyles = {
    default: "bg-card",
    gradient: "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
    outline: "bg-transparent border-2",
  };
  
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-border/60 p-5",
      "transition-all duration-300 ease-out",
      "hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5",
      "hover:border-border/80",
      variantStyles[variant]
    )}>
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {delta && (
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                delta.isPositive 
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
              )}>
                {delta.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(delta.value)}%
              </span>
              <span className="text-xs text-muted-foreground">vs kemarin</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl",
          "bg-gradient-to-br from-primary/10 to-primary/5",
          "ring-1 ring-primary/10"
        )}>
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}
```

---

### 3.2 Section Cards (Modern)

```tsx
// Modern Section Card
interface ModernSectionCardProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  variant?: "default" | "elevated" | "gradient";
}

export function ModernSectionCard({
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  variant = "default"
}: ModernSectionCardProps) {
  const variants = {
    default: "bg-card border-border/60",
    elevated: "bg-card-elevated border-border/40 shadow-lg shadow-black/5",
    gradient: "bg-gradient-to-br from-card to-card/50 border-primary/10",
  };
  
  return (
    <div className={cn(
      "flex flex-col overflow-hidden rounded-2xl border",
      "transition-all duration-300",
      variants[variant],
      className
    )}>
      <div className={cn(
        "flex items-center justify-between gap-4 px-6 py-5 border-b border-border/40",
        headerClassName
      )}>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
```

---

### 3.3 Data Tables (Modern)

```tsx
// Modern Table Styling
const ModernTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-hidden rounded-2xl border border-border/60">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));

const ModernTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("bg-muted/50", className)}
    {...props}
  />
));

const ModernTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { highlighted?: boolean }
>(({ className, highlighted, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors duration-200",
      "hover:bg-muted/50",
      highlighted && "bg-amber-50/60 dark:bg-amber-950/20",
      className
    )}
    {...props}
  />
));

const ModernTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
      "first:rounded-tl-2xl last:rounded-tr-2xl",
      className
    )}
    {...props}
  />
));

const ModernTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle", className)}
    {...props}
  />
));
```

---

### 3.4 Navigation (Modern Sidebar)

```tsx
// Modern Sidebar Menu Item
const ModernSidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string;
  }
>(({ asChild = false, isActive = false, tooltip, className, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  
  return (
    <Comp
      ref={ref}
      data-active={isActive}
      className={cn(
        "group/menu-button flex w-full items-center gap-3 overflow-hidden",
        "rounded-xl px-3 py-2.5 text-left text-sm font-medium",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        
        // Default state
        "text-muted-foreground hover:bg-muted hover:text-foreground",
        
        // Active state
        isActive && [
          "bg-primary/10 text-primary",
          "hover:bg-primary/15",
        ],
        
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});

// Modern Sidebar Container
const ModernSidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-72 flex-col gap-4 p-4",
      "bg-card/50 backdrop-blur-xl",
      "border-r border-border/60",
      className
    )}
    {...props}
  />
));
```

---

## 4. Layout Patterns

### 4.1 Dashboard Grid

```tsx
// Modern Dashboard Layout
function ModernDashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72">
        <ModernSidebar />
      </aside>
      
      {/* Main Content */}
      <main className="ml-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 h-16 px-8">
          <div className="flex h-full items-center justify-between rounded-b-2xl bg-card/80 px-6 backdrop-blur-xl">
            {/* Header content */}
          </div>
        </header>
        
        {/* Page Content */}
        <div className="p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Page sections */}
          </div>
        </div>
      </main>
    </div>
  );
}
```

### 4.2 Card Grid Patterns

```tsx
// Bento Grid Layout
function BentoGrid() {
  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Large card - spans 2x2 */}
      <div className="lg:col-span-2 lg:row-span-2">
        <ModernSectionCard className="h-full">
          {/* Content */}
        </ModernSectionCard>
      </div>
      
      {/* Medium cards */}
      <div className="lg:col-span-2">
        <ModernKPICard />
      </div>
      <div className="lg:col-span-2">
        <ModernKPICard />
      </div>
      
      {/* Small cards */}
      <div className="lg:col-span-1">
        <ModernKPICard />
      </div>
      <div className="lg:col-span-1">
        <ModernKPICard />
      </div>
      <div className="lg:col-span-1">
        <ModernKPICard />
      </div>
      <div className="lg:col-span-1">
        <ModernKPICard />
      </div>
    </div>
  );
}
```

---

## 5. Animation Patterns

### 5.1 Fade In Up (Staggered)

```tsx
// Staggered fade-in animation
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

// Usage with Framer Motion
<motion.div 
  variants={staggerContainer}
  initial="initial"
  animate="animate"
  className="grid gap-4"
>
  {items.map((item, i) => (
    <motion.div key={i} variants={fadeInUp}>
      <Card />
    </motion.div>
  ))}
</motion.div>
```

### 5.2 Hover Scale

```tsx
// Subtle scale on hover
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  <Card />
</motion.div>
```

### 5.3 Loading Skeleton

```tsx
// Shimmer effect for loading states
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>
    </div>
  );
}
```

---

## 6. Accessibility Checklist

- [ ] **Contrast Ratios**: 4.5:1 for normal text, 3:1 for large text
- [ ] **Focus Indicators**: Visible 2px ring with offset on all interactive elements
- [ ] **Touch Targets**: Minimum 44x44px for all clickable elements
- [ ] **Motion**: Respect `prefers-reduced-motion` media query
- [ ] **Semantic HTML**: Proper heading hierarchy, landmarks, and ARIA labels
- [ ] **Color Independence**: Never rely solely on color to convey information

---

## 7. Implementation Priority

### Phase 1: Foundation (High Impact, Easy)
1. Update border radius tokens (`rounded-2xl` for cards)
2. Enhance button styles (pill shapes, soft variants)
3. Add subtle shadows to cards
4. Update input rounded corners

### Phase 2: Components (Medium Impact)
1. Refactor KPI cards with new design
2. Update table styling
3. Modernize sidebar navigation
4. Add hover animations

### Phase 3: Polish (High Impact, Detailed)
1. Add gradient accents
2. Implement glassmorphism effects
3. Add micro-interactions
4. Refine spacing and typography

---

## 8. Quick Wins (Apply Now)

### Update globals.css radius:
```css
:root {
  --radius: 0.75rem;  /* Change from 0.5rem */
}
```

### Update Card component:
```tsx
// Change from rounded-lg to rounded-2xl
className="rounded-2xl border bg-card text-card-foreground"
```

### Update Buttons to pills:
```tsx
// Add rounded-full to all button variants
className="... rounded-full"
```

### Add hover lift to cards:
```tsx
className="... transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
```
