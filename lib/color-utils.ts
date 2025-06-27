import convert from 'color-convert';
import { colors } from './color-names';

// Function to calculate Euclidean distance between two RGB colors
function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;
  return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
}

/**
 * Finds the closest color from the color-names list to a given hex color.
 * @param hexColor The hex color string (e.g., "#RRGGBB").
 * @returns An object with the name, hex, and distance of the closest color, or null if an error occurs.
 */
export function findClosestColor(hexColor: string): { name: string; hex: string; distance: number } | null {
  if (!hexColor.startsWith('#')) {
    return null;
  }
  
  try {
    const inputRgb = convert.hex.rgb(hexColor);
    
    let closestColor: { name: string; hex: string; distance: number } | null = null;
    let minDistance = Infinity;

    for (const color of colors) {
      const colorRgb = convert.hex.rgb(color.hex);
      const distance = colorDistance(inputRgb, colorRgb);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = { ...color, distance };
      }
    }

    return closestColor;
  } catch (error) {
    console.error("Error finding closest color:", error);
    return null;
  }
}

export function getContrastingTextColor(hex: string): string {
    if (!hex) return '#000000';
    try {
        const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
        if (cleanHex.length !== 6 && cleanHex.length !== 3) return '#000000';
        const rgb = convert.hex.rgb(cleanHex);
        const yiq = ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#FFFFFF';
    } catch (e) {
        return '#000000';
    }
};
