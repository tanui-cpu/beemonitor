<?php
session_start(); // Must be the very first line of PHP
require_once 'dbconnect.php'; // Contains $pdo = new PDO(...) - Ensure this path is correct

// Set standard headers for JSON API responses
header("Content-Type: application/json");
// IMPORTANT: Restrict Access-Control-Allow-Origin to your specific frontend domain in production
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE"); // Added DELETE method

// Handle CORS pre-flight requests (OPTIONS method)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get the action from the query string (e.g., ?action=login)
$action = $_GET['action'] ?? null;

// Attempt to decode JSON input for POST/DELETE requests
$data = json_decode(file_get_contents("php://input"), true);

// Get current user ID from session, if logged in
$currentUserId = $_SESSION['user_id'] ?? null;
$currentUserRole = $_SESSION['role'] ?? null;

// Helper function for sending JSON responses
function sendJsonResponse($success, $message = '', $code = '', $data = []) {
    echo json_encode(array_merge(["success" => $success, "message" => $message, "code" => $code], $data));
    exit;
}

// ---------------- REGISTER ACTION ----------------
if ($action === 'register') {
    $name = trim($data['full_name'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $confirm = $data['confirm_password'] ?? '';
    $role = $data['role'] ?? 'beekeeper'; // Default to beekeeper
    $phoneNumber = trim($data['phone_number'] ?? '');

    if (!$name || !$email || !$password || !$confirm || !$role) {
        sendJsonResponse(false, "All required fields must be filled.", "MISSING_FIELDS");
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendJsonResponse(false, "Invalid email address format.", "INVALID_EMAIL_FORMAT");
    }
    if ($password !== $confirm) {
        sendJsonResponse(false, "Passwords do not match.", "PASSWORD_MISMATCH");
    }
    if (strlen($password) < 8) {
        sendJsonResponse(false, "Password must be at least 8 characters long.", "PASSWORD_TOO_SHORT");
    }
    if ($role === 'admin' || $role === 'officer') {
        sendJsonResponse(false, "Cannot register for this role through the public form.", "INVALID_ROLE");
    }

    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->rowCount() > 0) {
            sendJsonResponse(false, "Email already registered. Please use a different email or log in.", "EMAIL_TAKEN");
        }

        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $is_approved_status = 1; // Assuming immediate approval for beekeepers

        $insert = $pdo->prepare("INSERT INTO users (full_name, email, password, role, is_approved, phone_number) VALUES (?, ?, ?, ?, ?, ?)");
        $insert->execute([$name, $email, $hashed, $role, $is_approved_status, $phoneNumber]);

        sendJsonResponse(true, "Registration successful. You can now log in.");

    } catch (PDOException $e) {
        error_log("Registration database error: " . $e->getMessage());
        sendJsonResponse(false, "A database error occurred during registration. Please try again later.", "DATABASE_ERROR");
    }
}

// ---------------- LOGIN ACTION ----------------
if ($action === 'login') {
    $email = trim($data['email'] ?? '');
    $password = trim($data['password'] ?? ''); // Trim password too, though password_verify handles trailing whitespace

    if (!$email || !$password) {
        sendJsonResponse(false, "Email and password are required.", "MISSING_CREDENTIALS");
    }

    try {
        $stmt = $pdo->prepare("SELECT id, password, role, is_approved, full_name FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            // Generic message for security (don't reveal if email exists)
            sendJsonResponse(false, "Invalid email or password.", "ACCOUNT_NOT_FOUND");
        }
        if ($user['is_approved'] == 0) {
            sendJsonResponse(false, "Your account is awaiting administrator approval.", "ACCOUNT_NOT_APPROVED");
        }
        if (!password_verify($password, $user['password'])) {
            // Generic message for security
            sendJsonResponse(false, "Invalid email or password.", "INCORRECT_PASSWORD");
        }

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['email'] = $email; // Store email in session
        $_SESSION['full_name'] = $user['full_name']; // Store full name in session

        $redirect_url = match ($user['role']) {
            'beekeeper' => 'beekeeper_dashboard.php',
            'officer' => 'officer_dashboard.php',
            'admin' => 'admin_dashboard.php',
            default => 'login.php'
        };

        sendJsonResponse(true, "Login successful.", "", ["redirect" => $redirect_url]);

    } catch (PDOException $e) {
        error_log("Login database error: " . $e->getMessage());
        sendJsonResponse(false, "A database error occurred. Please try again later.", "DATABASE_ERROR");
    }
}

