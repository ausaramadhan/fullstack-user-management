// types/index.ts
export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    createdAt: string;
}

export interface UserFormData {
    name: string;
    email: string;
    role: 'admin' | 'user';
    password?: string;
}