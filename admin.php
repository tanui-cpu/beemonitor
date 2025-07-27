<?php
session_start();
require_once 'dbconnect.php'; // Use require_once for consistency

// Check if logged in and role is 'admin'
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') { // Use $_SESSION['role']
    header("Location: login.php"); // Redirect to login.php
    exit;
}

// Get current admin info for display
$adminId = $_SESSION['user_id'];
$adminName = $_SESSION['full_name']; // Use $_SESSION['full_name']

// Handle logout via GET request (from the logout modal)
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_unset();
    session_destroy();
    header("Location: login.php");
    exit();
}

// No direct POST handling here, all actions are handled via AJAX to backend.php
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Admin Dashboard - Bee Farming System</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css"> <!-- Consolidated CSS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/utils.js"></script> <!-- Common utilities -->
    <script>
        // Pass PHP session variable to JavaScript
        const currentAdminId = <?= json_encode($_SESSION['user_id']) ?>;
    </script>
</head>
<body>

<!-- Alert Container -->
<div class="alert-container">
    <!-- Alerts will be dynamically added here by JavaScript -->
</div>

<!-- Navigation Bar -->
<nav class="navbar navbar-expand-lg navbar-custom">
    <div class="container">
        <a class="navbar-brand" href="admin_dashboard.php">⚙️ Admin Dashboard</a>
        <div class="ms-auto d-flex align-items-center">
            <span class="me-3 text-white">Hi, <?= htmlspecialchars($adminName) ?></span>
            <button type="button" class="btn btn-outline-light btn-sm" data-bs-toggle="modal" data-bs-target="#logoutConfirmModal">
                Logout
            </button>
        </div>
    </div>
</nav>

<div class="header">
    <h1>System Administrator Dashboard</h1>
</div>

<div class="container">

    <!-- Registered Users Section -->
    <div class="card p-3 mb-4">
        <h5>👥 Registered Users</h5>
        <div id="usersList">
            <p class="text-center text-muted">Loading users...</p>
        </div>
    </div>

</div>

<!-- Logout Confirmation Modal -->
<div class="modal fade" id="logoutConfirmModal" tabindex="-1" aria-labelledby="logoutConfirmModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="logoutConfirmModalLabel">Confirm Logout</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                Are you sure you want to log out?
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <a href="?action=logout" class="btn btn-danger">Logout</a>
            </div>
        </div>
    </div>
</div>

<!-- Generic Delete Confirmation Modal -->
<div class="modal fade" id="genericDeleteConfirmModal" tabindex="-1" aria-labelledby="genericDeleteConfirmModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="genericDeleteConfirmModalLabel">Confirm Deletion</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                Are you sure you want to delete this user? This action cannot be undone.
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
            </div>
        </div>
    </div>
</div>

<script src="js/admin.js"></script> <!-- Dashboard specific JS -->
</body>
</html>
