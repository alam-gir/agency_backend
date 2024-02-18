class ApiError<T = undefined> extends Error  {
    public statusCode : number;
    public errors?: T[];
    
    constructor( statusCode : number, message: string, errors?: T[]){
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        
        Object.defineProperty(this, "message",{
            value: message,
            enumerable: true,
            writable: true,
            configurable: true
        })
    }

    
}

export {ApiError}