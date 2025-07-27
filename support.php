<?php
session_start();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Support - Bee Farming Monitoring System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
    <link rel="stylesheet" href="css/style.css" /> <!-- Link to consolidated CSS -->
</head>
<body class="support-page-bg"> <!-- Added class for specific background -->

<!-- Navbar -->
<nav class="navbar navbar-expand-lg navbar-warning shadow-sm"> <!-- Using navbar-warning for consistency -->
    <div class="container">
        <a class="navbar-brand" href="index.php">Bee Farming Monitoring</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item"><a class="nav-link" href="index.php">Home</a></li>
                <li class="nav-item"><a class="nav-link active" aria-current="page" href="support.php">Support</a></li>
                <li class="nav-item"><a class="nav-link" href="faq.php">FAQ</a></li>
                <li class="nav-item"><a class="nav-link" href="about.php">About</a></li>
                <li class="nav-item"><a class="nav-link" href="login.php">Login</a></li>
                <li class="nav-item"><a class="nav-link" href="register.php">Register</a></li>
            </ul>
        </div>
    </div>
</nav>

<!-- Support Content -->
<div class="container">
    <div class="section-header">
        <h1>Need Help?</h1>
        <p class="lead">We're here to assist you. Reach out with your questions or concerns.</p>
    </div>

    <div class="row mb-4">
        <!-- Contact Info -->
        <div class="col-md-6">
            <h4>Contact Us</h4>
            <p><strong>Email:</strong> support@beefarmingmonitor.com</p>
            <p><strong>Phone:</strong> +254 712 345678</p>
            <p><strong>Working Hours:</strong> Mon - Fri, 9:00 AM - 5:00 PM</p>
        </div>

        <!-- Support Form -->
        <div class="col-md-6">
            <h4>Send Us a Message</h4>
            <form action="mailto:support@beefarmingmonitor.com" method="post" enctype="text/plain">
                <div class="mb-3">
                    <label for="name" class="form-label">Your Name</label>
                    <input type="text" class="form-control" id="name" name="name" required />
                </div>
                <div class="mb-3">
                    <label for="email" class="form-label">Your Email</label>
                    <input type="email" class="form-control" id="email" name="email" required />
                </div>
                <div class="mb-3">
                    <label for="message" class="form-label">Your Message</label>
                    <textarea class="form-control" id="message" name="message" rows="4" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary-custom">Send</button> <!-- Using btn-primary-custom for consistency -->
            </form>
        </div>
    </div>
</div>

<footer>
    &copy; 2025 Bee Farming Monitoring System. All rights reserved.
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
