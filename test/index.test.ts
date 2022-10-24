import { describe, it, expect } from 'vitest';
import { currentYear } from '../src';

describe('Current year', () => {
    it('should return the current year', () => {
        expect(currentYear).to.equal(new Date().getFullYear());
    });
});
