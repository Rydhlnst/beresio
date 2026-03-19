# Quick Changes - Copy & Paste

## 1. globals.css - Replace :root section

```css
:root {
  /* KEEP THIS - Don't change radius */
  --radius: 0.5rem;
  
  /* UPDATE THESE - Notion colors */
  --background: 0 0% 100%;
  --foreground: 40 8% 20%;
  --card: 0 0% 100%;
  --card-foreground: 40 8% 20%;
  --popover: 0 0% 100%;
  --popover-foreground: 40 8% 20%;
  --primary: 4 60% 55%;
  --primary-foreground: 0 0% 100%;
  --secondary: 40 8% 96%;
  --secondary-foreground: 40 8% 20%;
  --muted: 40 8% 96%;
  --muted-foreground: 0 0% 42%;
  --accent: 40 8% 96%;
  --accent-foreground: 40 8% 20%;
  --destructive: 0 60% 55%;
  --destructive-foreground: 0 0% 100%;
  --border: 40 6% 88%;
  --input: 40 6% 88%;
  --ring: 4 60% 55%;
  --sidebar-background: 0 0% 100%;
  --sidebar-foreground: 40 8% 20%;
  --sidebar-primary: 4 60% 55%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 40 8% 96%;
  --sidebar-accent-foreground: 40 8% 20%;
  --sidebar-border: 40 6% 88%;
  --sidebar-ring: 4 60% 55%;
}
```

---

## 2. card.tsx - Simplify Card

```tsx
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground",  /* Removed shadow-sm */
      className
    )}
    {...props}
  />
))
```

---

## 3. button.tsx - Flat Buttons

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
        outline: "border border-input bg-background hover:bg-secondary hover:text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 px-2.5",
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

## 4. badge.tsx - Subtle Badges

```tsx
const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

---

## 5. kpi-card.tsx - Flat KPI Cards

Replace the return statement:

```tsx
return (
    <div className={cn(
        "rounded-lg border bg-card p-4 space-y-3",
        "transition-colors duration-150 hover:bg-secondary/50"
    )}>
        <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
        </div>
        <p className="text-xl font-semibold text-foreground">{value}</p>
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
```

---

## 6. section-card.tsx - Flat Section Card

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
                        {title && <h3 className="text-sm font-medium text-foreground">{title}</h3>}
                        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
                    </div>
                    {actions && <div className="flex-shrink-0">{actions}</div>}
                </div>
            )}
            <div className="flex-1 p-4">{children}</div>
        </div>
    );
}
```

---

## 7. Remove from Your Code

Find and remove these patterns:

```tsx
// REMOVE gradients
className="bg-gradient-to-br ..."

// REMOVE heavy shadows  
className="... shadow-lg shadow-black/5"
className="... shadow-md"
className="... hover:shadow-lg"

// REMOVE hover lifts
className="... hover:-translate-y-0.5"
className="... hover:scale-[1.02]"

// REMOVE colorful badge borders
className="border-emerald-200 bg-emerald-50 ..."
// REPLACE with:
className="bg-emerald-50 text-emerald-700"

// REMOVE ring decorations
className="... ring-1 ring-primary/10"

// REMOVE blur effects
className="... blur-2xl"
```

---

## 8. Replace with These

```tsx
// INSTEAD OF gradients
className="bg-secondary"

// INSTEAD OF shadows
className="border"

// INSTEAD OF hover lifts
className="hover:bg-secondary/50 transition-colors"

// INSTEAD OF colorful borders
className="bg-muted text-muted-foreground"

// INSTEAD OF rings
className="border"
```

---

## Visual Before/After

### Card
```tsx
// BEFORE
<div className="rounded-2xl border border-border/60 bg-card shadow-lg shadow-black/5 p-5 hover:shadow-xl hover:-translate-y-0.5">

// AFTER  
<div className="rounded-lg border bg-card p-4 hover:bg-secondary/50 transition-colors">
```

### Button
```tsx
// BEFORE
<button className="h-10 px-6 bg-primary text-white rounded-full shadow-md hover:shadow-lg hover:shadow-primary/20">

// AFTER
<button className="h-8 px-3 bg-primary text-white rounded-md hover:opacity-90">
```

### Badge
```tsx
// BEFORE
<span className="border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-0.5">

// AFTER
<span className="bg-emerald-50 text-emerald-700 rounded-md px-2 py-0.5">
```
