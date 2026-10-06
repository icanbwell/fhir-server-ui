// Descope's SDK keeps its session (DS) and refresh (DSR) tokens, and the last
// authenticated user's login ID and display name (dls_last_user_*, PII), under these keys.
// The login page disables that persistence; clearing here is defense in depth.
// Kept free of imports from auth.utils so auth.utils can call it without a cycle.
const DESCOPE_STORAGE_KEYS = ['DS', 'DSR', 'dls_last_user_login_id', 'dls_last_user_display_name'];

export const clearDescopeStorage = (): void => {
    DESCOPE_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
};
