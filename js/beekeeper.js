// Ensure Chart.js is loaded before this script if it's used here
// const ctx = document.getElementById('liveChart').getContext('2d'); // This line needs Chart.js
// liveChart initialization and update logic

// Initial Chart.js setup
const ctx = document.getElementById('liveChart').getContext('2d');
const liveChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Will be populated by fetchSensorData
        datasets: [
            {
                label: 'Temperature (°C)',
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                data: [], // Will be populated by fetchSensorData
                fill: false,
                tension: 0.1
            },
            {
                label: 'Humidity (%)',
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                data: [], // Will be populated by fetchSensorData
                fill: false,
                tension: 0.1
            },
            {
                label: 'Weight (kg)', // New dataset for weight
                borderColor: '#8e44ad', // Purple color
                backgroundColor: 'rgba(142, 68, 173, 0.2)',
                data: [], // Will be populated by fetchSensorData
                fill: false,
                tension: 0.1
            }
        ]
    },
    options: {
        responsive: false, // Set to false to allow fixed width and horizontal scrolling
        maintainAspectRatio: false, // Allow height to be controlled by CSS
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Value'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Time'
                }
            }
        },
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false
            },
            legend: {
                display: true,
                position: 'top'
            }
        }
    }
});

// Function to fetch and update sensor data for the chart
async function fetchSensorData() {
    try {
        // Fetch more data points to enable horizontal scrolling
        const response = await fetch('backend.php?action=get_live_sensor_data');
        const data = await response.json();

        if (data.success && data.sensor_data) {
            const sortedData = data.sensor_data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            const labels = sortedData.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            const temperatures = sortedData.map(d => d.temperature);
            const humidities = sortedData.map(d => d.humidity);
            const weights = sortedData.map(d => d.weight); // Get weight data

            // Update Chart.js
            liveChart.data.labels = labels;
            liveChart.data.datasets[0].data = temperatures;
            liveChart.data.datasets[1].data = humidities;
            liveChart.data.datasets[2].data = weights; // Update weight dataset
            liveChart.update();

        } else {
            console.error('Failed to fetch sensor data:', data.message);
        }
    } catch (error) {
        console.error('Error fetching sensor data:', error);
    }
}

// Function to fetch and display beehives overview (now includes weight)
async function fetchBeehivesOverview() {
    try {
        const response = await fetch('backend.php?action=get_beehives_overview');
        const data = await response.json();
        const beehivesOverviewDiv = document.getElementById('beehivesOverview');
        beehivesOverviewDiv.innerHTML = ''; // Clear existing content

        if (data.success && data.hives_overview && data.hives_overview.length > 0) {
            data.hives_overview.forEach(hive => {
                const hiveCard = document.createElement('div');
                hiveCard.className = 'col-md-6 col-lg-4'; // Bootstrap columns for responsive grid
                hiveCard.innerHTML = `
                    <div class="hive-card">
                        <div class="hive-icon">🐝</div>
                        <div class="hive-details">
                            <h5>${htmlspecialchars(hive.hive_name || 'Unnamed Hive')}</h5>
                            <p><small>📍 ${htmlspecialchars(hive.location || 'Unknown Location')}</small></p>
                        </div>
                        <div class="sensor-data-row">
                            <div class="sensor-item temperature">
                                <span class="icon">🌡️</span>
                                Temp: <span class="sensor-value">${hive.temperature !== null ? htmlspecialchars(hive.temperature) + '°C' : 'N/A'}</span>
                            </div>
                            <div class="sensor-item humidity">
                                <span class="icon">💧</span>
                                Hum: <span class="sensor-value">${hive.humidity !== null ? htmlspecialchars(hive.humidity) + '%' : 'N/A'}</span>
                            </div>
                            <div class="sensor-item weight">
                                <span class="icon">⚖️</span>
                                Weight: <span class="sensor-value">${hive.weight !== null ? htmlspecialchars(hive.weight.toFixed(2)) + 'kg' : 'N/A'}</span>
                            </div>
                        </div>
                        <div class="last-updated">
                            <small>Last reading: ${hive.last_reading_at ? new Date(hive.last_reading_at).toLocaleString() : 'Never'}</small>
                        </div>
                    </div>
                `;
                beehivesOverviewDiv.appendChild(hiveCard);
            });
        } else {
            beehivesOverviewDiv.innerHTML = '<p class="text-center text-muted">No beehives registered yet. Please add a beehive to get started!</p>';
        }
    } catch (error) {
        console.error('Error fetching beehives overview:', error);
        document.getElementById('beehivesOverview').innerHTML = '<p class="text-center text-danger">Failed to load beehives overview.</p>';
    }
}

