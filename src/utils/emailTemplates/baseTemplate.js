export const base  = (content) =>`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Misha Brands Factory</title>
    <style>
      body {
        font-family: "Arial", sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
        font-size: 16px;
        color: #333333;
      }

      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.05);
        overflow: hidden;
      }

      .header {
        background-color: #007BFF;
        color: white;
        padding: 20px;
        text-align: center;
      }

      .header h1 {
        margin: 0;
        font-size: 28px;
      }

      .content {
        padding: 30px;
      }

      .button {
        display: inline-block;
        background-color: #28a745;
        color: #ffffff;
        text-decoration: none;
        padding: 12px 20px;
        border-radius: 4px;
        font-size: 16px;
        margin-top: 20px;
      }

      .footer {
        background-color: #f4f4f4;
        text-align: center;
        color: #888888;
        font-size: 14px;
        padding: 20px;
      }

      @media only screen and (max-width: 600px) {
        .container {
          margin: 10px;
        }

        .content {
          padding: 15px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Misha Brands Factory</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        &copy; Misha Brands Factory. All rights reserved.
      </div>
    </div>
  </body>
</html>`;
