<?php
// resetPassword.php
session_start();
$token = $_GET['token'] ?? '';
if (empty($token)) {
    die("Invalid reset link.");
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reset Password - Bee Farming System</title>
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
        .reset-container {
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
        input[type="password"] {
            width: 100%;
            padding: 12px;
            margin: 15px 0;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
        button {
            background-color: #007bff;
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #0056b3;
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
<div class="reset-container">
    <h2>Reset Password</h2>
    <form id="resetForm">
        <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
        <input type="password" name="new_password" placeholder="New Password" required minlength="8">
        <input type="password" name="confirm_password" placeholder="Confirm Password" required minlength="8">
        <button type="submit">Reset Password</button>
    </form>
    <p class="message" id="resetMessage"></p>
    <p><a href="../login.php">Back to Login</a></p>
</div>

<script>
document.getElementById('resetForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);

    fetch('/beemonitor/backend.php?action=reset_password', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const messageElement = document.getElementById('resetMessage');
        messageElement.textContent = data.message;
        messageElement.style.color = data.success ? 'green' : 'red';
        if (data.success) {
            setTimeout(() => {
                window.location.href = "../login.php";
            }, 2000);
        }
    })
    .catch(() => {
        document.getElementById('resetMessage').textContent = "An error occurred. Please try again.";
    });
});
</script>
</body>
</html>