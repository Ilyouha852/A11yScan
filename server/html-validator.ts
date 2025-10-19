import { z } from "zod";

export interface HTMLValidationMessage {
  type: 'error' | 'warning' | 'info';
  message: string;
  extract: string;
  firstLine: number;
  lastLine: number;
  firstColumn: number;
  lastColumn: number;
  hiliteStart: number;
  hiliteLength: number;
}

export interface HTMLValidationResult {
  errorCount: number;
  warningCount: number;
  messages: HTMLValidationMessage[];
  validationFailed: boolean;
  validationError?: string;
}

export async function validateHTML(html: string): Promise<HTMLValidationResult> {
  try {
    const response = await fetch('https://validator.w3.org/nu/?out=json', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'User-Agent': 'Accessibility-Checker/1.0',
      },
      body: html,
    });

    if (!response.ok) {
      throw new Error(`W3C Validator API returned status ${response.status}`);
    }

    const data = await response.json();
    
    let errorCount = 0;
    let warningCount = 0;
    const messages: HTMLValidationMessage[] = [];

    if (data.messages && Array.isArray(data.messages)) {
      for (const msg of data.messages) {
        if (msg.type === 'error') {
          errorCount++;
        } else if (msg.type === 'info' && msg.subType === 'warning') {
          warningCount++;
        }

        messages.push({
          type: msg.type === 'error' ? 'error' : (msg.subType === 'warning' ? 'warning' : 'info'),
          message: msg.message || '',
          extract: msg.extract || '',
          firstLine: msg.firstLine || 0,
          lastLine: msg.lastLine || 0,
          firstColumn: msg.firstColumn || 0,
          lastColumn: msg.lastColumn || 0,
          hiliteStart: msg.hiliteStart || 0,
          hiliteLength: msg.hiliteLength || 0,
        });
      }
    }

    return {
      errorCount,
      warningCount,
      messages,
      validationFailed: false,
    };
  } catch (error) {
    console.error('Error validating HTML:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      errorCount: 0,
      warningCount: 0,
      messages: [],
      validationFailed: true,
      validationError: errorMessage,
    };
  }
}
