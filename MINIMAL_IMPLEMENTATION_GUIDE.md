# Minimalist Implementation Guide
## Notion-Style Updates for Existing Components

**Goal**: Transform the UI to be flat, minimal, and Notion-inspired while **keeping all existing functionality and border radius values**.

---

## 🔧 Files to Update

### 1. Update `apps/app/app/globals.css`

Replace your current `:root` color values with these:

```css
@layer base {
  :root {
    /* KEEP EXISTING RADIUS - Don't change */
    --radius: 0.5rem;
    
    /* UPDATE COLORS - Notion Style */
    --background: 0 0% 100%;
    --foreground: 40 8% 20%;        /* #37352f - Notion black */
    
    --card: 0 0% 100%;
    --card-foreground: 40 8% 20%;
    
    --popover: 0 0% 100%;
    --popover-foreground: 40 8% 20%;
    
    /* Desaturated coral (was 11 86% 53%) */
    --primary: 4 60% 55%;
    --primary-foreground: 0 0% 100%;
    
    /* Warm gray background */
    --secondary: 40 8% 96%;
    --secondary-foreground: 40 8% 20%;
    
    --muted: 40 8% 96%;
    --muted-foreground: 0 0% 42%;   /* Muted text */
    
    --accent: 40 8% 96%;
    --accent-foreground: 40 8% 20%;
    
    /* Muted destructive */
    --destructive: 0 60% 55%;
    --destructive-foreground: 0 0% 100%;
    
    /* Subtle borders */
    --border: 40 6% 88%;
    --input: 40 6% 88%;
    --ring: 4 60% 55%;
    
    /* Sidebar - clean */
    --sidebar-background: 0 0% 100%;
    --sidebar-foreground: 40 8% 20%;
    --sidebar-primary: 4 60% 55%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 40 8% 96%;
    --sidebar-accent-foreground: 40 8% 20%;
    --sidebar-border: 40 6% 88%;
    --sidebar-ring: 4 60% 55%;
  }

  .dark {
    --background: 0 0% 10%;
    --foreground: 0 0% 100%;
    
    --card: 0 0% 12%;
    --card-foreground: 0 0% 100%;
    
    --popover: 0 0% 12%;
    --popover-foreground: 0 0% 100%;
    
    --primary: 4 70% 60%;
    --primary-foreground: 0 0% 100%;
    
    --secondary: 0 0% 18%;
    --secondary-foreground: 0 0% 100%;
    
    --muted: 0 0% 18%;
    --muted-foreground: 0 0% 60%;
    
    --accent: 0 0% 18%;
    --accent-foreground: 0 0% 100%;
    
    --destructive: 0 60% 50%;
    --destructive-foreground: 0 0% 100%;
    
    --border: 0 0% 20%;
    --input: 0 0% 20%;
    --ring: 4 70% 60%;
    
    --sidebar-background: 0 0% 10%;
    --sidebar-foreground: 0 0% 100%;
    --sidebar-primary: 4 70% 60%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 0 0% 18%;
    --sidebar-accent-foreground: 0 0% 100%;
    --sidebar-border: 0 0% 20%;
    --sidebar-ring: 4 70% 60%;
  }
}
```

---

### 2. Update `packages/ui/src/card.tsx`

**Keep the same radius**, just simplify:

```tsx
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground",  /* REMOVED: shadow-sm */
      className
    )}
    {...props}
  />
))
```

**Card Header** - Keep as is:
```tsx
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}  /* SAME */
    {...props}
  />
))
```

---

### 3. Update `packages/ui/src/button.tsx`

**Keep the same radius and functionality**, simplify styling:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        /* REMOVE shadow, keep flat */
        default: "bg-primary text-primary-foreground hover:opacity-90 rounded-md",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90 rounded-md",
        outline: "border border-input bg-background hover:bg-secondary hover:text-secondary-foreground rounded-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md",
        ghost: "hover:bg-secondary hover:text-secondary-foreground rounded-md",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-8 px-3",      /* Slightly smaller */
        sm: "h-7 px-2.5 text-xs",
        lg: "h-9 px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

---

### 4. Update `packages/ui/src/badge.tsx`

**Simpler, flatter badges**:

```tsx
const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border-0",  /* Subtle bg, no border */
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border text-foreground",
        
        /* Add these utility variants */
        success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        error: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

---

### 5. Update `packages/ui/src/input.tsx`

**Cleaner borders, no shadow**:

```tsx
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-8 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm",
        "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground",
        "transition-colors duration-150",
        "hover:border-border-strong",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
