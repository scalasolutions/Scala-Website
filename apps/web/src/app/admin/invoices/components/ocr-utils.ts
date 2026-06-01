/**
 * ocr-utils.ts
 * ── Secure Local Tesseract OCR Engine (Client-side, 100% private, zero API keys) ──
 */

export const loadTesseract = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Tesseract can only be loaded in the browser.'));
      return;
    }
    if ((window as any).Tesseract) {
      resolve((window as any).Tesseract);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/tesseract.js@5.0.5/dist/tesseract.min.js';
    script.onload = () => resolve((window as any).Tesseract);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

export const parseIDRAmountString = (str: string): number | null => {
  // Remove trailing dot/comma or spaces
  let cleanStr = str.replace(/[.,]$/, '').trim();
  
  // Split by dots and commas to analyze the decimal / thousands structure
  const parts = cleanStr.split(/[.,]/);
  
  // If it ends with .00 or ,00 (cents), remove it
  if (parts.length > 1 && parts[parts.length - 1] === '00') {
    cleanStr = parts.slice(0, -1).join('');
  } else if (parts.length > 1 && parts[parts.length - 1].length === 2) {
    // If the last part has length 2 (e.g. .50 or ,00 cents), strip it as cents
    cleanStr = parts.slice(0, -1).join('');
  } else {
    // Otherwise, it's just thousands separators, strip all non-digits
    cleanStr = cleanStr.replace(/[^0-9]/g, '');
  }
  
  const val = parseInt(cleanStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(val) ? null : val;
};

export const performActualOCR = async (dataUrl: string): Promise<number | null> => {
  try {
    const Tesseract = await loadTesseract();
    const result = await Tesseract.recognize(dataUrl, 'eng');
    const text = result?.data?.text || '';
    console.log("OCR Local Extracted Text:\n", text);

    // 1. Split text into lines to look for contextual keywords
    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const amountKeywords = [
      'transfer amount',
      'amount paid',
      'jumlah transfer',
      'nominal',
      'total',
      'jumlah',
      'idr',
      'rp'
    ];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      // If this line contains an amount indicator keyword
      if (amountKeywords.some(keyword => lowerLine.includes(keyword))) {
        // Look for any number groups in the line (e.g. 2,750,000.00 or 161.107)
        const numbers = line.match(/\d[\d.,]*/g);
        if (numbers) {
          for (const numStr of numbers) {
            const val = parseIDRAmountString(numStr);
            if (val && val >= 10000 && val <= 1000000000) {
              console.log(`OCR: Found matching amount '${numStr}' (parsed: ${val}) via line keyword context.`);
              return val;
            }
          }
        }
      }
    }

    // 2. Look for strong IDR pattern matches (e.g. 2,750,000 or 161.107) anywhere in the text
    const idrPattern = /\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?\b/g;
    const idrMatches = text.match(idrPattern);
    if (idrMatches) {
      for (const match of idrMatches) {
        const val = parseIDRAmountString(match);
        if (val && val >= 10000 && val <= 1000000000) {
          console.log(`OCR: Found matching amount '${match}' (parsed: ${val}) via IDR pattern matching.`);
          return val;
        }
      }
    }

    // 3. Fallback to scanning all numeric groups for the first plausible amount (between 10k and 1B IDR)
    const digitGroups = text.match(/\d+[\d.,]*/g);
    if (digitGroups) {
      let bestCandidate = null;
      for (const group of digitGroups) {
        const val = parseIDRAmountString(group);
        if (val && val >= 10000 && val <= 1000000000) {
          const strippedLength = val.toString().length;
          // Plausible amount length check
          if (strippedLength >= 5 && strippedLength <= 9) {
            if (!bestCandidate || val > bestCandidate) {
              bestCandidate = val;
            }
          }
        }
      }
      if (bestCandidate !== null) {
        console.log(`OCR: Found fallback amount (parsed: ${bestCandidate}).`);
        return bestCandidate;
      }
    }
    return null;
  } catch (e) {
    console.error("Local client-side OCR failed: ", e);
    return null;
  }
};

export const extractAmountFromFilename = (filename: string, fallbackTotal: number): number => {
  // If the filename contains typical macOS/Windows screenshot markers, ignore numbers inside
  const isScreenshot = /screen\s*shot|screenshot/i.test(filename) || 
                       /\d{2}\.\d{2}\.\d{2}/.test(filename) || 
                       /\d{4}-\d{2}-\d{2}/.test(filename);
                       
  if (!isScreenshot) {
    // 1. Check for 'k' notation, e.g. 150k -> 150000
    const kMatch = filename.match(/(\d+)\s*k\b/i);
    if (kMatch) {
      const val = parseInt(kMatch[1], 10) * 1000;
      if (val >= 10000 && val <= 1000000000) {
        console.log(`OCR Fallback: Matched 'k' format in filename '${filename}': ${val}`);
        return val;
      }
    }

    // 2. Check for numeric sequence containing thousands separators
    const numMatch = filename.match(/\b\d{1,3}(?:[.,]\d{3})+\b/);
    if (numMatch) {
      const val = parseIDRAmountString(numMatch[0]);
      if (val && val >= 10000 && val <= 1000000000) {
        console.log(`OCR Fallback: Matched formatted number in filename '${filename}': ${val}`);
        return val;
      }
    }

    // 3. Check for any digit sequence >= 5 chars
    const digitMatch = filename.match(/\b\d{5,9}\b/);
    if (digitMatch) {
      const val = parseInt(digitMatch[0], 10);
      if (val >= 10000 && val <= 1000000000) {
        console.log(`OCR Fallback: Matched raw digit group in filename '${filename}': ${val}`);
        return val;
      }
    }
  }
  
  // 3. Milestone standard fallback (50% Down Payment or 5M default)
  return fallbackTotal ? Math.round(fallbackTotal / 2) : 5000000;
};
