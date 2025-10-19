# Design Guidelines: Web Accessibility Checker Tool

## Design Approach: Professional Utility Tool

**Selected Approach**: Design System (Material Design principles adapted for Bootstrap)

**Justification**: This is a professional developer/business tool focused on clarity, readability, and efficient workflow. The interface must be information-dense yet scannable, prioritizing function over aesthetic flair. As an accessibility tool, it must exemplify accessible design principles.

**Key Design Principles**:
- Clarity and readability above all
- Exemplary accessibility (the tool must be accessible itself)
- Professional, trustworthy appearance
- Efficient information hierarchy for technical reports

## Core Design Elements

### A. Color Palette

**Light Mode**:
- Primary: 220 70% 50% (Professional blue for actions/links)
- Success: 142 71% 45% (Pass states, compliant elements)
- Warning: 38 92% 50% (Moderate severity issues)
- Error: 0 84% 60% (Critical violations)
- Background: 0 0% 98% (Clean white base)
- Surface: 0 0% 100% (Cards, elevated surfaces)
- Text Primary: 220 13% 18% (High contrast dark text)
- Text Secondary: 220 9% 46% (Supporting text)
- Border: 220 13% 91% (Subtle dividers)

**Dark Mode**:
- Primary: 220 70% 60% (Adjusted for dark backgrounds)
- Success: 142 71% 55%
- Warning: 38 92% 60%
- Error: 0 84% 70%
- Background: 220 13% 10%
- Surface: 220 13% 14%
- Text Primary: 0 0% 95%
- Text Secondary: 220 9% 65%
- Border: 220 13% 25%

### B. Typography

**Font Families**:
- Primary: 'Inter', system-ui, sans-serif (via Google Fonts)
- Monospace: 'Fira Code', 'Courier New', monospace (for URLs, code snippets)

**Type Scale**:
- Display (page title): text-3xl font-bold (30px)
- Heading 1 (section headers): text-2xl font-semibold (24px)
- Heading 2 (subsections): text-xl font-semibold (20px)
- Body: text-base (16px)
- Small: text-sm (14px)
- Caption: text-xs (12px)

**Line Heights**: Use relaxed (1.625) for body text to ensure readability

### C. Layout System

**Spacing Units**: Use Tailwind primitives of 4, 6, 8, 12, and 16 (p-4, mb-6, gap-8, py-12, mt-16)

**Container Strategy**:
- Max-width: max-w-6xl for main content area
- Padding: px-4 md:px-6 lg:px-8 for responsive spacing
- No full viewport height constraints - natural content flow

**Grid Structure**:
- Single column layout for main workflow
- Two-column split for results: violations list (60%) + details panel (40%)
- Report cards in single column stack for clarity

### D. Component Library

**Input Section**:
- Large, prominent URL input field with clear label
- Input: Rounded corners (rounded-lg), generous padding (p-4), focus ring in primary color
- Submit button: Large (px-8 py-3), primary color, rounded-lg, with loading state
- Example URLs or quick start guide below input

**Results Dashboard**:
- Summary cards showing: Total violations, Critical count, Warnings, Passed checks
- Cards: White/dark surface, shadow-sm, rounded-lg, p-6 spacing
- Icon + Number + Label layout for each metric

**Violations Report**:
- Accordion/expandable list grouped by category (Images, Contrast, Navigation, Semantics, Forms)
- Each violation item shows: Severity badge, WCAG criterion, Element selector, Line preview
- Color-coded severity indicators: Red (Critical), Orange (Important), Yellow (Moderate)
- Expand to show: Full description, Affected code snippet, Recommendation, Learn more link

**Code Display**:
- Monospace font with syntax highlighting indication
- Light gray background in light mode (0 0% 96%), dark surface in dark mode
- Rounded corners, p-4 padding
- Copy button in top-right corner

**Navigation**:
- Simple top bar: Logo/title left, theme toggle and history link right
- Minimal, clean header with border-bottom divider

**History Table** (if showing past checks):
- Clean table with alternating row backgrounds
- Columns: URL, Date, Total Issues, Status badge, View Report action
- Hover states on rows

### E. Interactions & States

**Loading States**:
- Spinner with "Analyzing website..." text during check
- Progress indicator showing steps: Loading page → Running checks → Generating report

**Empty States**:
- Centered illustration or icon when no checks run yet
- Clear call-to-action to start first check

**Focus Indicators**:
- 2px solid primary color outline with 2px offset
- Visible on all interactive elements (buttons, inputs, links, accordion toggles)

**Button States**:
- Default: Solid primary background
- Hover: Slightly darker shade (brightness-95)
- Active: Even darker (brightness-90)
- Disabled: Reduced opacity (opacity-50), cursor-not-allowed

## Images

**No hero image needed** - this is a functional tool, not a marketing page.

**Icon Usage**:
- Use Bootstrap Icons or Material Icons via CDN
- Status icons: Check circle (success), warning triangle, error circle
- Category icons for violation types: Image icon, palette (color), keyboard, list (semantics), form icon
- Small icons (16-20px) inline with text, larger (24-32px) in summary cards

## Accessibility Requirements

- Minimum 4.5:1 contrast ratio for all text (7:1 for AA large text)
- All interactive elements keyboard accessible with visible focus
- Proper ARIA labels on all dynamic content
- Semantic HTML structure (nav, main, section, article)
- Form labels properly associated with inputs
- Status messages announced to screen readers
- Color never sole indicator (use icons + text)

**Meta Principle**: This tool checks accessibility - it must be an exemplar of accessible design. Every design decision should pass its own checks.