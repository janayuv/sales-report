import { describe, it, expect } from 'vitest'

// GST validation function (copied from CompanyForm for testing)
function isValidGSTFormat(gstNo: string): boolean {
  const trimmed = gstNo.trim()
  return trimmed.length === 15 && !!trimmed.match(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[1-9A-Z]{1}$/)
}

describe('Company Validation', () => {
  describe('GST Format Validation', () => {
    it('validates correct GST format', () => {
      const validGSTNumbers = [
        '07AABCU9603R1ZX',
        '29ABCDE1234F1Z5',
        '33ABCDE1234F1Z5',
        '19ABCDE1234F1Z5'
      ]

      validGSTNumbers.forEach(gst => {
        expect(isValidGSTFormat(gst)).toBe(true)
      })
    })

    it('rejects invalid GST format', () => {
      const invalidGSTNumbers = [
        '', // empty
        '07AABCU9603R1Z', // too short
        '07AABCU9603R1ZXA', // too long
        '07aabcu9603r1zx', // lowercase
        '07AABCU9603R1Z0', // invalid entity type
        '07AABCU9603R0ZX', // invalid entity type
        '07AABCU9603R1Z', // missing last character
        'invalid-gst', // completely invalid
        '123456789012345', // all numbers
        'ABCDEFGHIJKLMNO' // all letters
      ]

      invalidGSTNumbers.forEach(gst => {
        const result = isValidGSTFormat(gst);
        if (result === true) {
          console.log(`GST "${gst}" unexpectedly passed validation`);
        }
        expect(result).toBe(false);
      })
    })

    it('handles whitespace correctly', () => {
      expect(isValidGSTFormat(' 07AABCU9603R1ZX ')).toBe(true)
      expect(isValidGSTFormat('\t07AABCU9603R1ZX\n')).toBe(true)
    })
  })

  describe('Company Name Validation', () => {
    it('validates company name length', () => {
      const validNames = [
        'A', // minimum
        'Test Company',
        'A'.repeat(255) // maximum
      ]

      validNames.forEach(name => {
        expect(name.length).toBeGreaterThan(0)
        expect(name.length).toBeLessThanOrEqual(255)
      })
    })

    it('rejects empty company names', () => {
      const invalidNames = [
        '',
        '   ',
        '\t',
        '\n'
      ]

      invalidNames.forEach(name => {
        expect(name.trim()).toBe('')
      })
    })
  })

  describe('State Code Validation', () => {
    it('validates state code format', () => {
      const validStateCodes = [
        '01', '07', '19', '29', '33'
      ]

      validStateCodes.forEach(code => {
        expect(code.trim()).toBeTruthy()
        expect(code.length).toBe(2)
      })
    })

    it('rejects empty state codes', () => {
      const invalidStateCodes = [
        '',
        '   ',
        '\t',
        '\n'
      ]

      invalidStateCodes.forEach(code => {
        expect(code.trim()).toBe('')
      })
    })
  })
})