// ---------------- LOGOUT ACTION ----------------
if ($action === 'logout') {
    session_unset();
    session_destroy();
    sendJsonResponse(true, "Logged out successfully.", "", ["redirect" => "login.php"]);
}

// ---------------- API ENDPOINTS WITH ROLE-BASED ACCESS CONTROL ----------------

// Middleware to check if user is logged in
if (!in_array($action, ['register', 'login', 'logout'])) {
    if (!$currentUserId) {
        http_response_code(401); // Unauthorized
        sendJsonResponse(false, "Unauthorized access. Please log in.", "UNAUTHORIZED");
    }
}

// Beekeeper-specific actions
if (in_array($action, ['get_beehives_overview', 'get_live_sensor_data', 'simulate', 'get_alerts', 'send_report', 'get_reports', 'delete_report', 'get_recommendations', 'delete_recommendation', 'get_beehives_for_selection', 'register_sensor', 'get_registered_sensors', 'add_beehive', 'update_beehive', 'delete_beehive'])) {
    if ($currentUserRole !== 'beekeeper') {
        http_response_code(403); // Forbidden
        sendJsonResponse(false, "Access Denied. You must be a beekeeper to perform this action.", "FORBIDDEN_ROLE");
    }
}

// Officer-specific actions
if (in_array($action, ['get_reports_for_officer', 'add_recommendation', 'get_recommendations_by_officer', 'delete_report_officer', 'delete_recommendation_officer'])) {
    if ($currentUserRole !== 'officer') {
        http_response_code(403); // Forbidden
        sendJsonResponse(false, "Access Denied. You must be an officer to perform this action.", "FORBIDDEN_ROLE");
    }
}

// Admin-specific actions
if (in_array($action, ['get_all_users', 'approve_user', 'delete_user'])) {
    if ($currentUserRole !== 'admin') {
        http_response_code(403); // Forbidden
        sendJsonResponse(false, "Access Denied. You must be an administrator to perform this action.", "FORBIDDEN_ROLE");
    }
}


// ---------------- BEEKEEPER DASHBOARD ACTIONS ----------------

// NEW: Add a new beehive
if ($action === 'add_beehive' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $hiveName = trim($data['hive_name'] ?? '');
    $location = trim($data['location'] ?? '');

    if (!$hiveName || !$location) {
        sendJsonResponse(false, "Hive name and location are required.", "MISSING_FIELDS");
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO beehives (user_id, hive_name, location) VALUES (?, ?, ?)");
        $stmt->execute([$currentUserId, $hiveName, $location]);
        sendJsonResponse(true, "Beehive added successfully.");
    } catch (PDOException $e) {
        error_log("Add beehive error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to add beehive: " . $e->getMessage(), "DB_ERROR");
    }
}

// NEW: Update an existing beehive
if ($action === 'update_beehive' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $hiveId = $data['hive_id'] ?? null;
    $hiveName = trim($data['hive_name'] ?? '');
    $location = trim($data['location'] ?? '');

    if (!$hiveId || !$hiveName || !$location) {
        sendJsonResponse(false, "Hive ID, name, and location are required.", "MISSING_FIELDS");
    }

    try {
        // Ensure the beehive belongs to the current user before updating
        $stmt = $pdo->prepare("UPDATE beehives SET hive_name = ?, location = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$hiveName, $location, $hiveId, $currentUserId]);

        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, "Beehive updated successfully.");
        } else {
            sendJsonResponse(false, "Beehive not found or you don't have permission to update it.", "NOT_FOUND_OR_UNAUTHORIZED");
        }
    } catch (PDOException $e) {
        error_log("Update beehive error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to update beehive: " . $e->getMessage(), "DB_ERROR");
    }
}

