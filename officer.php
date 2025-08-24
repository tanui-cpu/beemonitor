<?php
session_start();
require_once 'dbconnect.php'; // Use require_once for consistency with other files

// Check if logged in and role is 'officer'
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'officer') { // IMPORTANT: Changed 'officer' to 'agricultural_officer'
    header("Location: login.php"); // Redirect to login.php
    exit;
}

// Get current user info for display
$officerId = $_SESSION['user_id'];
$officerName = $_SESSION['full_name']; // Use $_SESSION['full_name']

// Handle logout via GET request (from the logout modal)
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_unset();
    session_destroy();
    header("Location: login.php");
    exit();
}

// No direct POST handling here, all handled via AJAX to backend.php
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Agricultural Officer Dashboard - Bee Farming System</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css"> 
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/utils.js"></script> 
</head>
<body>

<!-- Alert Container -->
<div class="alert-container">
    <!-- Alerts will be dynamically added here by JavaScript -->
</div>

<!-- Navigation Bar -->
<nav class="navbar navbar-expand-lg navbar-warning bg-warning">
    <div class="container">
        <a class="navbar-brand fw-bold text-dark" href="#">Bee Monitoring System</a>
        <div class="ms-auto d-flex align-items-center">
            <span class="me-3 text-dark">Hi, <?= htmlspecialchars($officerName) ?></span>
            <button type="button" class="btn btn-dark btn-sm" data-bs-toggle="modal" data-bs-target="#logoutConfirmModal">
                Logout
            </button>
        </div>
    </div>
</nav>

<div class="header">
    <h1>Welcome, <?= htmlspecialchars($officerName) ?> (Agricultural Extension Officer)</h1>
</div>

<div class="container">

    <!-- Beekeeper Reports Section -->
    <div class="card p-3 mb-4">
        <h5>📝 Beekeeper Reports</h5>
        <div id="beekeeperReportsList">
            <p class="text-center text-muted">Loading reports...</p>
        </div>
    </div>

    <!-- Recommendations Sent by You Section -->
    <div class="card p-3 mb-4">
        <h5>👍 Recommendations Sent</h5>
        <div id="officerRecommendationsList">
            <p class="text-center text-muted">Loading recommendations...</p>
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

<!-- Add Recommendation Modal -->
<div class="modal fade" id="addRecommendationModal" tabindex="-1" aria-labelledby="addRecommendationModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="addRecommendationModalLabel">Add Recommendation</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="addRecommendationForm">
                <div class="modal-body">
                    <input type="hidden" id="recommendationReportId" name="report_id">
                    <input type="hidden" id="recommendationBeekeeperId"> <!-- Added hidden field for beekeeper_id -->
                    <p><strong>Report from:</strong> <span id="recommendationBeekeeperName"></span> (<span id="recommendationBeekeeperEmail"></span>)</p>
                    <p><strong>Report Message:</strong> <span id="recommendationReportMessage" class="text-muted"></span></p>
                    <div class="mb-3">
                        <label for="recommendationSensorData" class="form-label">Related Sensor Data (Optional, e.g., "Hive 1, Temp 38C"):</label>
                        <input type="text" class="form-control" id="recommendationSensorData">
                    </div>
                    <div class="mb-3">
                        <label for="recommendationMessage" class="form-label">Recommendation Message:</label>
                        <textarea class="form-control" id="recommendationMessage" rows="5" required></textarea>
                    </div>
                    <div id="addRecommendationFormMessage" class="alert mt-3" style="display:none;"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary-custom">Add Recommendation</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Edit Recommendation Modal -->
<div class="modal fade" id="editRecommendationModal" tabindex="-1" aria-labelledby="editRecommendationModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="editRecommendationModalLabel">Edit Recommendation</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="editRecommendationForm">
                <input type="hidden" id="editRecommendationId">
                <div class="modal-body">
                    <p><strong>To Beekeeper:</strong> <span id="editRecommendationBeekeeperName"></span></p>
                    <p><strong>Related Report:</strong> <span id="editRecommendationRelatedReport"></span></p>
                    <div class="mb-3">
                        <label for="editRecommendationSensorData" class="form-label">Related Sensor Data (Optional):</label>
                        <input type="text" class="form-control" id="editRecommendationSensorData">
                    </div>
                    <div class="mb-3">
                        <label for="editRecommendationMessage" class="form-label">Recommendation Message:</label>
                        <textarea class="form-control" id="editRecommendationMessage" rows="5" required></textarea>
                    </div>
                    <div id="editRecommendationFormMessage" class="alert mt-3" style="display:none;"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary-custom">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- View Report Details Modal -->
<div class="modal fade" id="viewReportDetailsModal" tabindex="-1" aria-labelledby="viewReportDetailsModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="viewReportDetailsModalLabel">Report Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p><strong>From Beekeeper:</strong> <span id="viewReportDetailsBeekeeperName"></span> (<span id="viewReportDetailsBeekeeperEmail"></span>)</p>
                <p><strong>Hive:</strong> <span id="viewReportDetailsHiveName"></span> (<span id="viewReportDetailsHiveLocation"></span>)</p>
                <p><strong>Date Sent:</strong> <span id="viewReportDetailsDate"></span></p>
                <p><strong>Report Message:</strong></p>
                <div id="viewReportDetailsMessage" class="alert alert-info" style="white-space: pre-wrap;"></div>
                <p class="mt-3"><strong>Existing Recommendations:</strong></p>
                <div id="viewReportDetailsRecommendations" class="alert alert-secondary" style="white-space: pre-wrap;"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <!-- NEW: Reply button directly in the view modal footer -->
                <button type="button" class="btn btn-primary-custom" id="replyToReportBtn">Reply with Recommendation</button>
            </div>
        </div>
    </div>
</div>

<!-- View Recommendation Details Modal -->
<div class="modal fade" id="viewOfficerRecommendationModal" tabindex="-1" aria-labelledby="viewOfficerRecommendationModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="viewOfficerRecommendationModalLabel">Recommendation Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p><strong>To Beekeeper:</strong> <span id="viewOfficerRecommendationBeekeeperName"></span> (<span id="viewOfficerRecommendationBeekeeperEmail"></span>)</p>
                <p><strong>Date Sent:</strong> <span id="viewOfficerRecommendationDate"></span></p>
                <p><strong>Related Report:</strong> <span id="viewOfficerRecommendationRelatedReport"></span></p>
                <p><strong>Related Sensor Data:</strong> <span id="viewOfficerRecommendationSensorData"></span></p>
                <p><strong>Message:</strong></p>
                <div id="viewOfficerRecommendationMessage" class="alert alert-info" style="white-space: pre-wrap;"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
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
                Are you sure you want to delete this item? This action cannot be undone.
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
            </div>
        </div>
    </div>
</div>


<script src="js/officer.js"></script> <!-- Dashboard specific JS -->
</body>
</html>
