import { Roles } from "../enums/roles";


export interface User {
    _id?: string;
    username: string;
    email: string;
    password: string;
    role: Roles;
    handledClients: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