// NEW: Delete a beehive
if ($action === 'delete_beehive' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $hiveId = $_GET['id'] ?? null; // Get ID from query string for DELETE requests

    if (!$hiveId) {
        sendJsonResponse(false, "Hive ID is required.", "MISSING_ID");
    }

    try {
        // Ensure the beehive belongs to the current user before deleting
        $stmt = $pdo->prepare("DELETE FROM beehives WHERE id = ? AND user_id = ?");
        $stmt->execute([$hiveId, $currentUserId]);

        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, "Beehive deleted successfully.");
        } else {
            sendJsonResponse(false, "Beehive not found or you don't have permission to delete it.", "NOT_FOUND_OR_UNAUTHORIZED");
        }
    } catch (PDOException $e) {
        error_log("Delete beehive error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to delete beehive: " . $e->getMessage(), "DB_ERROR");
    }
}


// Simulate sensor data (now includes weight)
if ($action === 'simulate' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Fetch one of the beekeeper's hives to simulate data for
    $hiveStmt = $pdo->prepare("SELECT id FROM beehives WHERE user_id = ? LIMIT 1");
    $hiveStmt->execute([$currentUserId]);
    $hive = $hiveStmt->fetch(PDO::FETCH_ASSOC);

    if (!$hive) {
        sendJsonResponse(false, "Cannot simulate data: No beehives registered for your account. Please add one first!", "NO_HIVES_FOUND");
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

            // Attempt to send email alert (assuming $user['email'] is available from session)
            // Note: sendAlert function is in beekeeper_dashboard.php, so this would need to be moved or re-implemented here
            // For now, we'll just log it.
            error_log("Critical alert generated for Hive $simulatedHiveId: $alertMessage");
            sendJsonResponse(true, "Critical alert logged for Hive $simulatedHiveId. Email functionality needs server setup.", "", ["status" => "critical"]);

        } else {
            sendJsonResponse(true, "Sensor data simulated successfully for Hive $simulatedHiveId. Status: Normal.", "", ["status" => "normal"]);
        }
        $pdo->commit(); // Commit transaction
    } catch (PDOException $e) {
        $pdo->rollBack(); // Rollback on error
        error_log("Database error during sensor data simulation: " . $e->getMessage());
        sendJsonResponse(false, "Error simulating data: " . $e->getMessage(), "DB_ERROR");
    }
}


