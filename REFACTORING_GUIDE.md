# Project Refactoring Guide

## Overview
This guide documents the refactoring of the Supervision project to use separate CSS/SCSS files instead of inline styles.

## Structure Improvements

### 1. Shared Styles
Created centralized style files in `/frontend/src/styles/`:

- **`_variables.scss`** - Color palette, spacing, shadows, transitions, breakpoints
- **`_mixins.scss`** - Reusable SCSS mixins for common patterns

### 2. Component Styles
Each component now has its own `.scss` file:

```
component-name/
├── component-name.component.ts
├── component-name.component.html  (template)
├── component-name.component.scss  (styles)
└── component-name.component.spec.ts
```

### 3. Benefits

✅ **Better Organization**
- Styles are separated from logic
- Easier to find and modify styles
- Better IDE support and autocomplete

✅ **Reusability**
- Shared variables and mixins
- Consistent design system
- DRY (Don't Repeat Yourself)

✅ **Maintainability**
- Easier to update themes
- Simpler debugging
- Better collaboration

✅ **Performance**
- Styles can be cached separately
- Better build optimization
- Smaller component files

## How to Use

### Import Shared Styles
In any component SCSS file:

```scss
@import '../../../../styles/variables';
@import '../../../../styles/mixins';

.my-component {
  background: $primary-color;
  @include card;
  @include hover-lift;
}
```

### Available Variables
- Colors: `$primary-color`, `$gray-50`, `$white`, etc.
- Spacing: `$spacing-xs` to `$spacing-xxl`
- Shadows: `$shadow-sm` to `$shadow-xl`
- Border radius: `$border-radius-sm` to `$border-radius-xl`

### Available Mixins
- `@include flex-center` - Center content with flexbox
- `@include card($padding)` - Card styling
- `@include hover-lift` - Hover animation
- `@include gradient-bg` - Primary gradient background
- `@include section-card($color)` - Section with colored border
- `@include respond-to('sm')` - Responsive breakpoints

## Migration Status

### ✅ Completed
- [x] Created shared variables and mixins
- [x] Intervention form component styles extracted

### 🔄 In Progress
- [ ] Dashboard component
- [ ] Login component
- [ ] Predefined values component
- [ ] Intervention list component
- [ ] Intervention detail component

### 📋 To Do
- [ ] Extract all remaining inline templates to `.html` files
- [ ] Create component-specific SCSS files for all components
- [ ] Update documentation
- [ ] Add theme switching capability

## Best Practices

1. **Always use variables** for colors, spacing, and other design tokens
2. **Use mixins** for repeated patterns
3. **Keep specificity low** - avoid deep nesting
4. **Use BEM naming** for custom classes when needed
5. **Leverage Angular Material** theming system

## Example Component Structure

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent {
  // Component logic
}
```

```scss
// example.component.scss
@import '../../../styles/variables';
@import '../../../styles/mixins';

.example-container {
  @include gradient-bg;
  padding: $spacing-xl;
  
  .example-card {
    @include card;
    @include hover-lift;
  }
}
```

## Notes
- All paths to shared styles use relative imports
- SCSS files are automatically compiled by Angular CLI
- No additional build configuration needed
