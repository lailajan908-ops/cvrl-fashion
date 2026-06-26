export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      accent: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
    };
  };
  fonts: {
    heading: {
      family: string;
      weight: string;
      size: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
      };
    };
    body: {
      family: string;
      weight: string;
      size: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
      };
    };
    mono: {
      family: string;
      weight: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

export const designTokens: DesignTokens = {
  colors: {
    primary: '#FFD700',
    secondary: '#B8860B',
    accent: '#FFF8DC',
    background: '#0A0A0A',
    surface: '#1A1A1A',
    border: '#333333',
    text: {
      primary: '#FFFFFF',
      secondary: '#CCCCCC',
      accent: '#FFD700',
    },
    status: {
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
    },
  },
  fonts: {
    heading: {
      family: '\'Playfair Display\', serif',
      weight: '700',
      size: {
        xs: '1.2rem',
        sm: '1.5rem',
        md: '1.8rem',
        lg: '2.5rem',
        xl: '3.5rem',
        '2xl': '4.5rem',
        '3xl': '6rem',
        '4xl': '8rem',
      },
    },
    body: {
      family: '\'Inter\', sans-serif',
      weight: '400',
      size: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
      },
    },
    mono: {
      family: '\'JetBrains Mono\', monospace',
      weight: '500',
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
    '3xl': '6rem',
    '4xl': '8rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.5)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.5)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.5)',
  },
};

export function getDesignTokens() {
  return designTokens;
}

export function applyDarkGoldTheme() {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  Object.entries(designTokens.colors).forEach(([category, colors]) => {
    if (typeof colors === 'object') {
      Object.entries(colors).forEach(([key, value]) => {
        if (typeof value === 'string') {
          root.style.setProperty(`--color-${category}-${key}`, value);
        } else {
          Object.entries(value).forEach(([subKey, subValue]) => {
            root.style.setProperty(`--color-${category}-${key}-${subKey}`, subValue as string);
          });
        }
      });
    }
  });

  Object.entries(designTokens.fonts).forEach(([fontCategory, fontConfig]) => {
    if (typeof fontConfig === 'object') {
      if (fontConfig.family) {
        root.style.setProperty(`--font-${fontCategory}-family`, fontConfig.family);
      }
      if (fontConfig.weight) {
        root.style.setProperty(`--font-${fontCategory}-weight`, fontConfig.weight);
      }
      if ('size' in fontConfig && fontConfig.size) {
        Object.entries(fontConfig.size).forEach(([size, sizeValue]) => {
          root.style.setProperty(`--font-${fontCategory}-size-${size}`, sizeValue as string);
        });
      }
    }
  });

  Object.entries(designTokens.spacing).forEach(([space, spaceValue]) => {
    root.style.setProperty(`--spacing-${space}`, spaceValue);
  });

  Object.entries(designTokens.borderRadius).forEach(([radius, radiusValue]) => {
    root.style.setProperty(`--border-radius-${radius}`, radiusValue);
  });

  Object.entries(designTokens.shadows).forEach(([shadow, shadowValue]) => {
    root.style.setProperty(`--shadow-${shadow}`, shadowValue);
  });
}

export const css = `
:root {
  --color-primary: ${designTokens.colors.primary};
  --color-secondary: ${designTokens.colors.secondary};
  --color-accent: ${designTokens.colors.accent};
  --color-background: ${designTokens.colors.background};
  --color-surface: ${designTokens.colors.surface};
  --color-border: ${designTokens.colors.border};
  --color-text-primary: ${designTokens.colors.text.primary};
  --color-text-secondary: ${designTokens.colors.text.secondary};
  --color-text-accent: ${designTokens.colors.text.accent};
  --color-status-success: ${designTokens.colors.status.success};
  --color-status-warning: ${designTokens.colors.status.warning};
  --color-status-error: ${designTokens.colors.status.error};

  --font-heading-family: ${designTokens.fonts.heading.family};
  --font-heading-weight: ${designTokens.fonts.heading.weight};
  --font-body-family: ${designTokens.fonts.body.family};
  --font-body-weight: ${designTokens.fonts.body.weight};
  --font-mono-family: ${designTokens.fonts.mono.family};
  --font-mono-weight: ${designTokens.fonts.mono.weight};

  --spacing-xs: ${designTokens.spacing.xs};
  --spacing-sm: ${designTokens.spacing.sm};
  --spacing-md: ${designTokens.spacing.md};
  --spacing-lg: ${designTokens.spacing.lg};
  --spacing-xl: ${designTokens.spacing.xl};
  --spacing-2xl: ${designTokens.spacing['2xl']};
  --spacing-3xl: ${designTokens.spacing['3xl']};
  --spacing-4xl: ${designTokens.spacing['4xl']};

  --border-radius-sm: ${designTokens.borderRadius.sm};
  --border-radius-md: ${designTokens.borderRadius.md};
  --border-radius-lg: ${designTokens.borderRadius.lg};
  --border-radius-xl: ${designTokens.borderRadius.xl};

  --shadow-sm: ${designTokens.shadows.sm};
  --shadow-md: ${designTokens.shadows.md};
  --shadow-lg: ${designTokens.shadows.lg};
  --shadow-xl: ${designTokens.shadows.xl};
  --shadow-2xl: ${designTokens.shadows['2xl']};
}

theme-dark-gold {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-body-family);
  font-weight: var(--font-body-weight);
  line-height: 1.6;
}

.theme-dark-gold h1,
.theme-dark-gold h2,
.theme-dark-gold h3,
.theme-dark-gold h4,
.theme-dark-gold h5,
.theme-dark-gold h6 {
  font-family: var(--font-heading-family);
  font-weight: var(--font-heading-weight);
  color: var(--color-text-accent);
}

.theme-dark-gold .sku-text {
  font-family: var(--font-mono-family);
  font-weight: var(--font-mono-weight);
  color: var(--color-primary);
}

.theme-dark-gold .card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.theme-dark-gold .card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.theme-dark-gold .btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: var(--color-background);
  font-weight: 600;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
}

.theme-dark-gold .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
}

.theme-dark-gold .input-field {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--color-text-primary);
  font-size: var(--font-body-size-md);
  transition: all 0.3s ease;
}

.theme-dark-gold .input-field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
}

.theme-dark-gold .upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-2xl);
  text-align: center;
  transition: all 0.3s ease;
  background-color: var(--color-surface);
  cursor: pointer;
}

.theme-dark-gold .upload-zone:hover {
  border-color: var(--color-primary);
  background-color: rgba(255, 215, 0, 0.05);
}

.theme-dark-gold .progress-bar {
  background-color: var(--color-surface);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.theme-dark-gold .progress-fill {
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  transition: width 0.3s ease;
}

.theme-dark-gold .status-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-body-size-xs);
  font-weight: 500;
}

.theme-dark-gold .status-success {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--color-status-success);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.theme-dark-gold .status-warning {
  background-color: rgba(255, 152, 0, 0.1);
  color: var(--color-status-warning);
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.theme-dark-gold .status-error {
  background-color: rgba(244, 67, 54, 0.1);
  color: var(--color-status-error);
  border: 1px solid rgba(244, 67, 54, 0.3);
}
`;