// Get overview of all beehives for the current beekeeper with latest sensor data (now includes weight)
if ($action === 'get_beehives_overview') {
    try {
        // This query fetches all hives for the user and their LATEST sensor data
        // Uses a subquery to get the most recent sensor_data.id for each hive
        $stmt = $pdo->prepare("
            SELECT
                b.id AS hive_id,
                b.hive_name,
                b.location,
                sd.temperature,
                sd.humidity,
                sd.weight, -- Added weight
                sd.timestamp AS last_reading_at
            FROM
                beehives b
            LEFT JOIN
                sensor_data sd ON b.id = sd.hive_id
            WHERE
                b.user_id = ?
            AND
                sd.id = (SELECT MAX(id) FROM sensor_data WHERE hive_id = b.id) OR sd.id IS NULL
            ORDER BY
                b.hive_name ASC
        ");
        $stmt->execute([$currentUserId]);
        $hivesOverview = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJsonResponse(true, "Beehives overview fetched.", "", ["hives_overview" => $hivesOverview]);
    } catch (PDOException $e) {
        error_log("Get beehives overview error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to retrieve beehives overview.", "DB_ERROR");
    }
}


// Get live sensor data (for chart)
if ($action === 'get_live_sensor_data') {
    try {
        // Fetch latest 60 sensor data points (across all hives if not filtered by hive_id)
        // For a multi-hive dashboard, you might want to filter by user's hives: WHERE hive_id IN (...)
        $stmt = $pdo->prepare("SELECT hive_id, temperature, humidity, weight, timestamp FROM sensor_data ORDER BY timestamp DESC LIMIT 60");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJsonResponse(true, "Sensor data fetched.", "", ["sensor_data" => $data]);
    } catch (PDOException $e) {
        error_log("Get sensor data error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to retrieve sensor data.", "DB_ERROR");
    }
}

// Get recent alerts for the beekeeper's hives
if ($action === 'get_alerts') {
    try {
        // Fetch alerts for hives owned by the current beekeeper
        $stmt = $pdo->prepare("SELECT a.*, b.hive_name FROM alerts a JOIN beehives b ON a.hive_id = b.id WHERE b.user_id = ? ORDER BY a.created_at DESC LIMIT 5");
        $stmt->execute([$currentUserId]);
        $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJsonResponse(true, "Alerts fetched.", "", ["alerts" => $alerts]);
    } catch (PDOException $e) {
        error_log("Get alerts error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to retrieve alerts.", "DB_ERROR");
    }
}

// Get list of Agricultural Officers for report sending
if ($action === 'get_officers') {
    try {
        $stmt = $pdo->prepare("SELECT id, full_name, email FROM users WHERE role = 'officer' AND is_approved = 1");
        $stmt->execute();
        $officers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJsonResponse(true, "Officers fetched.", "", ["officers" => $officers]);
    } catch (PDOException $e) {
        error_log("Get officers error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to retrieve officers.", "DB_ERROR");
    }
}

// Send a report from beekeeper to officer
if ($action === 'send_report' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $officerId = $data['officer_id'] ?? null;
    $message = trim($data['message'] ?? '');

    if (!$officerId || !$message) {
        sendJsonResponse(false, "Officer and message are required.", "MISSING_FIELDS");
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO reports (beekeeper_id, officer_id, message) VALUES (?, ?, ?)");
        $stmt->execute([$currentUserId, $officerId, $message]);
        sendJsonResponse(true, "Report sent successfully.");
    } catch (PDOException $e) {
        error_log("Send report error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to send report.", "DB_ERROR");
    }
}

// Get reports sent by the current beekeeper
if ($action === 'get_reports') {
    try {
        $stmt = $pdo->prepare("
            SELECT r.id, r.message, r.created_at, u.full_name as officer_name, u.email as officer_email
            FROM reports r
            JOIN users u ON r.officer_id = u.id
            WHERE r.beekeeper_id = ?
            ORDER BY r.created_at DESC LIMIT 10
        ");
        $stmt->execute([$currentUserId]);
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJsonResponse(true, "Reports fetched.", "", ["reports" => $reports]);
    } catch (PDOException $e) {
        error_log("Get reports error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to retrieve reports.", "DB_ERROR");
    }
}

// Delete a report sent by the current beekeeper
if ($action === 'delete_report' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $reportId = $_GET['id'] ?? null; // Get ID from query string for DELETE requests

    if (!$reportId) {
        sendJsonResponse(false, "Report ID is required.", "MISSING_ID");
    }

    try {
        // Ensure the report belongs to the current beekeeper before deleting
        $stmt = $pdo->prepare("DELETE FROM reports WHERE id = ? AND beekeeper_id = ?");
        $stmt->execute([$reportId, $currentUserId]);

        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, "Report deleted successfully.");
        } else {
            sendJsonResponse(false, "Report not found or you don't have permission to delete it.", "NOT_FOUND_OR_UNAUTHORIZED");
        }
    } catch (PDOException $e) {
        error_log("Delete report error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to delete report.", "DB_ERROR");
    }
}

