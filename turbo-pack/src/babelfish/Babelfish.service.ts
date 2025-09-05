/**
 * Babelfish v1: Universal translator between number, color, glyph, and tone
 * This is intentionally simple & extensible for future layered compression & temporary code points.
 */

export interface BabelfishToken {
  number?: number;
  color?: string;     // hex or HSL
  glyph?: string;     // arbitrary symbol or unicode
  tone?: { freq: number; env: string; duration?: number };
  text?: string;      // natural language description
  meta?: Record<string, any>;
}

export interface TranslationOptions {
  precision?: 'low' | 'medium' | 'high';
  style?: 'mathematical' | 'poetic' | 'technical' | 'mystical';
  compression?: boolean;
}

/**
 * Babelfish - Universal translation service
 */
export class Babelfish {
  private glyphTable: Record<number, string> = {};
  private reverseGlyphTable: Record<string, number> = {};

  constructor() {
    this.initializeGlyphTable();
  }

  /**
   * Initialize the glyph translation table
   */
  private initializeGlyphTable() {
    // Braille patterns for numbers 0-255
    const brailleBase = 0x2800;
    for (let i = 0; i <= 255; i++) {
      const glyph = String.fromCharCode(brailleBase + i);
      this.glyphTable[i] = glyph;
      this.reverseGlyphTable[glyph] = i;
    }

    // Mathematical symbols for common numbers
    const mathSymbols: Record<number, string> = {
      0: '∅',
      1: '𝟙',
      2: '∿',
      3: '𝜙',
      5: '★',
      7: '♦',
      11: '◊',
      13: '✦',
      17: '※',
      42: '⧨'
    };

    Object.entries(mathSymbols).forEach(([num, glyph]) => {
      const n = parseInt(num);
      this.glyphTable[n] = glyph;
      this.reverseGlyphTable[glyph] = n;
    });
  }

  /**
   * Convert number to color using golden angle mapping
   */
  numberToColor(n: number, options: TranslationOptions = {}): string {
    const { precision = 'medium' } = options;
    
    // Use golden angle (137.5°) for aesthetic distribution
    const hue = (n * 137.5) % 360;
    
    // Adjust saturation and lightness based on number properties
    const isPrime = this.isPrime(n);
    const isPalindrome = this.isPalindrome(n);
    
    let saturation = 70;
    let lightness = 70;
    
    if (isPrime) saturation += 10;
    if (isPalindrome) lightness += 10;
    
    // Precision affects color space
    switch (precision) {
      case 'low':
        return `hsl(${Math.round(hue / 30) * 30}, ${saturation}%, ${lightness}%)`;
      case 'high':
        return `hsl(${hue.toFixed(2)}, ${saturation.toFixed(1)}%, ${lightness.toFixed(1)}%)`;
      default:
        return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
    }
  }