// Function to fetch and display alerts
async function fetchAlerts() {
    try {
        const response = await fetch('backend.php?action=get_alerts');
        const data = await response.json();
        const alertsListDiv = document.getElementById('alertsList');
        alertsListDiv.innerHTML = ''; // Clear existing content

        if (data.success && data.alerts && data.alerts.length > 0) {
            data.alerts.forEach(alert => {
                const alertItem = document.createElement('div');
                alertItem.className = `alert alert-${alert.alert_level === 'critical' ? 'danger' : 'warning'} p-2 mb-2`;
                alertItem.innerHTML = `
                    <strong>${alert.alert_level.toUpperCase()}!</strong> Hive ${alert.hive_name || alert.hive_id}: ${htmlspecialchars(alert.message)}
                    <small class="float-end text-muted">${new Date(alert.created_at).toLocaleString()}</small>
                `;
                alertsListDiv.appendChild(alertItem);
            });
        } else {
            alertsListDiv.innerHTML = '<p class="text-center text-muted">No recent alerts.</p>';
        }
    } catch (error) {
        console.error('Error fetching alerts:', error);
        document.getElementById('alertsList').innerHTML = '<p class="text-center text-danger">Failed to load alerts.</p>';
    }
}

// Function to fetch and populate officers for report modal
async function fetchOfficers() {
    try {
        const response = await fetch('backend.php?action=get_officers');
        const data = await response.json();
        const officerSelect = document.getElementById('officerSelect');
        officerSelect.innerHTML = '<option value="">Select an officer</option>'; // Reset options

        if (data.success && data.officers && data.officers.length > 0) {
            data.officers.forEach(officer => {
                const option = document.createElement('option');
                option.value = officer.id;
                option.textContent = `${officer.full_name} (${officer.email})`;
                officerSelect.appendChild(option);
            });
        } else {
            officerSelect.innerHTML = '<option value="">No officers found</option>';
        }
    } catch (error) {
        console.error('Error fetching officers:', error);
        document.getElementById('officerSelect').innerHTML = '<option value="">Error loading officers</option>';
    }
}

// Function to fetch and display sent reports
async function fetchSentReports() {
    try {
        const response = await fetch('backend.php?action=get_reports');
        const data = await response.json();
        const sentReportsListDiv = document.getElementById('sentReportsList');
        sentReportsListDiv.innerHTML = ''; // Clear existing content

        if (data.success && data.reports && data.reports.length > 0) {
            const table = document.createElement('table');
            table.className = 'table table-striped table-hover';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Officer</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');

            data.reports.forEach(report => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${htmlspecialchars(report.officer_name)} (${htmlspecialchars(report.officer_email)})</td>
                    <td>${htmlspecialchars(report.message.substring(0, 100))}...</td>
                    <td>${new Date(report.created_at).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-sm btn-info-custom view-report-btn me-1"
                            data-id="${report.id}"
                            data-officer="${htmlspecialchars(report.officer_name)} (${htmlspecialchars(report.officer_email)})"
                            data-date="${new Date(report.created_at).toLocaleString()}"
                            data-message="${htmlspecialchars(report.message)}">View</button>
                        <button class="btn btn-sm btn-danger delete-report-btn" data-id="${report.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            sentReportsListDiv.appendChild(table);

            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-report-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const reportId = event.target.dataset.id;
                    showDeleteConfirmModal('report', reportId); // Use generic modal
                });
            });

            // Add event listeners for view buttons
            document.querySelectorAll('.view-report-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const officer = event.target.dataset.officer;
                    const date = event.target.dataset.date;
                    const message = event.target.dataset.message;

                    document.getElementById('viewReportOfficer').textContent = officer;
                    document.getElementById('viewReportDate').textContent = date;
                    document.getElementById('viewReportMessage').textContent = message;

                    const viewModal = new bootstrap.Modal(document.getElementById('viewReportModal'));
                    viewModal.show();
                });
            });

        } else {
            sentReportsListDiv.innerHTML = '<p class="text-center text-muted">No reports sent yet.</p>';
        }
    } catch (error) {
        console.error('Error fetching sent reports:', error);
        document.getElementById('sentReportsList').innerHTML = '<p class="text-center text-danger">Failed to load sent reports.</p>';
    }
}

