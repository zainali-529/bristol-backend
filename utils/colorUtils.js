/**
 * Color utility functions for theme customization
 * Generates color variations with different opacity levels
 */

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color (e.g., #AE613A or AE613A)
 * @returns {object} RGB object with r, g, b values
 */
const hexToRgb = (hex) => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
};

/**
 * Convert RGB to hex
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} Hex color string
 */
const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

/**
 * Generate color variations with different opacity levels
 * @param {string} primaryColor - Primary color in hex format
 * @returns {object} Object with all color variations
 */
const generateColorVariations = (primaryColor) => {
  const rgb = hexToRgb(primaryColor);
  
  return {
    primary: primaryColor,
    primary100: primaryColor,
    primary80: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`,
    primary60: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`,
    primary40: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`,
    primary30: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
    primary20: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
    primary10: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
    primary5: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`,
  };
};

/**
 * Generate complementary colors
 * @param {string} primaryColor - Primary color in hex format
 * @returns {object} Object with complementary colors
 */
const generateComplementaryColors = (primaryColor) => {
  const rgb = hexToRgb(primaryColor);
  
  // Generate lighter and darker variations
  const lighten = (percent) => {
    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * percent));
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * percent));
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * percent));
    return rgbToHex(r, g, b);
  };
  
  const darken = (percent) => {
    const r = Math.max(0, Math.round(rgb.r * (1 - percent)));
    const g = Math.max(0, Math.round(rgb.g * (1 - percent)));
    const b = Math.max(0, Math.round(rgb.b * (1 - percent)));
    return rgbToHex(r, g, b);
  };
  
  return {
    light: lighten(0.2),
    lighter: lighten(0.4),
    dark: darken(0.2),
    darker: darken(0.4),
  };
};

/**
 * Validate hex color format
 * @param {string} color - Color string to validate
 * @returns {boolean} True if valid hex color
 */
const isValidHexColor = (color) => {
  const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
  return hexRegex.test(color);
};

/**
 * Normalize hex color (ensure it has # prefix)
 * @param {string} color - Color string
 * @returns {string} Normalized hex color
 */
const normalizeHexColor = (color) => {
  if (!color) return null;
  return color.startsWith('#') ? color : `#${color}`;
};

module.exports = {
  hexToRgb,
  rgbToHex,
  generateColorVariations,
  generateComplementaryColors,
  isValidHexColor,
  normalizeHexColor,
};


