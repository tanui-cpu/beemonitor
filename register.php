<?php
session_start();
require_once 'dbconnect.php';

$message = '';
$message_type = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $full_name = trim($_POST['full_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone_number = trim($_POST['phone_number'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    $role = 'beekeeper'; // Default role for public registration

    if (empty($full_name) || empty($email) || empty($password) || empty($confirm_password)) {
        $message = "All fields are required.";
        $message_type = "error";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $message = "Invalid email format.";
        $message_type = "error";
    } elseif ($password !== $confirm_password) {
        $message = "Passwords do not match.";
        $message_type = "error";
    } elseif (strlen($password) < 8) {
        $message = "Password must be at least 8 characters long.";
        $message_type = "error";
    } else {
        try {
            // Check if email already exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->rowCount() > 0) {
                $message = "Email already registered. Please use a different email.";
                $message_type = "error";
            } else {
                $hashed_password = password_hash($password, PASSWORD_DEFAULT);
                $is_approved = 1; // Auto-approve beekeepers upon registration

                $stmt = $pdo->prepare("INSERT INTO users (full_name, email, phone_number, password, role, is_approved) VALUES (?, ?, ?, ?, ?, ?)");
                if ($stmt->execute([$full_name, $email, $phone_number, $hashed_password, $role, $is_approved])) {
                    $message = "Registration successful! You can now log in.";
                    $message_type = "success";
                    // Optionally redirect to login page after successful registration
                    // header("Location: login.php?registration=success");
                    // exit();
                } else {
                    $message = "Registration failed. Please try again.";
                    $message_type = "error";
                }
            }
        } catch (PDOException $e) {
            error_log("Registration error: " . $e->getMessage());
            $message = "A database error occurred during registration. Please try again later.";
            $message_type = "error";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Bee Farming System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css"> <!-- Consolidated CSS -->
</head>
<body>

<nav class="navbar navbar-expand-lg navbar-warning bg-warning">
    <div class="container-fluid">
        <a class="navbar-brand fw-bold text-dark" href="#">🐝 Bee Monitoring</a>
        <div class="d-flex">
            <a href="login.php" class="btn btn-dark me-2">Login</a>
            <a href="register.php" class="btn btn-dark">Register</a>
        </div>
    </div>
</nav>

<div class="auth-container">
    <h2>Register</h2>
    <?php if ($message): ?>
        <div class="auth-message <?= $message_type ?>">
            <?= htmlspecialchars($message) ?>
        </div>
    <?php endif; ?>
    <form action="register.php" method="POST">
        <div class="mb-3">
            <input type="text" class="form-control" id="full_name" name="full_name" placeholder="Full Name" required value="<?= htmlspecialchars($_POST['full_name'] ?? '') ?>">
        </div>
        <div class="mb-3">
            <input type="email" class="form-control" id="email" name="email" placeholder="Email address" required value="<?= htmlspecialchars($_POST['email'] ?? '') ?>">
        </div>
        <div class="mb-3">
            <input type="tel" class="form-control" id="phone_number" name="phone_number" placeholder="Phone Number (Optional)" value="<?= htmlspecialchars($_POST['phone_number'] ?? '') ?>">
        </div>
        <div class="mb-3">
            <input type="password" class="form-control" id="password" name="password" placeholder="Password" required>
        </div>
        <div class="mb-3">
            <input type="password" class="form-control" id="confirm_password" name="confirm_password" placeholder="Confirm Password" required>
        </div>
        <button type="submit" class="btn btn-primary-custom btn-block">Register</button>
    </form>
    <p class="mt-3 text-muted">Already have an account? <a href="login.php">Login here</a></p>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="js/utils.js"></script>
</body>
</html>