// Get recommendations received by the current beekeeper
if ($action === 'get_recommendations') {
    try {
        $stmt = $pdo->prepare("
            SELECT rec.id, rec.message, rec.created_at, u.full_name as officer_name, u.email as officer_email, sd.temperature, sd.humidity, sd.weight
            FROM recommendations rec
            JOIN users u ON rec.officer_id = u.id
            LEFT JOIN sensor_data sd ON rec.sensor_data_id = sd.id -- LEFT JOIN in case sensor data was deleted
            WHERE rec.beekeeper_id = ?
            ORDER BY rec.created_at DESC LIMIT 10
        ");
        $stmt->execute([$currentUserId]);
        $recommendations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJsonResponse(true, "Recommendations fetched.", "", ["recommendations" => $recommendations]);
    } catch (PDOException $e) {
        error_log("Get recommendations error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to retrieve recommendations.", "DB_ERROR");
    }
}

// Delete a recommendation received by the current beekeeper
if ($action === 'delete_recommendation' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $recommendationId = $_GET['id'] ?? null; // Get ID from query string for DELETE requests

    if (!$recommendationId) {
        sendJsonResponse(false, "Recommendation ID is required.", "MISSING_ID");
    }

    try {
        // Ensure the recommendation belongs to the current beekeeper before deleting
        $stmt = $pdo->prepare("DELETE FROM recommendations WHERE id = ? AND beekeeper_id = ?");
        $stmt->execute([$recommendationId, $currentUserId]);

        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, "Recommendation deleted successfully.");
        } else {
            sendJsonResponse(false, "Recommendation not found or you don't have permission to delete it.", "NOT_FOUND_OR_UNAUTHORIZED");
        }
    } catch (PDOException $e) {
        error_log("Delete recommendation error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to delete recommendation.", "DB_ERROR");
    }
}

// Get beehives for selection (for sensor registration dropdown)
if ($action === 'get_beehives_for_selection') {
    try {
        $stmt = $pdo->prepare("SELECT id, hive_name FROM beehives WHERE user_id = ? ORDER BY hive_name ASC");
        $stmt->execute([$currentUserId]);
        $hives = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJsonResponse(true, "Beehives fetched for selection.", "", ["hives" => $hives]);
    } catch (PDOException $e) {
        error_log("Get beehives for selection error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to retrieve beehives for selection.", "DB_ERROR");
    }
}

// Register a new sensor
if ($action === 'register_sensor' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $hiveId = $data['hive_id'] ?? null;
    $serialNumber = trim($data['serial_number'] ?? '');
    $sensorType = trim($data['sensor_type'] ?? '');

    if (!$hiveId || !$serialNumber || !$sensorType) {
        sendJsonResponse(false, "All sensor fields are required.", "MISSING_FIELDS");
    }

    try {
        // Validate that the hive_id belongs to the current user
        $hiveCheckStmt = $pdo->prepare("SELECT id FROM beehives WHERE id = ? AND user_id = ?");
        $hiveCheckStmt->execute([$hiveId, $currentUserId]);
        if ($hiveCheckStmt->rowCount() === 0) {
            sendJsonResponse(false, "Invalid Hive ID or you do not own this hive.", "INVALID_HIVE_ID");
        }

        // Check if serial number already exists
        $serialCheckStmt = $pdo->prepare("SELECT id FROM sensors WHERE serial_number = ?");
        $serialCheckStmt->execute([$serialNumber]);
        if ($serialCheckStmt->rowCount() > 0) {
            sendJsonResponse(false, "Sensor with this serial number already registered.", "DUPLICATE_SERIAL");
        }

        $stmt = $pdo->prepare("INSERT INTO sensors (hive_id, serial_number, sensor_type) VALUES (?, ?, ?)");
        $stmt->execute([$hiveId, $serialNumber, $sensorType]);
        sendJsonResponse(true, "Sensor registered successfully.");
    } catch (PDOException $e) {
        error_log("Register sensor error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to register sensor: " . $e->getMessage(), "DB_ERROR");
    }
}

