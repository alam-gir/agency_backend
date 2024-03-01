export const isObjectId = (object_id: string) => {
    const ObjectIdRegex = /^[0-9a-fA-F]{24}$/;
    return ObjectIdRegex.test(object_id);
}