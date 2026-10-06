// Descope's SDK keeps its session (DS) and refresh (DSR) tokens under these keys.
// Kept free of imports from auth.utils so auth.utils can call it without a cycle.
const DESCOPE_STORAGE_KEYS = ['DS', 'DSR'];

export const clearDescopeStorage = (): void => {
    DESCOPE_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
};
