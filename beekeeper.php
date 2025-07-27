<?php
session_start();
require_once 'dbconnect.php'; // assumes $pdo is initialized here - Ensure this path is correct

// Redirect to login if user is not logged in or not a beekeeper
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'beekeeper') {
    header("Location: login.php");
    exit();
}

// Logout action
// This handles the direct GET request from the logout confirmation modal
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_unset();
    session_destroy();
    header("Location: login.php"); // Redirect to login page after logout
    exit();
}

// Get current user info
$userId = $_SESSION['user_id'];
$userStmt = $pdo->prepare("SELECT full_name, email FROM users WHERE id = ?");
$userStmt->execute([$userId]);
$user = $userStmt->fetch(PDO::FETCH_ASSOC); // Fetch as associative array

// Function to send alerts (Placeholder - replace with robust solution like PHPMailer or a service API)
function sendAlert($toEmail, $hiveId, $temp, $humidity, $weight) {
    $subject = "⚠️ Critical Alert from Hive $hiveId - Bee Farming System";
    $message = "Dear Beekeeper,\n\nHive ID: $hiveId is reporting abnormal conditions:\nTemperature: $temp°C\nHumidity: $humidity%\nWeight: " . number_format($weight, 2) . "kg\n\nPlease check your hive promptly.\n\nBest regards,\nYour Bee Farming System Team";
    $headers = 'From: no-reply@yourdomain.com' . "\r\n" . // CHANGE THIS TO YOUR ACTUAL DOMAIN EMAIL
               'Reply-To: no-reply@yourdomain.com' . "\r\n" . // CHANGE THIS TOO
               'X-Mailer: PHP/' . phpversion();

    // In a real application, use a dedicated email library (PHPMailer) or transactional email service (SendGrid, Mailgun)
    return mail($toEmail, $subject, $message, $headers);
}