```

---

### 6. Update Dashboard Components

#### KPI Card (`apps/app/components/dashboard/kpi-strip/kpi-card.tsx`)

**Simplify - remove gradients and shadows**:

```tsx
export function KPICard({ label, value, icon: Icon, delta, isLoading }: KPICardProps) {
    if (isLoading) {
        return (
            <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <Skeleton className="h-6 w-24" />
            </div>
        );
    }

    return (
        <div className={cn(
            "rounded-lg border bg-card p-4 space-y-3",
            "transition-colors duration-150 hover:bg-secondary/50"
        )}>
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                    {label}
                </p>
                <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>

            <p className="text-xl font-semibold text-foreground">
                {value}
            </p>

            {delta ? (
                <p className={cn(
                    "text-xs",
                    delta.isPositive ? "text-emerald-600" : "text-rose-600"
                )}>
                    {delta.isPositive ? "↑" : "↓"} {Math.abs(delta.value)}% vs kemarin
                </p>
            ) : (
                <span className="text-xs text-muted-foreground">vs kemarin</span>
            )}
        </div>
    );
}
```

#### Section Card (`apps/app/components/dashboard/shared/section-card.tsx`)

**Flatter, cleaner**:

```tsx
export function SectionCard({ title, description, actions, children, className }: SectionCardProps) {
    return (
        <div className={cn(
            "flex flex-col rounded-lg border bg-card overflow-hidden",
            className
        )}>
            {(title || actions) && (
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-b">
                    <div>
                        {title && (
                            <h3 className="text-sm font-medium text-foreground">{title}</h3>
                        )}
                        {description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex-shrink-0">{actions}</div>}
                </div>
            )}
            <div className="flex-1 p-4">
                {children}
            </div>
        </div>
    );
}
```

---

### 7. Update Sidebar (`packages/ui/src/sidebar.tsx`)

**Cleaner menu items**:

Find the `sidebarMenuButtonVariants` and simplify:

```tsx
const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "hover:bg-secondary",
        outline: "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-secondary hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8",
        sm: "h-7 text-xs",
        lg: "h-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

---

### 8. Update Table (`packages/ui/src/table.tsx`)

**Cleaner table styling**:

```tsx
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("border-b", className)} {...props} />
))

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors duration-150 hover:bg-secondary/50 data-[state=selected]:bg-secondary",
      className
    )}
    {...props}
  />
))

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-9 px-3 text-left align-middle font-medium text-muted-foreground text-xs",
      className
    )}
    {...props}
  />
))

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-3 align-middle", className)}
    {...props}
  />
))
```

---

## 🎨 Visual Changes Summary

| Element | Before | After (Minimal) |
|---------|--------|-----------------|
| **Card radius** | `rounded-2xl` (24px) | `rounded-lg` (8px) - **SAME AS NOW** |
| **Button radius** | `rounded-full` | `rounded-md` (6px) - **SAME AS NOW** |
| **Card shadow** | `shadow-lg` | **None** (flat) |
| **Button shadow** | `shadow-md` | **None** (flat) |
| **Card bg** | White + gradients | White / Warm gray |
| **Primary color** | Bright coral | Desaturated coral |
| **Text** | Pure black | Warm gray (#37352f) |
| **Borders** | Visible | Subtle warm gray |
| **Hover effect** | Lift + shadow | Background color change |
| **Badges** | Colorful + bordered | Subtle bg only |

---

## ✅ Checklist

- [ ] Update `globals.css` color variables
- [ ] Remove all gradient classes (`bg-gradient-to-*`)
- [ ] Remove all shadow classes (`shadow-*`, except `focus-visible:ring`)
- [ ] Simplify card styling (flat bg, simple border)
- [ ] Update button hover to `opacity` instead of `shadow`
- [ ] Simplify badges (subtle bg, no border)
- [ ] Update input borders to be cleaner
- [ ] Test all existing functionality still works
- [ ] Verify dark mode looks good

---

## 🚫 What NOT to Change

1. **Border radius values** - Keep existing `rounded-lg`, `rounded-md`, etc.
2. **Component props/interfaces** - Don't change API
3. **Logic/behavior** - Only visual changes
4. **Animations** - Keep existing Framer Motion transitions
5. **Layout structure** - Grid/flex structures stay the same

---

## 🎯 Final Look

Your dashboard will look like:
- **Notion** - Clean, flat, minimal
- **Linear** - Functional, subtle
- **Supabase** - Modern, uncluttered
- **Vercel Dashboard** - Professional, refined
