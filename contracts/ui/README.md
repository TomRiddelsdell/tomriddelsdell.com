# UI Contracts

This directory contains design system contracts, component interfaces, and frontend integration specifications for the portfolio platform. These contracts ensure consistency across frontend applications and enable shared component libraries.

## Purpose

**Frontend Contracts**: Design system specifications, component APIs, and UI integration contracts that enable consistent user experiences and reusable UI components across all applications.

## Design Principles

### 🎨 **Design System Consistency**
- **Component Contracts**: Standardized component props and behaviors
- **Design Tokens**: Shared colors, typography, spacing, and animation values
- **Accessibility Standards**: WCAG 2.1 AA compliance requirements
- **Responsive Design**: Mobile-first responsive behavior specifications

### 🔧 **Component Architecture**
- **Atomic Design**: Organized by atoms, molecules, organisms, templates
- **Props Interfaces**: TypeScript interfaces for all component props
- **Event Contracts**: Standardized component event handling
- **Composition Patterns**: How components compose together

### 📱 **Cross-Platform Support**
- **Web Components**: React component specifications
- **Mobile Responsive**: Responsive behavior contracts
- **Theme Support**: Light/dark theme specifications
- **Accessibility**: Screen reader and keyboard navigation support

## Directory Structure

```
ui/
├── design-system/             # Design system specifications
│   ├── tokens/
│   │   ├── colors.json           # Color palette definitions
│   │   ├── typography.json       # Font and text styles
│   │   ├── spacing.json          # Spacing scale values
│   │   ├── shadows.json          # Box shadow definitions
│   │   └── animations.json       # Animation timing and curves
│   ├── themes/
│   │   ├── light-theme.json      # Light theme configuration
│   │   ├── dark-theme.json       # Dark theme configuration
│   │   └── high-contrast.json    # High contrast theme
│   └── accessibility/
│       ├── focus-states.json     # Focus indicator specifications
│       ├── color-contrast.json   # Color contrast requirements
│       └── screen-reader.json    # Screen reader support specs
├── components/                # Component interface specifications
│   ├── atoms/
│   │   ├── Button.interface.ts      # Button component contract
│   │   ├── Input.interface.ts       # Input field contract
│   │   ├── Icon.interface.ts        # Icon component contract
│   │   └── Badge.interface.ts       # Badge component contract
│   ├── molecules/
│   │   ├── SearchBox.interface.ts   # Search input with button
│   │   ├── FormField.interface.ts   # Label + input + validation
│   │   └── Card.interface.ts        # Card component contract
│   ├── organisms/
│   │   ├── Header.interface.ts      # Site header contract
│   │   ├── Navigation.interface.ts  # Navigation menu contract
│   │   ├── ProjectCard.interface.ts # Project display card
│   │   └── ContactForm.interface.ts # Contact form contract
│   └── templates/
│       ├── ProjectLayout.interface.ts # Project page layout
│       ├── AdminLayout.interface.ts   # Admin dashboard layout
│       └── LandingPage.interface.ts   # Landing page template
├── patterns/                  # UI interaction patterns
│   ├── navigation/
│   │   ├── breadcrumb-pattern.md    # Breadcrumb navigation rules
│   │   ├── pagination-pattern.md    # Pagination behavior
│   │   └── tab-pattern.md           # Tab component behavior
│   ├── forms/
│   │   ├── validation-pattern.md    # Form validation behavior
│   │   ├── error-handling.md        # Error message display
│   │   └── submission-pattern.md    # Form submission flow
│   └── feedback/
│       ├── loading-states.md        # Loading indicator patterns
│       ├── error-states.md          # Error state display
│       └── success-states.md        # Success feedback patterns
├── layouts/                   # Layout specifications
│   ├── grid-system.json         # CSS Grid system definitions
│   ├── breakpoints.json         # Responsive breakpoints
│   ├── container-sizes.json     # Max-width container sizes
│   └── layout-patterns.md       # Common layout patterns
├── icons/                     # Icon library specifications
│   ├── icon-catalog.json        # Available icons registry
│   ├── icon-sizing.json         # Icon size specifications
│   └── custom-icons/            # Custom SVG icon definitions
│       ├── portfolio-logo.svg
│       ├── project-icon.svg
│       └── contact-icon.svg
└── README.md                  # This file
```

## Design Token Structure

### Color Palette
```json
{
  "colors": {
    "primary": {
      "50": "#f0f9ff",
      "100": "#e0f2fe", 
      "500": "#0ea5e9",
      "900": "#0c4a6e"
    },
    "neutral": {
      "50": "#f8fafc",
      "100": "#f1f5f9",
      "500": "#64748b", 
      "900": "#0f172a"
    },
    "semantic": {
      "success": "#10b981",
      "warning": "#f59e0b",
      "error": "#ef4444",
      "info": "#3b82f6"
    }
  }
}
```

