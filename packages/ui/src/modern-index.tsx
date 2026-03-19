/**
 * Beres.io Modern UI Components
 * 
 * Import these components for the modern, curved design:
 * 
 * import { 
 *   CardModern, 
 *   ButtonModern, 
 *   BadgeModern,
 *   DashboardSectionCard 
 * } from "@repo/ui/modern"
 */

// Cards
export {
  CardModern,
  CardModernHeader,
  CardModernTitle,
  CardModernDescription,
  CardModernContent,
  CardModernFooter,
  CardGradientBorder,
  StatCard,
} from "./card-modern"

export type {
  // CardModern props are inferred from the component
} from "./card-modern"

// Buttons
export {
  ButtonModern,
  IconButton,
  ButtonGroup,
  buttonVariants,
} from "./button-modern"

export type {
  ButtonModernProps,
} from "./button-modern"

// Badges
export {
  BadgeModern,
  StatusBadge,
  badgeVariants,
} from "./badge-modern"

export type {
  BadgeModernProps,
} from "./badge-modern"

// Dashboard Components
export {
  DashboardSectionCard,
  CompactSectionCard,
  MetricCard,
  ActionCard,
} from "./dashboard-section-card"

export type {
  DashboardSectionCardProps,
  CompactSectionCardProps,
  MetricCardProps,
  ActionCardProps,
} from "./dashboard-section-card"
