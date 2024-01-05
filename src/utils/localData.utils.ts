export const getLocalData = (name: string) => {
    return localStorage.getItem(name);
};

export const removeLocalData = (name: string) => {
    localStorage.removeItem(name);
};

export const setLocalData = (name: string, value: any) => {
    localStorage.setItem(name, value);
};
