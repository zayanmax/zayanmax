# Design System

## Product Style

Zayan Max should look like a premium modern SaaS dashboard:

- Clean
- Calm
- Professional
- Light theme first
- High readability
- Dense but not crowded
- Card-based layout
- Rounded corners
- Subtle borders and shadows

## Font Family

Primary font:

```css
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Alternative:

```css
font-family: Geist, Inter, system-ui, sans-serif;
```

## Font Size Rules

| Usage | Size | Weight | Line Height |
|---|---:|---:|---:|
| Display title | 32px | 700 | 40px |
| Page title | 28px | 700 | 36px |
| Section title | 22px | 600 | 30px |
| Card title | 16px | 600 | 24px |
| Body text | 14px | 400 | 22px |
| Table text | 13px | 400 | 20px |
| Small text | 12px | 400 | 18px |
| Button text | 14px | 500 | 20px |
| Label | 13px | 500 | 18px |

## Color Palette

### Core Colors

| Token | Hex | Usage |
|---|---|---|
| `--primary` | `#2563EB` | Main action, active nav, primary buttons |
| `--primary-hover` | `#1D4ED8` | Button hover |
| `--primary-light` | `#DBEAFE` | Light badge/background |
| `--background` | `#F8FAFC` | App background |
| `--surface` | `#FFFFFF` | Cards, panels, modals |
| `--border` | `#E2E8F0` | Borders/dividers |
| `--muted-border` | `#EEF2F7` | Soft separators |
| `--text-primary` | `#0F172A` | Main text |
| `--text-secondary` | `#64748B` | Secondary text |
| `--text-muted` | `#94A3B8` | Placeholder/helper text |

### Status Colors

| Token | Hex | Usage |
|---|---|---|
| `--success` | `#16A34A` | Approved, active, paid |
| `--success-bg` | `#DCFCE7` | Success badge bg |
| `--warning` | `#F59E0B` | Pending, warning |
| `--warning-bg` | `#FEF3C7` | Warning badge bg |
| `--danger` | `#DC2626` | Rejected, delete, overdue |
| `--danger-bg` | `#FEE2E2` | Danger badge bg |
| `--info` | `#0EA5E9` | Info, neutral update |
| `--info-bg` | `#E0F2FE` | Info badge bg |
| `--purple` | `#7C3AED` | Special stats/charts |
| `--purple-bg` | `#EDE9FE` | Purple badge bg |

## Tailwind Token Suggestion

```ts
colors: {
  primary: '#2563EB',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    muted: '#94A3B8',
  },
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#0EA5E9',
}
```

## Spacing Rules

Use 8px spacing grid.

| Token | Value |
|---|---:|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |

## Radius Rules

| Component | Radius |
|---|---:|
| Small input/badge | 8px |
| Button | 10px |
| Card | 14px |
| Modal | 18px |
| Large dashboard panel | 20px |

## Shadow Rules

Use shadows very lightly.

```css
--shadow-card: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04);
--shadow-dropdown: 0 12px 32px rgba(15, 23, 42, 0.12);
```

## Buttons

### Primary Button
- Background: `#2563EB`
- Text: white
- Height: 40px
- Radius: 10px
- Padding: 16px horizontal

### Secondary Button
- Background: white
- Border: `#E2E8F0`
- Text: `#0F172A`

### Danger Button
- Background: `#DC2626`
- Text: white

## Inputs

- Height: 40px
- Border: `#E2E8F0`
- Radius: 10px
- Placeholder: `#94A3B8`
- Focus ring: soft primary blue

## Tables

- Header background: `#F8FAFC`
- Row height: 56px
- Border: `#EEF2F7`
- Text: 13px to 14px
- Actions on right
- Use status badges for important state

## Badges

Use soft backgrounds:

- Active: green
- Inactive: red/gray
- Pending: amber
- Completed: blue/green
- Draft: gray

## Layout Rules

- Sidebar width: 260px
- Topbar height: 72px
- Page padding: 24px to 32px
- Card padding: 20px to 24px
- Dashboard grid gap: 16px to 24px

## Icon Rules

Use Lucide icons.

- Sidebar icons: 18px
- Button icons: 16px
- Empty state icons: 40px
- Stat card icons: 22px

## Chart Rules

Use simple charts:
- Line chart for finance trends
- Donut chart for attendance/task status
- Bar chart for category comparisons
- Avoid too many bright colors
- Always include labels or legends
