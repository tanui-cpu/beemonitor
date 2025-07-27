<?php
session_start();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>About Us - Bee Farming Monitoring System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
    <link rel="stylesheet" href="css/style.css" /> <!-- Link to consolidated CSS -->
</head>
<body class="about-page-bg"> <!-- Added class for specific background -->

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
                <li class="nav-item"><a class="nav-link" href="support.php">Support</a></li>
                <li class="nav-item"><a class="nav-link" href="faq.php">FAQ</a></li>
                <li class="nav-item"><a class="nav-link active" aria-current="page" href="about.php">About</a></li>
                <li class="nav-item"><a class="nav-link" href="login.php">Login</a></li>
                <li class="nav-item"><a class="nav-link" href="register.php">Register</a></li>
            </ul>
        </div>
    </div>
</nav>

<!-- About Section -->
<div class="container">
    <div class="section-header">
        <h1>About Us</h1>
        <p class="lead">Who we are and what we stand for</p>
    </div>

    <div class="about-content">
        <p>
            The <strong>Web-Based Bee Farming Monitoring System</strong> is an innovative platform designed to help beekeepers monitor and manage their hives efficiently using modern digital tools.
        </p>
        
        <h5>🌿 Our Mission</h5>
        <p>
            To empower beekeepers with real-time monitoring tools and insights that enhance productivity, health, and sustainability of bee colonies.
        </p>

        <h5>🔍 What We Offer</h5>
        <ul>
            <li>Real-time hive data (temperature, humidity, activity)</li>
            <li>Data reports in charts, PDF, and Excel</li>
            <li>SMS alerts for emergencies</li>
            <li>User-specific dashboards: Beekeeper, Officer, Admin</li>
        </ul>

        <h5>🌎 Why This Matters</h5>
        <p>
            Bees are vital to agriculture and environmental sustainability. Supporting beekeepers directly improves food security and biodiversity (SDG 2, 12, 15).
        </p>

        <h5>📍 Where We Operate</h5>
        <p>
            Our solution is tailored for Kenya, with potential scalability to other regions practicing apiculture.
        </p>

        <h5>🤝 Join Us</h5>
        <p>
            Whether you're a beekeeper or agricultural officer, this system is designed to make your work easier and smarter. Register now or visit our <a href="support.php">Support</a> page to learn more.
        </p>

        <!-- Collapsible Section: Privacy / Terms / Contact -->
        <div class="accordion mt-5" id="infoAccordion">

            <!-- Privacy Policy -->
            <div class="accordion-item">
                <h2 class="accordion-header" id="headingPrivacy">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapsePrivacy" aria-expanded="false">
                        📜 Privacy Policy
                    </button>
                </h2>
                <div id="collapsePrivacy" class="accordion-collapse collapse" aria-labelledby="headingPrivacy" data-bs-parent="#infoAccordion">
                    <div class="accordion-body">
                        We respect your privacy. All data collected (such as beehive readings, SMS alerts, and user credentials) is stored securely and only accessible to authorized users. We do not share personal data with third parties.
                    </div>
                </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="accordion-item">
                <h2 class="accordion-header" id="headingTerms">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTerms" aria-expanded="false">
                        ⚖️ Terms & Conditions
                    </button>
                </h2>
                <div id="collapseTerms" class="accordion-collapse collapse" aria-labelledby="headingTerms" data-bs-parent="#infoAccordion">
                    <div class="accordion-body">
                        By using this system, users agree to input accurate information and use the system for its intended purpose only. Unauthorized access or misuse of data will lead to account termination and potential legal action.
                    </div>
                </div>
            </div>

            <!-- Contact Confirmation -->
            <div class="accordion-item">
                <h2 class="accordion-header" id="headingContact">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseContact" aria-expanded="false">
                        📬 Contact Confirmation
                    </button>
                </h2>
                <div id="collapseContact" class="accordion-collapse collapse" aria-labelledby="headingContact" data-bs-parent="#infoAccordion">
                    <div class="accordion-body">
                        Thank you for reaching out! Our support team will respond within 24–48 hours. For urgent inquiries, please call our hotline provided on the <a href="support.php">Support</a> page.
                    </div>
                </div>
            </div>

        </div>
        <!-- End Accordion -->

        <!-- PDF Download Buttons -->
        <div class="pdf-buttons">
            <a href="privacy.pdf" class="btn btn-outline-primary-custom" download> <!-- Changed to btn-outline-primary-custom -->
                📄 Download Privacy Policy (PDF)
            </a>
            <a href="terms.pdf" class="btn btn-outline-info-custom" download> <!-- Changed to btn-outline-info-custom -->
                📄 Download Terms & Conditions (PDF)
            </a>
        </div>

    </div>
</div>

<!-- Footer -->
<footer>
    &copy; 2025 Bee Farming Monitoring System. All rights reserved.
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
