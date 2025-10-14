export interface ApiError {
    detail: string;
    instance: string;
    requestId: string;
    status: number;
    title: string;
    traceId: string;
    type: string;
}