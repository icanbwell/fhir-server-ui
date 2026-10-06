import { beforeEach, describe, expect, it } from 'vitest';
import { clearDescopeStorage } from './descopeStorage';

describe('clearDescopeStorage', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('removes the Descope session and refresh tokens from both storages', () => {
        localStorage.setItem('DS', 'a');
        localStorage.setItem('DSR', 'b');
        sessionStorage.setItem('DS', 'c');
        sessionStorage.setItem('DSR', 'd');
        clearDescopeStorage();
        expect(localStorage.getItem('DS')).toBeNull();
        expect(localStorage.getItem('DSR')).toBeNull();
        expect(sessionStorage.getItem('DS')).toBeNull();
        expect(sessionStorage.getItem('DSR')).toBeNull();
    });

    it('leaves unrelated keys alone', () => {
        localStorage.setItem('other', 'keep');
        clearDescopeStorage();
        expect(localStorage.getItem('other')).toBe('keep');
    });
});
