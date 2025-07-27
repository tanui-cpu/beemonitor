<?php
session_start();
require_once 'dbconnect.php';

$message = '';
$message_type = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (empty($email) || empty($password)) {
        $message = "Email and password are required.";
        $message_type = "error";
    } else {
        try {
            $stmt = $pdo->prepare("SELECT id, password, role, full_name, is_approved FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['password'])) {
                if ($user['is_approved'] == 1) {
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['role'] = $user['role'];
                    $_SESSION['email'] = $email;
                    $_SESSION['full_name'] = $user['full_name'];

                    // Redirect based on role
                    switch ($user['role']) {
                        case 'beekeeper':
                            header("Location: beekeeper.php");
                            break;
                        case 'officer':
                            header("Location: officer.php");
                            break;
                        case 'admin':
                            header("Location: admin.php");
                            break;
                        default:
                            // Fallback for undefined roles
                            $message = "Unknown user role. Please contact support.";
                            $message_type = "error";
                            session_unset();
                            session_destroy();
                            break;
                    }
                    exit();
                } else {
                    $message = "Your account is awaiting administrator approval.";
                    $message_type = "error";
                }
            } else {
                $message = "Invalid email or password.";
                $message_type = "error";
            }
        } catch (PDOException $e) {
            error_log("Login error: " . $e->getMessage());
            $message = "A database error occurred. Please try again later.";
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
    <title>Login - Bee Farming System</title>
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
    <h2>Sign In</h2>
    <?php if ($message): ?>
        <div class="auth-message <?= $message_type ?>">
            <?= htmlspecialchars($message) ?>
        </div>
    <?php endif; ?>
    <form action="login.php" method="POST">
        <div class="mb-3">
            <input type="email" class="form-control" id="email" name="email" placeholder="Email address" required>
        </div>
        <div class="mb-3">
            <input type="password" class="form-control" id="password" name="password" placeholder="Password" required>
        </div>
        <button type="submit" class="btn btn-primary-custom btn-block">Login</button>
    </form>
    <p class="mt-3 text-muted">Don't have an account? <a href="register.php">Register here</a></p>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="js/utils.js"></script>
</body>
</html>
