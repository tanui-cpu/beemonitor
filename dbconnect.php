<?php
// dbconnect.php - PDO Database Connection

// Database connection parameters
$host = '127.0.0.1'; // Your database host (often localhost or 127.0.0.1)
$port = 3306;        // Your MySQL port
$user = 'root';      // Your database username
$pass = '';          // Your database password (empty for XAMPP/WAMP root by default)
$dbname = 'bee_farmdb'; // Your database name
$charset = 'utf8mb4'; // Character set for proper encoding

// Data Source Name (DSN) for MySQL
$dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=$charset";

// PDO options for error handling and fetching mode
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,       // Throw exceptions on errors
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,             // Fetch results as associative arrays by default
    PDO::ATTR_EMULATE_PREPARES   => false,                        // Disable emulation for better security and performance
];

try {
    // Create a new PDO instance
    $pdo = new PDO($dsn, $user, $pass, $options);
    // echo "Database connection successful!"; // For testing, remove in production
} catch (\PDOException $e) {
    // If connection fails, stop script execution and display error
    // In production, you would log this error and show a user-friendly message
    die("Database connection failed: " . $e->getMessage());
}
?>