// Get registered sensors for the current beekeeper
if ($action === 'get_registered_sensors') {
    try {
        $stmt = $pdo->prepare("
            SELECT s.id, s.serial_number, s.sensor_type, s.created_at, b.hive_name, b.location
            FROM sensors s
            JOIN beehives b ON s.hive_id = b.id
            WHERE b.user_id = ?
            ORDER BY s.created_at DESC
        ");
        $stmt->execute([$currentUserId]);
        $sensors = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJsonResponse(true, "Registered sensors fetched.", "", ["sensors" => $sensors]);
    } catch (PDOException $e) {
        error_log("Get registered sensors error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to retrieve registered sensors.", "DB_ERROR");
    }
}

// ---------------- OFFICER DASHBOARD ACTIONS ----------------

// Get reports sent to the current officer
if ($action === 'get_reports_for_officer') {
    try {
        $stmt = $pdo->prepare("
            SELECT
                r.id AS report_id,
                r.message AS report_message,
                r.created_at AS report_created_at,
                bk.full_name AS beekeeper_name,
                bk.email AS beekeeper_email,
                b.hive_name,
                b.location,
                GROUP_CONCAT(rec.message ORDER BY rec.created_at SEPARATOR ' || ') AS recommendations_text
            FROM
                reports r
            JOIN
                users bk ON r.beekeeper_id = bk.id
            LEFT JOIN
                beehives b ON r.hive_id = b.id -- Assuming reports might be linked to a hive, or not directly
            LEFT JOIN
                recommendations rec ON rec.report_id = r.id
            WHERE
                r.officer_id = ?
            GROUP BY
                r.id
            ORDER BY
                r.created_at DESC
        ");
        $stmt->execute([$currentUserId]);
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJsonResponse(true, "Reports for officer fetched.", "", ["reports" => $reports]);
    } catch (PDOException $e) {
        error_log("Get reports for officer error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to retrieve reports for officer.", "DB_ERROR");
    }
}

// Add a recommendation by an officer
if ($action === 'add_recommendation' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $reportId = $data['report_id'] ?? null;
    $message = trim($data['message'] ?? '');

    if (!$reportId || !$message) {
        sendJsonResponse(false, "Report ID and message are required for recommendation.", "MISSING_FIELDS");
    }

    try {
        // Get beekeeper_id from the report to link the recommendation correctly
        $reportStmt = $pdo->prepare("SELECT beekeeper_id FROM reports WHERE id = ? AND officer_id = ?");
        $reportStmt->execute([$reportId, $currentUserId]);
        $report = $reportStmt->fetch(PDO::FETCH_ASSOC);

        if (!$report) {
            sendJsonResponse(false, "Report not found or you do not have permission to add a recommendation to it.", "REPORT_NOT_FOUND");
        }

        $beekeeperId = $report['beekeeper_id'];

        $stmt = $pdo->prepare("INSERT INTO recommendations (officer_id, beekeeper_id, report_id, message) VALUES (?, ?, ?, ?)");
        $stmt->execute([$currentUserId, $beekeeperId, $reportId, $message]);
        sendJsonResponse(true, "Recommendation added successfully.");
    } catch (PDOException $e) {
        error_log("Add recommendation error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to add recommendation: " . $e->getMessage(), "DB_ERROR");
    }
}

// Get recommendations sent by the current officer
if ($action === 'get_recommendations_by_officer') {
    try {
        $stmt = $pdo->prepare("
            SELECT
                rec.id,
                rec.message,
                rec.created_at,
                bk.full_name AS beekeeper_name,
                bk.email AS beekeeper_email,
                r.message AS related_report_message,
                sd.temperature,
                sd.humidity,
                sd.weight
            FROM
                recommendations rec
            JOIN
                users bk ON rec.beekeeper_id = bk.id
            LEFT JOIN
                reports r ON rec.report_id = r.id
            LEFT JOIN
                sensor_data sd ON rec.sensor_data_id = sd.id
            WHERE
                rec.officer_id = ?
            ORDER BY
                rec.created_at DESC LIMIT 10
        ");
        $stmt->execute([$currentUserId]);
        $recommendations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJsonResponse(true, "Recommendations sent by officer fetched.", "", ["recommendations" => $recommendations]);
    } catch (PDOException $e) {
        error_log("Get recommendations by officer error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to retrieve recommendations sent by officer.", "DB_ERROR");
    }
}

// Delete a report (from officer's view)
if ($action === 'delete_report_officer' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $reportId = $_GET['id'] ?? null;

    if (!$reportId) {
        sendJsonResponse(false, "Report ID is required.", "MISSING_ID");
    }

    try {
        // Ensure the report was sent TO the current officer before deleting
        $stmt = $pdo->prepare("DELETE FROM reports WHERE id = ? AND officer_id = ?");
        $stmt->execute([$reportId, $currentUserId]);

        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, "Report deleted successfully.");
        } else {
            sendJsonResponse(false, "Report not found or you don't have permission to delete it.", "NOT_FOUND_OR_UNAUTHORIZED");
        }
    } catch (PDOException $e) {
        error_log("Delete report (officer) error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to delete report: " . $e->getMessage(), "DB_ERROR");
    }
}

// Delete a recommendation (from officer's view)
if ($action === 'delete_recommendation_officer' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $recommendationId = $_GET['id'] ?? null;

    if (!$recommendationId) {
        sendJsonResponse(false, "Recommendation ID is required.", "MISSING_ID");
    }

    try {
        // Ensure the recommendation was sent BY the current officer before deleting
        $stmt = $pdo->prepare("DELETE FROM recommendations WHERE id = ? AND officer_id = ?");
        $stmt->execute([$recommendationId, $currentUserId]);

        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, "Recommendation deleted successfully.");
        } else {
            sendJsonResponse(false, "Recommendation not found or you don't have permission to delete it.", "NOT_FOUND_OR_UNAUTHORIZED");
        }
    } catch (PDOException $e) {
        error_log("Delete recommendation (officer) error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to delete recommendation: " . $e->getMessage(), "DB_ERROR");
    }
}


