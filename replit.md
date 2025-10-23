# Веб-инструмент проверки доступности сайтов

## Overview
This project is a professional web application designed for automated accessibility testing of websites against WCAG AA standards. It leverages Puppeteer for headless browser page loading and axe-core for comprehensive accessibility analysis. The tool aims to help small and medium businesses improve their web accessibility by providing detailed reports, historical tracking, and an intuitive user interface. Key capabilities include automated scanning, detailed reporting with WCAG links and remediation advice, and a user-friendly interface with responsive design and theme options. The business vision is to provide an essential tool for web accessibility, fostering inclusive web environments.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.

## System Architecture

### UI/UX Decisions
The application features a responsive design, supporting both dark and light themes. The interface is professional and accessible, adhering to accessibility guidelines like minimum contrast ratios (4.5:1), keyboard navigability, visible focus indicators, and semantic HTML structure. UI components are built using Shadcn UI with Tailwind CSS, ensuring a modern and consistent look. Accessibility violation lists are collapsible by category, and a new section displays passed checks. Navigation is enhanced by linking metric cards (Critical, Warnings, Passed) to their respective sections.

### Technical Implementations
The frontend is developed with React and TypeScript, utilizing Wouter for routing and TanStack Query for state management. The backend is an Express.js server, integrating Puppeteer for headless browser automation and axe-core for WCAG accessibility scanning. Data persistence is handled by PostgreSQL (Neon) with Drizzle ORM. Zod is used for validation.

### Feature Specifications
- **Accessibility Analysis**: Automatic scanning of any URL using Puppeteer and axe-core for WCAG 2.1 AA standards, including post-redirect checks.
- **Detailed Reports**: Categorized violations (e.g., images, contrast, navigation) with criticality levels, affected HTML elements, WCAG documentation links, and remediation recommendations.
- **Statistics**: Overall violation counts, breakdown by criticality, passed checks, and visual metric cards.
- **Check History**: Storage of all results in PostgreSQL, showing the last 50 checks with dates, URLs, and quick access to details.
- **HTML Validation**: Comprehensive HTML syntax checking, including nesting, deprecated attributes, and general W3C compliance.
- **Accessibility Checks**: Includes core axe-core checks (images, contrast, navigation, semantic structure, forms, ARIA) and extended automated checks (scaling, media autoplay, tabindex, focus visibility, time limits).

### System Design Choices
- **Puppeteer**: Chosen over static HTML analysis to accurately process JavaScript-rendered content and reflect the final DOM state.
- **PostgreSQL**: Selected for reliable history storage, flexible JSONB support for violations, and future complex query capabilities.
- **Categorization of Violations**: Designed to simplify issue comprehension, prioritize fixes, and align with WCAG categories.

## External Dependencies

- **Frontend**:
    - `react`
    - `wouter`
    - `@tanstack/react-query`
    - `shadcn-ui` (with `tailwind-css`)
    - `lucide-react`
- **Backend**:
    - `express`
    - `puppeteer`
    - `axe-core`
    - `drizzle-orm`
- **Database**:
    - `PostgreSQL` (specifically `Neon` for serverless)
    - `@neondatabase/serverless`
- **Validation**:
    - `zod`