  /**
   * Convert color to approximate number
   */
  colorToApproxNumber(color: string): number | undefined {
    const hslMatch = color.match(/hsl\(\s*(-?\d*\.?\d+)/i);
    if (!hslMatch) return undefined;
    
    const hue = parseFloat(hslMatch[1]);
    // Reverse golden angle mapping
    return Math.round(hue / 137.5);
  }

  /**
   * Convert number to glyph
   */
  numberToGlyph(n: number, options: TranslationOptions = {}): string {
    const { style = 'mathematical' } = options;
    
    // Handle negative numbers
    if (n < 0) {
      return '⊖' + this.numberToGlyph(Math.abs(n), options);
    }
    
    // Use direct mapping for small numbers
    if (n < 256 && this.glyphTable[n]) {
      return this.glyphTable[n];
    }
    
    // For larger numbers, use positional encoding
    if (style === 'poetic') {
      return this.numberToPoeticalGlyph(n);
    } else if (style === 'mystical') {
      return this.numberToMysticalGlyph(n);
    }
    
    // Default mathematical style
    return this.numberToMathematicalGlyph(n);
  }

  /**
   * Convert glyph back to number
   */
  glyphToNumber(glyph: string): number | undefined {
    // Handle negative prefix
    if (glyph.startsWith('⊖')) {
      const positive = this.glyphToNumber(glyph.slice(1));
      return positive !== undefined ? -positive : undefined;
    }
    
    // Direct lookup
    if (this.reverseGlyphTable[glyph] !== undefined) {
      return this.reverseGlyphTable[glyph];
    }
    
    // Try to decode positional encoding
    return this.decodeMathematicalGlyph(glyph);
  }

  /**
   * Convert number to tone parameters
   */
  numberToTone(n: number, _options: TranslationOptions = {}): { freq: number; env: string; duration?: number } {
    // Map number to musical frequencies using harmonic series
    const baseFreq = 220; // A3
    const octave = Math.floor(Math.log2(Math.abs(n) + 1));
    const noteInOctave = (Math.abs(n) % 12);
    
    // Equal temperament calculation
    const freq = baseFreq * Math.pow(2, octave + noteInOctave / 12);
    
    // Envelope based on number properties
    let env = 'sine';
    let duration = 0.5;
    
    if (this.isPrime(n)) {
      env = 'sharp';
      duration = 0.3;
    } else if (this.isPalindrome(n)) {
      env = 'long';
      duration = 1.0;
    } else if (n % 2 === 0) {
      env = 'soft';
      duration = 0.7;
    }
    
    return { freq, env, duration };
  }

  /**
   * Convert number to natural language description
   */
  numberToText(n: number, options: TranslationOptions = {}): string {
    const { style = 'technical' } = options;
    
    const properties = [];
    
    if (this.isPrime(n)) properties.push('prime');
    if (this.isPalindrome(n)) properties.push('palindromic');
    if (n % 2 === 0) properties.push('even');
    else properties.push('odd');
    
    const color = this.numberToColor(n, options);
    const colorName = this.colorToName(color);
    
    switch (style) {
      case 'poetic':
        return `The ${properties.join(', ')} essence of ${n}, shimmering in ${colorName}`;
      case 'mystical':
        return `${n} vibrates with ${properties.join(' and ')} energy, manifesting as ${colorName} light`;
      case 'mathematical':
        return `${n}: ${properties.join(', ')} number with chromatic value ${color}`;
      default:
        return `Number ${n} (${properties.join(', ')}) maps to ${color}`;
    }
  }

  /**
   * Universal translate function - accepts any input type and converts to specified targets
   */
  translate(
    input: Partial<BabelfishToken>, 
    targets: ('number' | 'color' | 'glyph' | 'tone' | 'text')[],
    options: TranslationOptions = {}
  ): BabelfishToken {
    // Derive the base number as our hub
    let baseNumber: number | undefined = input.number;
    
    if (baseNumber === undefined && input.color) {
      baseNumber = this.colorToApproxNumber(input.color);
    }
    
    if (baseNumber === undefined && input.glyph) {
      baseNumber = this.glyphToNumber(input.glyph);
    }
    
    if (baseNumber === undefined && input.text) {
      baseNumber = this.textToNumber(input.text);
    }
    
    // Fallback to a seeded random number
    if (baseNumber === undefined) {
      baseNumber = Math.floor(Math.random() * 256);
    }
    
    const result: BabelfishToken = { ...input, number: baseNumber };
    
    // Generate requested outputs
    if (targets.includes('color')) {
      result.color = this.numberToColor(baseNumber, options);
    }
    
    if (targets.includes('glyph')) {
      result.glyph = this.numberToGlyph(baseNumber, options);
    }
    
    if (targets.includes('tone')) {
      result.tone = this.numberToTone(baseNumber, options);
    }
    
    if (targets.includes('text')) {
      result.text = this.numberToText(baseNumber, options);
    }
    
    return result;
  }

  // Helper methods
  private isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  private isPalindrome(n: number): boolean {
    const str = Math.abs(n).toString();
    return str === str.split('').reverse().join('');
  }

  private colorToName(color: string): string {
    const hslMatch = color.match(/hsl\(\s*(-?\d*\.?\d+)/i);
    if (!hslMatch) return 'unknown';
    
    const hue = parseFloat(hslMatch[1]);
    
    if (hue < 30) return 'red';
    if (hue < 60) return 'orange';
    if (hue < 120) return 'yellow';
    if (hue < 180) return 'green';
    if (hue < 240) return 'cyan';
    if (hue < 300) return 'blue';
    if (hue < 330) return 'magenta';
    return 'red';
  }

  private textToNumber(text: string): number {
    // Simple hash function to convert text to number
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 1000; // Keep it manageable
  }

  private numberToPoeticalGlyph(n: number): string {
    const poeticSymbols = ['◦', '◉', '◈', '◇', '◆', '○', '●', '△', '▲', '▽'];
    const base = poeticSymbols.length;
    
    if (n === 0) return poeticSymbols[0];
    
    let result = '';
    let remaining = Math.abs(n);
    
    while (remaining > 0) {
      result = poeticSymbols[remaining % base] + result;
      remaining = Math.floor(remaining / base);
    }
    
    return result;
  }

  private numberToMysticalGlyph(n: number): string {
    const mysticalSymbols = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];
    return mysticalSymbols[Math.abs(n) % mysticalSymbols.length];
  }

  private numberToMathematicalGlyph(n: number): string {
    // Use base-16 with mathematical symbols
    const symbols = ['𝟘', '𝟙', '𝟚', '𝟛', '𝟜', '𝟝', '𝟞', '𝟟', '𝟠', '𝟡', '𝔸', '𝔹', '𝒞', '𝒟', '𝔼', '𝔽'];
    
    if (n === 0) return symbols[0];
    
    let result = '';
    let remaining = Math.abs(n);
    
    while (remaining > 0) {
      result = symbols[remaining % 16] + result;
      remaining = Math.floor(remaining / 16);
    }
    
    return result;
  }

  private decodeMathematicalGlyph(glyph: string): number | undefined {
    const symbols = ['𝟘', '𝟙', '𝟚', '𝟛', '𝟜', '𝟝', '𝟞', '𝟟', '𝟠', '𝟡', '𝔸', '𝔹', '𝒞', '𝒟', '𝔼', '𝔽'];
    
    let result = 0;
    for (let i = 0; i < glyph.length; i++) {
      const symbolIndex = symbols.indexOf(glyph[i]);
      if (symbolIndex === -1) return undefined;
      
      result = result * 16 + symbolIndex;
    }
    
    return result;
  }
}

// Global Babelfish instance
export const BabelfishService = new Babelfish();