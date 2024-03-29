import { v5 as uuidV5, validate } from 'uuid';

const OID_NAMESPACE = '6ba7b812-9dad-11d1-80b4-00c04fd430c8';
const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

export const generateUuidV5 = (name: string) => uuidV5(name, OID_NAMESPACE);

export const isUuid = (text: string) => text && (validate(text) || uuidRegex.test(text));