// Simulate sensor data
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['simulate'])) {
    // Fetch one of the beekeeper's hives to simulate data for
    $hiveStmt = $pdo->prepare("SELECT id FROM beehives WHERE user_id = ? LIMIT 1");
    $hiveStmt->execute([$userId]);
    $hive = $hiveStmt->fetch(PDO::FETCH_ASSOC);

    if (!$hive) {
        $_SESSION['alert_message'] = "Cannot simulate data: No beehives registered for your account. Please add one first!";
        $_SESSION['alert_type'] = "danger";
        header("Location: beekeeper.php");
        exit();
    }

    $simulatedHiveId = $hive['id']; // Use the actual hive ID

    $temperature = rand(25, 45); // Simulate temperature within a range
    $humidity = rand(20, 60);   // Simulate humidity within a range
    $weight = rand(10, 50) + (rand(0, 99) / 100); // Simulate weight with 2 decimal places

    $status = 'Normal';
    // More realistic critical conditions: outside optimal range (e.g., 32-35C temp, 50-70% humidity)
    // Add weight conditions: e.g., if weight drops significantly, or is too low/high
    if ($temperature > 40 || $temperature < 15 || $humidity < 30 || $humidity > 80 || $weight < 15 || $weight > 45) {
        $status = 'Critical';
    }

    try {
        $pdo->beginTransaction(); // Start transaction for atomicity

        // Insert temperature, humidity, and weight
        $stmt = $pdo->prepare("INSERT INTO sensor_data (hive_id, temperature, humidity, weight, timestamp) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$simulatedHiveId, $temperature, $humidity, $weight]);
        $sensorDataId = $pdo->lastInsertId(); // Get the ID of the inserted sensor data

        if ($status === 'Critical') {
            // Store alert in the database
            $alertMessage = "Hive $simulatedHiveId: Temp $temperature°C, Humidity $humidity%, Weight " . number_format($weight, 2) . "kg - Critical conditions detected.";
            $alertLevel = 'critical'; // Or 'warning'
            $alertStmt = $pdo->prepare("INSERT INTO alerts (hive_id, message, alert_level, created_at) VALUES (?, ?, ?, NOW())");
            $alertStmt->execute([$simulatedHiveId, $alertMessage, $alertLevel]);

            // Attempt to send email alert
            if (sendAlert($user['email'], $simulatedHiveId, $temperature, $humidity, $weight)) {
                $_SESSION['alert_message'] = "Critical alert sent to " . htmlspecialchars($user['email']) . " for Hive $simulatedHiveId and logged.";
                $_SESSION['alert_type'] = "success";
            } else {
                $_SESSION['alert_message'] = "Critical alert logged for Hive $simulatedHiveId, but email failed to send. Check server mail configuration.";
                $_SESSION['alert_type'] = "warning";
            }
        } else {
            $_SESSION['alert_message'] = "Sensor data simulated successfully for Hive $simulatedHiveId. Status: Normal.";
            $_SESSION['alert_type'] = "info";
        }
        $pdo->commit(); // Commit transaction
    } catch (PDOException $e) {
        $pdo->rollBack(); // Rollback on error
        error_log("Database error during sensor data simulation: " . $e->getMessage());
        $_SESSION['alert_message'] = "Error simulating data: " . $e->getMessage();
        $_SESSION['alert_type'] = "danger";
    }

    header("Location: beekeeper_dashboard.php"); // Redirect to self to clear POST and show alert
    exit();
}

// Handle messages from previous requests (e.g., after simulation)
$alertMessage = $_SESSION['alert_message'] ?? '';
$alertType = $_SESSION['alert_type'] ?? 'info';
unset($_SESSION['alert_message']);
unset($_SESSION['alert_type']);

// Initial data load for chart (will be updated by AJAX)
// Fetch latest 60 sensor data points for the user's hives to allow horizontal scrolling
$chartStmt = $pdo->prepare("SELECT hive_id, temperature, humidity, weight, timestamp FROM sensor_data ORDER BY timestamp ASC LIMIT 60");
$chartStmt->execute();
$initialChartData = $chartStmt->fetchAll(PDO::FETCH_ASSOC);

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beekeeper Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css"> <!-- Consolidated CSS -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/utils.js"></script> <!-- Common utilities -->
</head>
<body>

<!-- Alert Container -->
<div class="alert-container">
    <?php if (!empty($alertMessage)): ?>
        <div class="alert alert-<?= htmlspecialchars($alertType) ?> alert-dismissible fade show" role="alert">
            <?= htmlspecialchars($alertMessage) ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    <?php endif; ?>
</div>

<!-- Navigation Bar -->
<nav class="navbar navbar-expand-lg navbar-warning bg-warning">
    <div class="container">
        <a class="navbar-brand fw-bold text-dark" href="#">🐝 Bee Monitoring</a>
        <div class="ms-auto d-flex align-items-center">
            <span class="me-3 text-dark">Hi, <?= htmlspecialchars($user['full_name']) ?></span>
            <!-- Logout Button (triggers Bootstrap Modal) -->
            <button type="button" class="btn btn-sm btn-dark" data-bs-toggle="modal" data-bs-target="#logoutConfirmModal">
                Logout
            </button>
        </div>
    </div>
</nav>

<!-- Main Content -->
<div class="container mt-4">
    <h3 class="mb-4">🏠 Your Beehives Overview</h3>

    <!-- Beehive Cards Section -->
    <div id="beehivesOverview" class="row">
        <p class="text-center text-muted">Loading beehives...</p>
        <!-- Beehive cards will be dynamically loaded here by JavaScript -->
    </div>

    <hr class="my-5"> <!-- Separator -->

    <div class="row">
        <div class="col-md-6">
            <!-- Simulate Button -->
            <div class="card p-3 mb-4">
                <h5>🔄 Simulate Data</h5>
                <form method="POST">
                    <input type="hidden" name="simulate" value="1">
                    <button type="submit" class="btn btn-primary-custom w-100">Simulate Sensor Data</button>
                </form>
            </div>
        </div>
        <div class="col-md-6">
            <!-- Register New Sensor Button -->
            <div class="card p-3 mb-4">
                <h5>➕ Register New Sensor</h5>
                <button type="button" class="btn btn-info-custom w-100" data-bs-toggle="modal" data-bs-target="#registerSensorModal">
                    Register Sensor
                </button>
            </div>
        </div>
    </div>

    <h3 class="mb-4">📊 Sensor Data Trends</h3>

    <!-- Sensor Data Chart -->
    <div class="card p-3 mb-4">
        <h5>📈 Temperature & Humidity Trends Over Time</h5>
        <div class="chart-container-wrapper">
            <canvas id="liveChart" height="100"></canvas>
        </div>
    </div>

    <!-- Registered Sensors Section -->
    <div class="card p-3 mb-4">
        <h5>⚙️ Registered Sensors</h5>
        <div id="registeredSensorsList">
            <p class="text-center text-muted">Loading registered sensors...</p>
        </div>
    </div>

    <!-- Recent Alerts Section -->
    <div class="card p-3 mb-4">
        <h5>🚨 Recent Alerts</h5>
        <div id="alertsList">
            <p class="text-center text-muted">Loading alerts...</p>
        </div>
    </div>

    <!-- Sent Reports Section -->
    <div class="card p-3 mb-4">
        <h5>📝 Sent Reports</h5>
        <div id="sentReportsList">
            <p class="text-center text-muted">Loading sent reports...</p>
        </div>
    </div>

    <!-- Received Recommendations Section -->
    <div class="card p-3 mb-4">
        <h5>👍 Received Recommendations</h5>
        <div id="receivedRecommendationsList">
            <p class="text-center text-muted">Loading received recommendations...</p>
        </div>
    </div>

</div> <!-- End of Main Content Container -->

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

<!-- Send Report Modal -->
<div class="modal fade" id="sendReportModal" tabindex="-1" aria-labelledby="sendReportModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="sendReportModalLabel">Send Report to Agricultural Officer</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="sendReportForm">
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="officerSelect" class="form-label">Select Officer:</label>
                        <select class="form-select" id="officerSelect" required>
                            <option value="">Loading officers...</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="reportMessage" class="form-label">Report Message:</label>
                        <textarea class="form-control" id="reportMessage" rows="5" required></textarea>
                    </div>
                    <div id="reportFormMessage" class="alert mt-3" style="display:none;"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary-custom">Send Report</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- View Report Details Modal -->
<div class="modal fade" id="viewReportModal" tabindex="-1" aria-labelledby="viewReportModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="viewReportModalLabel">Report Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p><strong>To Officer:</strong> <span id="viewReportOfficer"></span></p>
                <p><strong>Date Sent:</strong> <span id="viewReportDate"></span></p>
                <p><strong>Message:</strong></p>
                <div id="viewReportMessage" class="alert alert-info" style="white-space: pre-wrap;"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<!-- View Recommendation Details Modal -->
<div class="modal fade" id="viewRecommendationModal" tabindex="-1" aria-labelledby="viewRecommendationModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="viewRecommendationModalLabel">Recommendation Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p><strong>From Officer:</strong> <span id="viewRecommendationOfficer"></span></p>
                <p><strong>Date Received:</strong> <span id="viewRecommendationDate"></span></p>
                <p><strong>Related Sensor Data:</strong> <span id="viewRecommendationSensorData"></span></p>
                <p><strong>Message:</strong></p>
                <div id="viewRecommendationMessage" class="alert alert-info" style="white-space: pre-wrap;"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<!-- NEW: Register Sensor Modal -->
<div class="modal fade" id="registerSensorModal" tabindex="-1" aria-labelledby="registerSensorModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="registerSensorModalLabel">Register New Sensor</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="registerSensorForm">
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="hiveSelect" class="form-label">Select Beehive:</label>
                        <select class="form-select" id="hiveSelect" required>
                            <option value="">Loading beehives...</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="sensorSerialNumber" class="form-label">Sensor Serial Number:</label>
                        <input type="text" class="form-control" id="sensorSerialNumber" required>
                    </div>
                    <div class="mb-3">
                        <label for="sensorType" class="form-label">Sensor Type:</label>
                        <select class="form-select" id="sensorType" required>
                            <option value="">Select type</option>
                            <option value="combined">Combined (Temp, Hum, Weight)</option>
                            <option value="temperature">Temperature Only</option>
                            <option value="humidity">Humidity Only</option>
                            <option value="weight">Weight Only</option>
                        </select>
                    </div>
                    <div id="registerSensorFormMessage" class="alert mt-3" style="display:none;"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary-custom">Register Sensor</button>
                </div>
            </form>
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

<script src="js/beekeeper.js"></script> <!-- Dashboard specific JS -->
</body>
</html>