// ---------------- ADMIN DASHBOARD ACTIONS ----------------

// NEW: Get all users for admin dashboard
if ($action === 'get_all_users') {
    try {
        $stmt = $pdo->prepare("SELECT id, full_name, email, role, is_approved FROM users ORDER BY created_at DESC");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJsonResponse(true, "Users fetched successfully.", "", ["users" => $users]);
    } catch (PDOException $e) {
        error_log("Get all users error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to retrieve users.", "DB_ERROR");
    }
}

// NEW: Approve a user
if ($action === 'approve_user' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $userIdToApprove = $data['user_id'] ?? null;

    if (!$userIdToApprove) {
        sendJsonResponse(false, "User ID is required for approval.", "MISSING_ID");
    }

    try {
        $stmt = $pdo->prepare("UPDATE users SET is_approved = 1 WHERE id = ?");
        $stmt->execute([$userIdToApprove]);
        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, "User approved successfully.");
        } else {
            sendJsonResponse(false, "User not found or already approved.", "USER_NOT_FOUND_OR_APPROVED");
        }
    } catch (PDOException $e) {
        error_log("Approve user error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to approve user: " . $e->getMessage(), "DB_ERROR");
    }
}

// NEW: Delete a user
if ($action === 'delete_user' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $userIdToDelete = $_GET['id'] ?? null; // Get ID from query string for DELETE requests

    if (!$userIdToDelete) {
        sendJsonResponse(false, "User ID is required for deletion.", "MISSING_ID");
    }

    // Prevent admin from deleting themselves
    if ($userIdToDelete == $currentUserId) {
        sendJsonResponse(false, "You cannot delete your own account.", "SELF_DELETE_FORBIDDEN");
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userIdToDelete]);
        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, "User deleted successfully.");
        } else {
            sendJsonResponse(false, "User not found.", "USER_NOT_FOUND");
        }
    } catch (PDOException $e) {
        error_log("Delete user error: " . $e->getMessage());
        sendJsonResponse(false, "Failed to delete user: " . $e->getMessage(), "DB_ERROR");
    }
}


// ---------------- DEFAULT / INVALID ACTION ----------------
http_response_code(400); // Set HTTP status code to 400 Bad Request
sendJsonResponse(false, "Invalid or missing action parameter.", "INVALID_ACTION");