// Function to delete a report
async function deleteReport(reportId) {
    try {
        const response = await fetch(`backend.php?action=delete_report&id=${reportId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            showBootstrapAlert('success', data.message || 'Report deleted successfully.');
            fetchSentReports(); // Refresh the list
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to delete report.');
        }
    } catch (error) {
        console.error('Error deleting report:', error);
        showBootstrapAlert('danger', 'An error occurred while deleting the report.');
    }
}

// Function to fetch and display received recommendations
async function fetchReceivedRecommendations() {
    try {
        const response = await fetch('backend.php?action=get_recommendations');
        const data = await response.json();
        const receivedRecommendationsListDiv = document.getElementById('receivedRecommendationsList');
        receivedRecommendationsListDiv.innerHTML = ''; // Clear existing content

        if (data.success && data.recommendations && data.recommendations.length > 0) {
            const table = document.createElement('table');
            table.className = 'table table-striped table-hover';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Officer</th>
                        <th>Message</th>
                        <th>Related Sensor Data</th>
                        <th>Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');

            data.recommendations.forEach(rec => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${htmlspecialchars(rec.officer_name)} (${htmlspecialchars(rec.officer_email)})</td>
                    <td>${htmlspecialchars(rec.message.substring(0, 100))}...</td>
                    <td>Temp: ${rec.temperature !== null ? htmlspecialchars(rec.temperature) + '°C' : 'N/A'}, Hum: ${rec.humidity !== null ? htmlspecialchars(rec.humidity) + '%' : 'N/A'}, Weight: ${rec.weight !== null ? htmlspecialchars(rec.weight.toFixed(2)) + 'kg' : 'N/A'}</td>
                    <td>${new Date(rec.created_at).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-sm btn-info-custom view-recommendation-btn me-1"
                            data-id="${rec.id}"
                            data-officer="${htmlspecialchars(rec.officer_name)} (${htmlspecialchars(rec.officer_email)})"
                            data-date="${new Date(rec.created_at).toLocaleString()}"
                            data-message="${htmlspecialchars(rec.message)}"
                            data-temp="${htmlspecialchars(rec.temperature)}"
                            data-humidity="${htmlspecialchars(rec.humidity)}"
                            data-weight="${htmlspecialchars(rec.weight)}">View</button>
                        <button class="btn btn-sm btn-danger delete-recommendation-btn" data-id="${rec.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            receivedRecommendationsListDiv.appendChild(table);

            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-recommendation-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const recId = event.target.dataset.id;
                    showDeleteConfirmModal('recommendation', recId); // Use generic modal
                });
            });

            // Add event listeners for view buttons
            document.querySelectorAll('.view-recommendation-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const officer = event.target.dataset.officer;
                    const date = event.target.dataset.date;
                    const message = event.target.dataset.message;
                    const temp = event.target.dataset.temp;
                    const humidity = event.target.dataset.humidity;
                    const weight = event.target.dataset.weight;

                    document.getElementById('viewRecommendationOfficer').textContent = officer;
                    document.getElementById('viewRecommendationDate').textContent = date;
                    document.getElementById('viewRecommendationSensorData').textContent = `Temp: ${temp}°C, Hum: ${humidity}%, Weight: ${weight}kg`;
                    document.getElementById('viewRecommendationMessage').textContent = message;

                    const viewRecModal = new bootstrap.Modal(document.getElementById('viewRecommendationModal'));
                    viewRecModal.show();
                });
            });

        } else {
            receivedRecommendationsListDiv.innerHTML = '<p class="text-center text-muted">No recommendations received yet.</p>';
        }
    } catch (error) {
        console.error('Error fetching received recommendations:', error);
        document.getElementById('receivedRecommendationsList').innerHTML = '<p class="text-center text-danger">Failed to load recommendations.</p>';
    }
}

// NEW: Function to fetch and populate beehives for the sensor registration dropdown
async function fetchBeehivesForSensorRegistration() {
    try {
        const response = await fetch('backend.php?action=get_beehives_for_selection');
        const data = await response.json();
        const hiveSelect = document.getElementById('hiveSelect');
        hiveSelect.innerHTML = '<option value="">Select a beehive</option>'; // Reset options

        if (data.success && data.hives && data.hives.length > 0) {
            data.hives.forEach(hive => {
                const option = document.createElement('option');
                option.value = hive.id;
                option.textContent = htmlspecialchars(hive.hive_name);
                hiveSelect.appendChild(option);
            });
            hiveSelect.disabled = false; // Enable if hives are found
        } else {
            hiveSelect.innerHTML = '<option value="">No beehives found. Please add one first!</option>';
            hiveSelect.disabled = true; // Disable if no hives
        }
    } catch (error) {
        console.error('Error fetching beehives for sensor registration:', error);
        document.getElementById('hiveSelect').innerHTML = '<option value="">Error loading beehives</option>';
        document.getElementById('hiveSelect').disabled = true;
    }
}

// NEW: Function to fetch and display registered sensors
async function fetchRegisteredSensors() {
    try {
        const response = await fetch('backend.php?action=get_registered_sensors');
        const data = await await response.json();
        const registeredSensorsListDiv = document.getElementById('registeredSensorsList');
        registeredSensorsListDiv.innerHTML = ''; // Clear existing content

        if (data.success && data.sensors && data.sensors.length > 0) {
            const table = document.createElement('table');
            table.className = 'table table-striped table-hover';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Hive Name</th>
                        <th>Serial Number</th>
                        <th>Sensor Type</th>
                        <th>Registered On</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');

            data.sensors.forEach(sensor => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${htmlspecialchars(sensor.hive_name)} (${htmlspecialchars(sensor.location)})</td>
                    <td>${htmlspecialchars(sensor.serial_number)}</td>
                    <td>${htmlspecialchars(sensor.sensor_type)}</td>
                    <td>${new Date(sensor.created_at).toLocaleString()}</td>
                `;
                tbody.appendChild(tr);
            });
            registeredSensorsListDiv.appendChild(table);
        } else {
            registeredSensorsListDiv.innerHTML = '<p class="text-center text-muted">No sensors registered yet.</p>';
        }
    } catch (error) {
        console.error('Error fetching registered sensors:', error);
        document.getElementById('registeredSensorsList').innerHTML = '<p class="text-center text-danger">Failed to load registered sensors.</p>';
    }
}