### Typography Scale
```json
{
  "typography": {
    "fontFamily": {
      "sans": ["Inter", "system-ui", "sans-serif"],
      "mono": ["JetBrains Mono", "Monaco", "monospace"]
    },
    "fontSize": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem"
    },
    "fontWeight": {
      "normal": "400",
      "medium": "500", 
      "semibold": "600",
      "bold": "700"
    },
    "lineHeight": {
      "tight": "1.25",
      "normal": "1.5",
      "relaxed": "1.75"
    }
  }
}
```

### Spacing System
```json
{
  "spacing": {
    "0": "0",
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem", 
    "4": "1rem",
    "6": "1.5rem",
    "8": "2rem",
    "12": "3rem",
    "16": "4rem",
    "24": "6rem"
  }
}
```

## Component Interface Specifications

### Button Component
```typescript
// components/atoms/Button.interface.ts
export interface ButtonProps {
  /** Button display text or content */
  children: React.ReactNode;
  
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Loading state with spinner */
  loading?: boolean;
  
  /** Click event handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  /** Button type for forms */
  type?: 'button' | 'submit' | 'reset';
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  
  /** Accessibility label */
  'aria-label'?: string;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Test ID for automation */
  testId?: string;
}

export interface ButtonBehavior {
  /** Focus management */
  focus(): void;
  
  /** Blur management */
  blur(): void;
  
  /** Programmatic click trigger */
  click(): void;
}

export interface ButtonVariantStyles {
  primary: {
    backgroundColor: string;
    color: string;
    border: string;
    hover: ButtonStateStyles;
    focus: ButtonStateStyles;
    disabled: ButtonStateStyles;
  };
  // ... other variants
}
```

### Form Field Component
```typescript
// components/molecules/FormField.interface.ts
export interface FormFieldProps {
  /** Field label text */
  label: string;
  
  /** Input field props */
  input: InputProps;
  
  /** Help text below field */
  helperText?: string;
  
  /** Error message */
  error?: string;
  
  /** Required field indicator */
  required?: boolean;
  
  /** Field layout orientation */
  orientation?: 'vertical' | 'horizontal';
  
  /** Test ID for automation */
  testId?: string;
}

export interface FormFieldValidation {
  /** Validation state */
  isValid: boolean;
  
  /** Validation error message */
  errorMessage?: string;
  
  /** Validation trigger */
  validateOn: 'blur' | 'change' | 'submit';
  
  /** Custom validation function */
  validator?: (value: any) => ValidationResult;
}
```

### Project Card Component
```typescript
// components/organisms/ProjectCard.interface.ts
export interface ProjectCardProps {
  /** Project data */
  project: {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    tags: string[];
    visibility: 'public' | 'private' | 'shared';
    updatedAt: Date;
  };
  
  /** Card interaction handlers */
  onView?: (projectId: string) => void;
  onEdit?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
  onShare?: (projectId: string) => void;
  
  /** Display options */
  showActions?: boolean;
  showTags?: boolean;
  showDate?: boolean;
  
  /** Card size variant */
  size?: 'compact' | 'default' | 'expanded';
  
  /** Loading state */
  loading?: boolean;
  
  /** Test ID for automation */
  testId?: string;
}

export interface ProjectCardBehavior {
  /** Keyboard navigation */
  handleKeyNavigation: (event: React.KeyboardEvent) => void;
  
  /** Focus management */
  focusCard: () => void;
  
  /** Action menu toggle */
  toggleActionMenu: () => void;
}
```

## UI Interaction Patterns

### Form Validation Pattern
```markdown
# Form Validation Pattern

## Validation Timing
- **On Blur**: Validate field when user leaves the field
- **On Change**: Real-time validation for critical fields (password strength)
- **On Submit**: Final validation before form submission

## Error Display
- **Inline Errors**: Show errors below form fields
- **Error Summary**: List all errors at top of form for screen readers
- **Error States**: Red border and error icon for invalid fields

## Success States
- **Success Icons**: Green checkmark for valid fields
- **Success Messages**: Confirmation messages for successful actions
- **Progress Indicators**: Show validation progress for complex forms

## Accessibility
- **ARIA Labels**: aria-invalid, aria-describedby for error messages
- **Screen Reader**: Announce errors to screen reader users
- **Keyboard Navigation**: Tab through all form elements
```

### Loading States Pattern
```markdown
# Loading States Pattern

## Component-Level Loading
- **Skeleton Loaders**: Show content placeholders while loading
- **Spinner Overlays**: Loading spinner over existing content
- **Progressive Loading**: Load content in stages

## Page-Level Loading  
- **Route Transitions**: Loading states between page changes
- **Lazy Loading**: Load components as they enter viewport
- **Error Boundaries**: Graceful error handling during loading

## Button Loading States
- **Disabled State**: Disable button during async operations
- **Loading Spinner**: Replace button content with spinner
- **Loading Text**: "Saving..." instead of "Save"
```

## Responsive Design Specifications

