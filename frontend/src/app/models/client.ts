import { Status } from "@enums/status";

export interface Client {
    _id?: string;
    code: string;
    name: string;
    operations: string[];
    payFreq: string[];
    status: Status;
}