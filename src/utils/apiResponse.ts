class ApiResponse<T = undefined>{
    success: boolean;
    message: string;
    statusCode: number;
    data?: T;
    constructor(statusCode: number, message: string, data?:T){
        
        this.success = true;
        this.message = message;
        this.statusCode = statusCode;
        this.data = data;

    }
}


export { ApiResponse }