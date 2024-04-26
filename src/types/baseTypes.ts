export type TBaseResourceProps = {
    name?: String;
    resourceType?: String;
    id?: String;
    searchParameter?: String;
}

export type TUserDetails = {
    username: string;
    scope: string;
    isAdmin: boolean;
}

export type TFieldInfo = {
    label: string;
    name: string;
    sortField?: string;
    useExactMatch?: boolean;
    columnHeader?: string;
};

export type TResourceDefinition = {
    name: string;
    description: string;
    url: string;
  }
