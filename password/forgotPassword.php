<?php
// forgotPassword.php
session_start();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Forgot Password - Bee Farming System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .forgot-container {
            background: #fff;
            padding: 30px 40px;
            border-radius: 10px;
            box-shadow: 0 0 15px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
        }
        h2 {
            color: #333;
        }
        input[type="email"] {
            width: 100%;
            padding: 12px;
            margin: 15px 0;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
        button {
            background-color: #28a745;
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #218838;
        }
        p.message {
            margin-top: 15px;
            font-size: 14px;
        }
        a {
            color: #007bff;
            text-decoration: none;
        }
    </style>
</head>
<body>
<div class="forgot-container">
    <h2>Forgot Password</h2>
    <form id="forgotForm">
        <input type="email" name="email" placeholder="Enter your registered email" required>
        <button type="submit">Send Reset Link</button>
    </form>
    <p class="message" id="forgotMessage"></p>
    <p><a href="../login.php">Back to Login</a></p>
</div>

<script>
document.getElementById('forgotForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const urlSearchParams = new URLSearchParams(formData);
    const body = urlSearchParams.toString();

    fetch('/beemonitor/backend.php?action=request_password_reset', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
    })
    .then(response => response.json())
    .then(data => {
        const messageElement = document.getElementById('forgotMessage');
        messageElement.textContent = data.message;
        messageElement.style.color = data.success ? 'green' : 'red';
    })
    .catch(() => {
        document.getElementById('forgotMessage').textContent = "An error occurred. Please try again.";
    });
});
</script>
</body>
</html>