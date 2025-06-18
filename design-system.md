# GreenSentinel Design System

This document outlines the design tokens used in the GreenSentinel application across both web (React) and mobile (Flutter) platforms.

## Importing Design Tokens

### React/JavaScript

```javascript
// Import specific tokens
import { color, typography, spacing } from './design-tokens.json';

// Or import all tokens
import designTokens from './design-tokens.json';
```

### TypeScript

```typescript
// Import with type safety
import designTokens from './design-tokens.json';

// Type definitions
type ColorToken = keyof typeof designTokens.color;
type SpacingToken = keyof typeof designTokens.spacing;
type TypographyToken = keyof typeof designTokens.typography.fontSize;
```

### Dart/Flutter

```dart
// Load tokens in Flutter
import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;

Future<Map<String, dynamic>> loadDesignTokens() async {
  final String jsonString = await rootBundle.loadString('assets/design-tokens.json');
  return json.decode(jsonString);
}
```

## Theme Implementation

### React Theme Provider

```jsx
import React, { createContext, useContext } from 'react';
import designTokens from './design-tokens.json';

// Create theme context
const ThemeContext = createContext(designTokens);

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={designTokens}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for accessing theme
export const useTheme = () => useContext(ThemeContext);
```

### Flutter ThemeData

```dart
import 'package:flutter/material.dart';

ThemeData createTheme(Map<String, dynamic> tokens) {
  return ThemeData(
    primaryColor: Color(int.parse(tokens['color']['primary']['500']['value'].substring(1, 7), radix: 16) + 0xFF000000),
    scaffoldBackgroundColor: Color(int.parse(tokens['color']['gray']['50']['value'].substring(1, 7), radix: 16) + 0xFF000000),
    fontFamily: tokens['typography']['fontFamily']['base']['value'],
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        primary: Color(int.parse(tokens['color']['primary']['500']['value'].substring(1, 7), radix: 16) + 0xFF000000),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(double.parse(tokens['borderRadius']['xl']['value'].replaceAll('rem', '')) * 16),
        ),
      ),
    ),
    textTheme: TextTheme(
      headline6: TextStyle(
        fontSize: double.parse(tokens['typography']['fontSize']['2xl']['value'].replaceAll('rem', '')) * 16,
        fontWeight: FontWeight.bold,
      ),
      bodyText2: TextStyle(
        fontSize: double.parse(tokens['typography']['fontSize']['base']['value'].replaceAll('rem', '')) * 16,
      ),
    ),
  );
}
```

## Token Reference Tables

### Color Tokens

| Variable | Type | Token |
|----------|------|-------|
| Primary | Color | `color.primary.500.value` |
| Secondary | Color | `color.primary.600.value` |
| Light Background | Color | `color.gray.50.value` |
| Dark Text | Color | `color.gray.700.value` |
| Danger/Error | Color | `color.danger.500.value` |
| Warning | Color | `color.warning.500.value` |
| Info | Color | `color.info.500.value` |
| Success | Color | `color.success.600.value` |
| Alert | Color | `color.alert.500.value` |
| Pollution | Color | `color.pollution.500.value` |
| White Overlay | Color | `color.transparent.white20.value` |

### Typography Tokens

| Variable | Type | Token |
|----------|------|-------|
| Base Font | String | `typography.fontFamily.base.value` |
| Extra Small Text | Size | `typography.fontSize.xs.value` |
| Small Text | Size | `typography.fontSize.sm.value` |
| Base Text | Size | `typography.fontSize.base.value` |
| Large Text | Size | `typography.fontSize.lg.value` |
| Extra Large Text | Size | `typography.fontSize.xl.value` |
| Heading Text | Size | `typography.fontSize.2xl.value` |
| Regular Weight | Weight | `typography.fontWeight.regular.value` |
| Medium Weight | Weight | `typography.fontWeight.medium.value` |
| Bold Weight | Weight | `typography.fontWeight.bold.value` |

### Spacing Tokens

| Variable | Type | Token |
|----------|------|-------|
| XS | Spacing | `spacing.1.value` |
| Small | Spacing | `spacing.2.value` |
| Medium | Spacing | `spacing.4.value` |
| Large | Spacing | `spacing.6.value` |
| XL | Spacing | `spacing.8.value` |
| 2XL | Spacing | `spacing.16.value` |
| 3XL | Spacing | `spacing.20.value` |

### Border Radius Tokens

| Variable | Type | Token |
|----------|------|-------|
| Medium Rounded | Radius | `borderRadius.lg.value` |
| Large Rounded | Radius | `borderRadius.xl.value` |
| XL Rounded | Radius | `borderRadius.2xl.value` |
| 2XL Rounded | Radius | `borderRadius.3xl.value` |
| Circle/Full | Radius | `borderRadius.full.value` |

### Shadow Tokens

| Variable | Type | Token |
|----------|------|-------|
| Small Shadow | Shadow | `shadow.sm.value` |
| Large Shadow | Shadow | `shadow.lg.value` |

### Icon Size Tokens

| Variable | Type | Token |
|----------|------|-------|
| Small Icon | Size | `icon.size.sm.value` |
| Base Icon | Size | `icon.size.base.value` |
| Medium Icon | Size | `icon.size.md.value` |
| Large Icon | Size | `icon.size.lg.value` |
| Extra Large Icon | Size | `icon.size.xl.value` |

## Usage Examples

### React Component Example

```jsx
import { useTheme } from './ThemeProvider';

const Button = ({ children, variant = 'primary' }) => {
  const theme = useTheme();
  
  const styles = {
    padding: `${theme.spacing[2].value} ${theme.spacing[4].value}`,
    borderRadius: theme.borderRadius.xl.value,
    fontWeight: theme.typography.fontWeight.medium.value,
    backgroundColor: variant === 'primary' ? 
      theme.color.primary[500].value : 
      theme.color.gray[100].value,
    color: variant === 'primary' ? 
      theme.color.white.value : 
      theme.color.gray[700].value
  };
  
  return <button style={styles}>{children}</button>;
};
```

### Flutter Widget Example

```dart
Widget buildCard(BuildContext context, Map<String, dynamic> tokens) {
  return Container(
    padding: EdgeInsets.all(
      double.parse(tokens['spacing']['4']['value'].replaceAll('rem', '')) * 16
    ),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(
        double.parse(tokens['borderRadius']['2xl']['value'].replaceAll('rem', '')) * 16
      ),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.05),
          blurRadius: 2,
          offset: Offset(0, 1),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Card Title',
          style: TextStyle(
            fontSize: double.parse(tokens['typography']['fontSize']['lg']['value'].replaceAll('rem', '')) * 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        SizedBox(height: double.parse(tokens['spacing']['2']['value'].replaceAll('rem', '')) * 16),
        Text(
          'Card content with standardized design tokens',
          style: TextStyle(
            fontSize: double.parse(tokens['typography']['fontSize']['sm']['value'].replaceAll('rem', '')) * 16,
            color: Color(int.parse(tokens['color']['gray']['600']['value'].substring(1, 7), radix: 16) + 0xFF000000),
          ),
        ),
      ],
    ),
  );
}
```
