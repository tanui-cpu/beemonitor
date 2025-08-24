<?php
session_start();
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Bee Farming Monitoring System</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
<link rel="stylesheet" href="css/style.css" /> 
</head>
<body class="index-page-bg"> 

<nav class="navbar navbar-expand-lg navbar-warning shadow-sm"> 
    <div class="container">
        <a class="navbar-brand" href="index.php">Bee Farming Monitoring</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item"><a class="nav-link" href="support.php">Support</a></li>
                <li class="nav-item"><a class="nav-link" href="faq.php">FAQ</a></li>
                <li class="nav-item"><a class="nav-link" href="about.php">About</a></li>
                <li class="nav-item"><a class="nav-link" href="login.php">Login</a></li>
                <li class="nav-item"><a class="nav-link" href="register.php">Register</a></li>
            </ul>
        </div>
    </div>
</nav>

<div class="cover-container">
    <h1>Welcome to Bee Farming Monitoring System</h1>
    <p class="lead">
        Empowering beekeepers with real-time hive monitoring, alerts, and productivity insights.
    </p>
    <div>
        <a href="login.php" class="btn btn-dark btn-lg me-3">Login</a>
        <a href="register.php" class="btn btn-warning btn-lg text-dark">Register</a>
    </div>
</div>

<footer class="footer-index"> <!-- Added class for specific footer style -->
    &copy; 2025 Bee Farming Monitoring System. All rights reserved.
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="js/utils.js"></script>
</body>
</html>


