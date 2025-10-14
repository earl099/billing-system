export interface Client {
    _id?: string;
    code: string;
    name: string;
    operations: [string];
}