// Generic Delete Confirmation Modal Handler
let deleteActionType = ''; // 'report' or 'recommendation'
let deleteItemId = null;

function showDeleteConfirmModal(type, itemId) {
    deleteActionType = type;
    deleteItemId = itemId;
    const modal = new bootstrap.Modal(document.getElementById('genericDeleteConfirmModal'));
    modal.show();
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    const modal = bootstrap.Modal.getInstance(document.getElementById('genericDeleteConfirmModal'));
    modal.hide(); // Hide the modal immediately

    if (deleteActionType === 'report') {
        await deleteReport(deleteItemId);
    } else if (deleteActionType === 'recommendation') {
        await deleteRecommendation(deleteItemId);
    }
});


// Event listeners and initial data loads
document.addEventListener('DOMContentLoaded', async function() {
    // Initial data fetches
    await fetchBeehivesOverview();
    await fetchSensorData();
    await fetchAlerts();
    await fetchSentReports();
    await fetchReceivedRecommendations();
    await fetchRegisteredSensors(); // NEW: Fetch registered sensors on load

    // Auto-refresh sensor data, alerts, and beehives overview every 10 seconds
    setInterval(fetchBeehivesOverview, 10000);
    setInterval(fetchSensorData, 10000);
    setInterval(fetchAlerts, 10000);
    setInterval(fetchRegisteredSensors, 10000); // NEW: Auto-refresh registered sensors

    // Populate officers dropdown when sendReportModal is shown
    const sendReportModal = document.getElementById('sendReportModal');
    sendReportModal.addEventListener('show.bs.modal', fetchOfficers);

    // Populate beehives dropdown when registerSensorModal is shown
    const registerSensorModal = document.getElementById('registerSensorModal');
    registerSensorModal.addEventListener('show.bs.modal', fetchBeehivesForSensorRegistration);

    // Handle Send Report Form submission
    document.getElementById('sendReportForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const officerId = document.getElementById('officerSelect').value;
        const message = document.getElementById('reportMessage').value;
        const reportFormMessageDiv = document.getElementById('reportFormMessage');

        reportFormMessageDiv.style.display = 'none';
        reportFormMessageDiv.className = 'alert mt-3'; // Reset classes

        if (!officerId || !message) {
            reportFormMessageDiv.classList.add('alert-danger');
            reportFormMessageDiv.textContent = 'Please select an officer and enter a message.';
            reportFormMessageDiv.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('backend.php?action=send_report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ officer_id: officerId, message: message })
            });
            const data = await response.json();

            if (data.success) {
                reportFormMessageDiv.classList.add('alert-success');
                reportFormMessageDiv.textContent = data.message || 'Report sent successfully!';
                reportFormMessageDiv.style.display = 'block';
                document.getElementById('sendReportForm').reset(); // Clear form
                fetchSentReports(); // Refresh sent reports list
                // Optionally close modal after success
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(sendReportModal);
                    modal.hide();
                }, 1500);
            } else {
                reportFormMessageDiv.classList.add('alert-danger');
                reportFormMessageDiv.textContent = data.message || 'Failed to send report.';
                reportFormMessageDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Error sending report:', error);
            reportFormMessageDiv.classList.add('alert-danger');
            reportFormMessageDiv.textContent = 'An unexpected error occurred while sending the report.';
            reportFormMessageDiv.style.display = 'block';
        }
    });

    // NEW: Handle Register Sensor Form submission
    document.getElementById('registerSensorForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const hiveId = document.getElementById('hiveSelect').value;
        const serialNumber = document.getElementById('sensorSerialNumber').value;
        const sensorType = document.getElementById('sensorType').value;
        const registerSensorFormMessageDiv = document.getElementById('registerSensorFormMessage');

        registerSensorFormMessageDiv.style.display = 'none';
        registerSensorFormMessageDiv.className = 'alert mt-3'; // Reset classes

        if (!hiveId || !serialNumber || !sensorType) {
            registerSensorFormMessageDiv.classList.add('alert-danger');
            registerSensorFormMessageDiv.textContent = 'Please fill all sensor registration fields.';
            registerSensorFormMessageDiv.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('backend.php?action=register_sensor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hive_id: hiveId, serial_number: serialNumber, sensor_type: sensorType })
            });
            const data = await response.json();

            if (data.success) {
                registerSensorFormMessageDiv.classList.add('alert-success');
                registerSensorFormMessageDiv.textContent = data.message || 'Sensor registered successfully!';
                registerSensorFormMessageDiv.style.display = 'block';
                document.getElementById('registerSensorForm').reset(); // Clear form
                fetchRegisteredSensors(); // Refresh registered sensors list
                // Optionally close modal after success
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(registerSensorModal);
                    modal.hide();
                }, 1500);
            } else {
                registerSensorFormMessageDiv.classList.add('alert-danger');
                registerSensorFormMessageDiv.textContent = data.message || 'Failed to register sensor.';
                registerSensorFormMessageDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Error registering sensor:', error);
            registerSensorFormMessageDiv.classList.add('alert-danger');
            registerSensorFormMessageDiv.textContent = 'An unexpected error occurred while registering the sensor.';
            registerSensorFormMessageDiv.style.display = 'block';
        }
    });
});