### Breakpoint System
```json
{
  "breakpoints": {
    "sm": "640px",
    "md": "768px", 
    "lg": "1024px",
    "xl": "1280px",
    "2xl": "1536px"
  }
}
```

### Layout Behavior
```typescript
export interface ResponsiveBehavior {
  /** Mobile navigation pattern */
  mobile: {
    navigation: 'drawer' | 'bottom-tabs';
    header: 'collapsed' | 'minimal';
    content: 'single-column';
  };
  
  /** Tablet layout adjustments */
  tablet: {
    navigation: 'sidebar' | 'top-nav';
    content: 'two-column' | 'single-column';
    cards: 'grid-2' | 'list';
  };
  
  /** Desktop layout specifications */
  desktop: {
    navigation: 'sidebar' | 'top-nav';
    content: 'three-column' | 'two-column';
    cards: 'grid-3' | 'grid-4';
  };
}
```

## Accessibility Specifications

### WCAG 2.1 AA Compliance
```json
{
  "accessibility": {
    "colorContrast": {
      "normal": "4.5:1",
      "large": "3:1"
    },
    "focusIndicators": {
      "visible": true,
      "color": "#0ea5e9",
      "width": "2px",
      "style": "solid"
    },
    "keyboardNavigation": {
      "tabOrder": "logical",
      "skipLinks": "provided",
      "trapFocus": "modals-and-dropdowns"
    },
    "screenReader": {
      "altText": "required-for-images",
      "ariaLabels": "required-for-interactive-elements", 
      "landmarks": "nav-main-aside-footer"
    }
  }
}
```

## Integration with Applications

### Component Library Usage
```typescript
// apps/portfolio-web/src/components/ProjectList.tsx
import { 
  ProjectCard, 
  Button, 
  LoadingSpinner 
} from '@portfolio/ui-components';
import type { 
  ProjectCardProps,
  ButtonProps 
} from '@portfolio/ui-contracts';

export const ProjectList: React.FC<ProjectListProps> = ({ projects, loading }) => {
  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          onView={handleProjectView}
          onEdit={handleProjectEdit}
          showActions={true}
          testId={`project-card-${project.id}`}
        />
      ))}
    </div>
  );
};
```

### Theme Integration
```typescript
// Theme provider setup
import { ThemeProvider } from '@portfolio/ui-components';
import { lightTheme, darkTheme } from '@portfolio/ui-contracts';

export const App: React.FC = () => {
  const [theme, setTheme] = useState('light');
  
  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      <AppContent />
    </ThemeProvider>
  );
};
```

## Testing Integration

### Component Testing
```typescript
// Component contract testing
import { render, screen } from '@testing-library/react';
import { Button } from '@portfolio/ui-components';
import { ButtonProps } from '@portfolio/ui-contracts';

describe('Button Component Contract', () => {
  it('should render all required props', () => {
    const props: ButtonProps = {
      children: 'Click me',
      variant: 'primary',
      onClick: jest.fn()
    };
    
    render(<Button {...props} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('should handle all interaction patterns', () => {
    const handleClick = jest.fn();
    
    render(
      <Button onClick={handleClick} testId="test-button">
        Click me
      </Button>
    );
    
    fireEvent.click(screen.getByTestId('test-button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Visual Regression Testing
```typescript
// Storybook integration for visual testing
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@portfolio/ui-components';
import { ButtonProps } from '@portfolio/ui-contracts';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};
```

## Build Integration

### Component Generation
```bash
# Generate component from contract
ui-codegen generate 
  --contract contracts/ui/components/atoms/Button.interface.ts 
  --template react-component 
  --output packages/ui-components/src/atoms

# Generate Storybook stories
ui-codegen generate 
  --contract contracts/ui/components/atoms/Button.interface.ts 
  --template storybook-story 
  --output packages/ui-components/stories
```

### Design Token Generation
```bash
# Generate CSS custom properties from design tokens
style-dictionary build 
  --config contracts/ui/design-system/config.json 
  --output packages/ui-components/dist/tokens.css

# Generate TypeScript constants
token-codegen 
  --input contracts/ui/design-system/tokens 
  --output packages/ui-components/src/tokens
```

## Architecture Compliance

### Atomic Design Methodology
- **Atoms**: Basic building blocks (buttons, inputs, icons)
- **Molecules**: Simple component combinations (search box, form field)
- **Organisms**: Complex component combinations (header, project card)
- **Templates**: Page layout structures
- **Pages**: Specific instances of templates

### Design System Integration
- **Consistent Tokens**: All components use design system tokens
- **Theme Support**: All components support light/dark themes
- **Accessibility**: All components meet WCAG 2.1 AA standards
- **Responsive**: All components work across all device sizes

---

**Design System**: Atomic Design + Design Tokens  
**Component Framework**: React with TypeScript  
**Maintained By**: Design System Team  
**Review Required**: Design Review for all component changes  
**Last Updated**: September 14, 2025
