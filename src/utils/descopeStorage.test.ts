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

    it('removes the stored last-authenticated-user keys from both storages', () => {
        const keys = ['dls_last_user_login_id', 'dls_last_user_display_name'];
        keys.forEach((key) => {
            localStorage.setItem(key, 'user@example.com');
            sessionStorage.setItem(key, 'user@example.com');
        });
        clearDescopeStorage();
        keys.forEach((key) => {
            expect(localStorage.getItem(key)).toBeNull();
            expect(sessionStorage.getItem(key)).toBeNull();
        });
    });

    it('removes the last submitted login ID (the email typed into the flow) from both storages', () => {
        localStorage.setItem('dls_last_submitted_login_id', 'user@example.com');
        sessionStorage.setItem('dls_last_submitted_login_id', 'user@example.com');
        clearDescopeStorage();
        expect(localStorage.getItem('dls_last_submitted_login_id')).toBeNull();
        expect(sessionStorage.getItem('dls_last_submitted_login_id')).toBeNull();
    });

    it('leaves unrelated keys alone', () => {
        localStorage.setItem('other', 'keep');
        clearDescopeStorage();
        expect(localStorage.getItem('other')).toBe('keep');
    });
});
