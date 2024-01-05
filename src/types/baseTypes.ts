export type TBaseResourceProps = {
    name?: String;
    resourceType?: String;
    id?: String;
    searchParameter?: String;
}

export type TUserDetails = {
    username?: string;
    scope?: string;
    isAdmin?: boolean;
}

export type TIndexConfig = {
    indexConfig: {
        keys: any;
        options: any;
    };
    missing?: boolean;
    extra?: boolean;
}

export type TIndexes = {
    collectionName: string;
    indexes: TIndexConfig[];
}

export type TIndexTableEntry = {
    name: string;
    keys: string;
    options: string;
    missing?: string;
    extra?: string;
}
