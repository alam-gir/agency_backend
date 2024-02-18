export const emailVarificationTemplate = ( code : number) => {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Pixwaf</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
    
            .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
    
            h1 {
                color: #333333;
            }
    
            p {
                color: #666666;
            }
    
            .code {
                display: inline-block;
                padding: 10px 20px;
                background-color: #ffffff;
                text-decoration: none;
                border-radius: 5px;
            }
    
            .button:hover {
                background-color: #2980b9;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome to Pixwaf</h1>
            <p>Thank you for registered in Pixwaf! Your activation code :</p>
            
            <h2 class="code">${code}</h2>
    
            <p>If you didn't registered in our website, please ignore this email!</p>
    
        </div>
    </body>
    </html>`
}