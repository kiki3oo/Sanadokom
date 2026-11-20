/**
 * Lightweight, client-safe text formatter to remove raw LaTeX math expressions
 * and replace them with readable, clean e-commerce formulas.
 */
export function cleanLatexAndFormat(text: string): string {
  if (!text) return '';
  return text
    // Replace \[ \text{A} = \text{B} - \text{C} \] or formulas
    .replace(/\\\[\s*\\text\{([^}]+)\}\s*=\s*\\text\{([^}]+)\}\s*([+\-*/])\s*\\text\{([^}]+)\}\s*\\\]/g, '$1 = $2 $3 $4')
    .replace(/\\\[\s*\\text\{([^}]+)\}\s*=\s*([^\]]+?)\s*\\\]/g, '$1 = $2')
    .replace(/\\\[\s*([^\]]+?)\s*\\\]/g, '$1')
    .replace(/\\\(\s*([^)]+?)\s*\\\)/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\approx/g, '≈')
    .replace(/\\%/g, '%')
    .replace(/\\_/g, '_')
    .replace(/\\([#$])/g, '$1');
}
