// Map to store Chart.js instances for beehives, keyed by hive ID
const hiveCharts = new Map();
// NEW: Map to store Chart.js instances for sensors, keyed by sensor ID
const sensorCharts = new Map();

// Function to initialize a new Chart.js instance for a specific canvas ELEMENT
function initializeChart(canvasElement, chartTitle = 'Sensor Data Trend') {
    // Ensure the canvasElement is valid before proceeding
    if (!canvasElement) {
        console.error("Canvas element not provided or is null for chart initialization.");
        return null; // Return null if the element is invalid
    }
    const ctx = canvasElement.getContext('2d');
    const newChart = new Chart(ctx, {
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
            responsive: true, // Make charts responsive within their containers
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
                },
                title: { // Add chart title
                    display: true,
                    text: chartTitle
                }
            }
        }
    });
    return newChart;
}

// Function to fetch and update sensor data for a specific hive's chart
async function fetchHiveSensorData(hiveId) {
    try {
        // Fetch data for the specific hive from the local backend
        const response = await fetch(`backend.php?action=get_live_sensor_data&hive_id=${hiveId}`);
        const data = await response.json();
        
        const chart = hiveCharts.get(hiveId); // Get the specific chart instance

        if (chart && data.success && data.sensor_data) {
            const sensorData = data.sensor_data;
            const sortedData = sensorData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            const labels = sortedData.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            const temperatures = sortedData.map(d => d.temperature);
            const humidities = sortedData.map(d => d.humidity);
            const weights = sortedData.map(d => d.weight);

            chart.data.labels = labels;
            chart.data.datasets[0].data = temperatures;
            chart.data.datasets[1].data = humidities;
            chart.data.datasets[2].data = weights;
            chart.update();
        } else if (chart) {
            // If no data or fetch failed, clear the chart
            console.warn(`No sensor data available for Hive ${hiveId} or failed to fetch.`);
            chart.data.labels = [];
            chart.data.datasets[0].data = [];
            chart.data.datasets[1].data = [];
            chart.data.datasets[2].data = [];
            chart.update();
        }
    } catch (error) {
        console.error(`Error fetching sensor data for Hive ${hiveId}:`, error);
        const chart = hiveCharts.get(hiveId);
        if (chart) {
            // Clear chart on error
            chart.data.labels = [];
            chart.data.datasets[0].data = [];
            chart.data.datasets[1].data = [];
            chart.data.datasets[2].data = [];
            chart.update();
        }
    }
}

// NEW: Function to fetch and update sensor data for a specific SENSOR's chart
async function fetchSensorDataBySensorId(sensorId) {
    try {
        const response = await fetch(`backend.php?action=get_sensor_data_by_sensor_id&sensor_id=${sensorId}`);
        const data = await response.json();

        const chart = sensorCharts.get(sensorId); // Get the specific sensor chart instance

        if (chart && data.success && data.sensor_data) {
            const sensorData = data.sensor_data;
            const sortedData = sensorData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            const labels = sortedData.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            const temperatures = sortedData.map(d => d.temperature);
            const humidities = sortedData.map(d => d.humidity);
            const weights = sortedData.map(d => d.weight);

            chart.data.labels = labels;
            chart.data.datasets[0].data = temperatures;
            chart.data.datasets[1].data = humidities;
            chart.data.datasets[2].data = weights;
            chart.update();
        } else if (chart) {
            console.warn(`No sensor data available for Sensor ${sensorId} or failed to fetch.`);
            chart.data.labels = [];
            chart.data.datasets[0].data = [];
            chart.data.datasets[1].data = [];
            chart.data.datasets[2].data = [];
            chart.update();
        }
    } catch (error) {
        console.error(`Error fetching sensor data for Sensor ${sensorId}:`, error);
        const chart = sensorCharts.get(sensorId);
        if (chart) {
            chart.data.labels = [];
            chart.data.datasets[0].data = [];
            chart.data.datasets[1].data = [];
            chart.data.datasets[2].data = [];
            chart.update();
        }
    }
}


// Function to fetch and display beehives overview 
async function fetchBeehivesOverview() {
    try {
        const response = await fetch('backend.php?action=get_beehives_overview');
        const data = await response.json();
        const beehivesOverviewDiv = document.getElementById('beehivesOverview');
        
        // Use a temporary set to track hives that are currently in the fetched data
        const fetchedHiveIds = new Set();

        if (data.success && data.hives_overview && data.hives_overview.length > 0) {
            for (const hive of data.hives_overview) {
                fetchedHiveIds.add(hive.hive_id);
                let hiveCardElement = document.getElementById(`hive-card-${hive.hive_id}`);

                if (!hiveCardElement) {
                    // Create new card if it doesn't exist
                    hiveCardElement = document.createElement('div');
                    hiveCardElement.className = 'col-md-6 col-lg-4 mb-4';
                    hiveCardElement.id = `hive-card-${hive.hive_id}`; // Assign an ID for easy lookup
                    hiveCardElement.innerHTML = `
                        <div class="hive-card card h-100">
                            <div class="card-body">
                                <h5 class="card-title">🐝 <span id="hive-name-${hive.hive_id}">${htmlspecialchars(hive.hive_name || 'Unnamed Hive')}</span></h5>
                                <p class="card-subtitle mb-2 text-muted">📍 <span id="hive-location-${hive.hive_id}">${htmlspecialchars(hive.location || 'Unknown Location')}</span></p>
                                <hr>
                                <div class="sensor-data-row mb-3">
                                    <div class="sensor-item temperature">
                                        <span class="icon">🌡️</span>
                                        Temp: <span class="sensor-value" id="hive-temp-${hive.hive_id}">${hive.temperature !== null ? htmlspecialchars(hive.temperature) + '°C' : 'N/A'}</span>
                                    </div>
                                    <div class="sensor-item humidity">
                                        <span class="icon">💧</span>
                                        Hum: <span class="sensor-value" id="hive-humidity-${hive.hive_id}">${hive.humidity !== null ? htmlspecialchars(hive.humidity) + '%' : 'N/A'}</span>
                                    </div>
                                    <div class="sensor-item weight">
                                        <span class="icon">⚖️</span>
                                        Weight: <span class="sensor-value" id="hive-weight-${hive.hive_id}">${hive.weight !== null ? htmlspecialchars(hive.weight.toFixed(2)) + 'kg' : 'N/A'}</span>
                                    </div>
                                </div>
                                <div class="last-updated mb-3">
                                    <small>Last reading: <span id="hive-last-reading-${hive.hive_id}">${hive.last_reading_at ? new Date(hive.last_reading_at).toLocaleString() : 'Never'}</span></small>
                                </div>
                                
                                <h6 class="mt-3 mb-2">📈 Trend for <span id="hive-chart-title-${hive.hive_id}">${htmlspecialchars(hive.hive_name)}</span></h6>
                                <div class="chart-container-wrapper" style="height: 350px;"> <!-- Increased height for hive charts -->
                                    <canvas id="hiveChart-${hive.hive_id}"></canvas>
                                </div>
                            </div>
                            <div class="card-footer text-end">
                                <button class="btn btn-sm btn-info-custom edit-beehive-btn me-1"
                                    data-id="${hive.hive_id}"
                                    data-name="${htmlspecialchars(hive.hive_name)}"
                                    data-location="${htmlspecialchars(hive.location)}">Edit</button>
                                <button class="btn btn-sm btn-danger delete-beehive-btn" data-id="${hive.hive_id}">Delete</button>
                            </div>
                        </div>
                    `;
                    beehivesOverviewDiv.appendChild(hiveCardElement);

                    const canvasElement = document.getElementById(`hiveChart-${hive.hive_id}`);
                    const chart = initializeChart(canvasElement, `Hive ${htmlspecialchars(hive.hive_name)} Trends`);
                    if (chart) {
                        hiveCharts.set(hive.hive_id, chart);
                    }
                } else {
                    // Update existing card's data
                    document.getElementById(`hive-name-${hive.hive_id}`).textContent = htmlspecialchars(hive.hive_name || 'Unnamed Hive');
                    document.getElementById(`hive-location-${hive.hive_id}`).textContent = htmlspecialchars(hive.location || 'Unknown Location');
                    document.getElementById(`hive-temp-${hive.hive_id}`).textContent = hive.temperature !== null ? htmlspecialchars(hive.temperature) + '°C' : 'N/A';
                    document.getElementById(`hive-humidity-${hive.hive_id}`).textContent = hive.humidity !== null ? htmlspecialchars(hive.humidity) + '%' : 'N/A';
                    document.getElementById(`hive-weight-${hive.hive_id}`).textContent = hive.weight !== null ? htmlspecialchars(hive.weight.toFixed(2)) + 'kg' : 'N/A';
                    document.getElementById(`hive-last-reading-${hive.hive_id}`).textContent = hive.last_reading_at ? new Date(hive.last_reading_at).toLocaleString() : 'Never';
                    document.getElementById(`hive-chart-title-${hive.hive_id}`).textContent = htmlspecialchars(hive.hive_name);
                }
                
                // Always fetch data for the chart, whether new or existing
                fetchHiveSensorData(hive.hive_id);
            }

            // Remove cards for hives that are no longer in the fetched data
            for (const [hiveId, chartInstance] of hiveCharts.entries()) {
                if (!fetchedHiveIds.has(hiveId)) {
                    chartInstance.destroy();
                    hiveCharts.delete(hiveId);
                    const hiveCardToRemove = document.getElementById(`hive-card-${hiveId}`);
                    if (hiveCardToRemove) {
                        hiveCardToRemove.remove();
                        console.log(`Removed card and destroyed chart for deleted hive: ${hiveId}`);
                    }
                }
            }

            // Re-add event listeners for all current buttons (newly created or existing)
            document.querySelectorAll('.edit-beehive-btn').forEach(button => {
                button.onclick = (event) => { // Use onclick for simplicity or removeEventListener if using addEventListener
                    const hiveId = event.target.dataset.id;
                    const hiveName = event.target.dataset.name;
                    const hiveLocation = event.target.dataset.location;
                    showEditBeehiveModal(hiveId, hiveName, hiveLocation);
                };
            });

            document.querySelectorAll('.delete-beehive-btn').forEach(button => {
                button.onclick = (event) => {
                    const hiveId = event.target.dataset.id;
                    showDeleteConfirmModal('beehive', hiveId);
                };
            });

        } else {
            beehivesOverviewDiv.innerHTML = '<p class="text-center text-muted">No beehives registered yet. Click "Add New Beehive" to get started!</p>';
            // If no hives, destroy all existing charts
            for (const [hiveId, chartInstance] of hiveCharts.entries()) {
                chartInstance.destroy();
                hiveCharts.delete(hiveId);
            }
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
                alertItem.className = `alert alert-${alert.alert_level === 'critical' ? 'danger' : 'warning'} p-2 mb-2 clickable-alert`; // Added clickable-alert class
                
                // Store data attributes for easy access when clicked
                alertItem.dataset.hiveName = htmlspecialchars(alert.hive_name || alert.hive_id);
                alertItem.dataset.alertLevel = htmlspecialchars(alert.alert_level);
                alertItem.dataset.createdAt = htmlspecialchars(alert.created_at);
                alertItem.dataset.message = htmlspecialchars(alert.message);

                alertItem.innerHTML = `
                    <strong>${alert.alert_level.toUpperCase()}!</strong> Hive ${htmlspecialchars(alert.hive_name || alert.hive_id)}: ${htmlspecialchars(alert.message.substring(0, 70))}...
                    <small class="float-end text-muted">${new Date(alert.created_at).toLocaleString()}</small>
                `;
                alertsListDiv.appendChild(alertItem);

                // Add event listener to show modal on click
                alertItem.addEventListener('click', () => {
                    showViewAlertModal({
                        hive_name: alertItem.dataset.hiveName,
                        alert_level: alertItem.dataset.alertLevel,
                        created_at: alertItem.dataset.createdAt,
                        message: alertItem.dataset.message
                    });
                });
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
        const editReportOfficerSelect = document.getElementById('editReportOfficerSelect'); 
        
        officerSelect.innerHTML = '<option value="">Select an officer</option>'; 
        editReportOfficerSelect.innerHTML = '<option value="">Select an officer</option>'; 

        if (data.success && data.officers && data.officers.length > 0) {
            data.officers.forEach(officer => {
                const option = document.createElement('option');
                option.value = officer.id;
                option.textContent = `${officer.full_name} (${officer.email})`;
                officerSelect.appendChild(option);

                const editOption = option.cloneNode(true); 
                editReportOfficerSelect.appendChild(editOption);
            });
        } else {
            officerSelect.innerHTML = '<option value="">No officers found</option>';
            editReportOfficerSelect.innerHTML = '<option value="">No officers found</option>';
        }
    } catch (error) {
        console.error('Error fetching officers:', error);
        document.getElementById('officerSelect').innerHTML = '<p class="text-danger">Error loading officers</p>'; // Changed to p tag
        document.getElementById('editReportOfficerSelect').innerHTML = '<p class="text-danger">Error loading officers</p>'; // Changed to p tag
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
                        <button class="btn btn-sm btn-primary-custom edit-report-btn me-1"
                            data-id="${report.id}"
                            data-officer-id="${report.officer_id}"
                            data-message="${htmlspecialchars(report.message)}">Edit</button>
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

            // NEW: Add event listeners for edit buttons
            document.querySelectorAll('.edit-report-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const reportId = event.target.dataset.id;
                    const officerId = event.target.dataset.officerId;
                    const message = event.target.dataset.message;
                    showEditReportModal(reportId, officerId, message);
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

// Function to fetch and populate beehives for the sensor registration dropdown
async function fetchBeehivesForSensorRegistration() {
    try {
        const response = await fetch('backend.php?action=get_beehives_for_selection');
        const data = await response.json();
        const hiveSelect = document.getElementById('hiveSelect');
        const editSensorHiveSelect = document.getElementById('editSensorHiveSelect'); 
        
        hiveSelect.innerHTML = '<option value="">Select a beehive</option>'; 
        editSensorHiveSelect.innerHTML = '<option value="">Select a beehive</option>'; 

        if (data.success && data.hives && data.hives.length > 0) {
            data.hives.forEach(hive => {
                const option = document.createElement('option');
                option.value = hive.id;
                option.textContent = htmlspecialchars(hive.hive_name);
                hiveSelect.appendChild(option);

                const editOption = option.cloneNode(true); 
                editSensorHiveSelect.appendChild(editOption);
            });
            hiveSelect.disabled = false; 
            editSensorHiveSelect.disabled = false; 
        } else {
            hiveSelect.innerHTML = '<option value="">No beehives found. Please add one first!</option>';
            hiveSelect.disabled = true; 
            editSensorHiveSelect.innerHTML = '<option value="">No beehives found.</option>';
            editSensorHiveSelect.disabled = true;
        }
    } catch (error) {
        console.error('Error fetching beehives for sensor registration:', error);
        document.getElementById('hiveSelect').innerHTML = '<p class="text-danger">Error loading beehives</p>'; // Changed to p tag
        document.getElementById('hiveSelect').disabled = true;
        document.getElementById('editSensorHiveSelect').innerHTML = '<p class="text-danger">Error loading beehives</p>'; // Changed to p tag
        document.getElementById('editSensorHiveSelect').disabled = true;
    }
}

// Function to fetch and display registered sensors
async function fetchRegisteredSensors() {
    try {
        const response = await fetch('backend.php?action=get_registered_sensors');
        const data = await response.json(); 
        const registeredSensorsListDiv = document.getElementById('registeredSensorsList');

        // Use a temporary map to track current sensor elements and their charts
        const fetchedSensorIds = new Set();
        const existingTable = registeredSensorsListDiv.querySelector('table');
        let tbody;

        if (data.success && data.sensors && data.sensors.length > 0) {
            if (!existingTable) {
                // Create table if it doesn't exist
                const table = document.createElement('table');
                table.className = 'table table-striped table-hover';
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Hive Name</th>
                            <th>Serial Number</th>
                            <th>Sensor Type</th>
                            <th>Registered On</th>
                            <th>Actions</th> 
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                registeredSensorsListDiv.innerHTML = ''; // Clear previous "Loading..." or "No sensors" message
                registeredSensorsListDiv.appendChild(table);
                tbody = table.querySelector('tbody');
            } else {
                tbody = existingTable.querySelector('tbody');
            }
            
            // Collect IDs of currently displayed sensors for comparison later
            const currentlyDisplayedSensorIds = new Set(Array.from(tbody.querySelectorAll('tr[data-sensor-id]')).map(row => parseInt(row.dataset.sensorId)));

            for (const sensor of data.sensors) {
                fetchedSensorIds.add(sensor.id);
                let sensorRow = tbody.querySelector(`tr[data-sensor-id="${sensor.id}"]`);
                let chartRow = tbody.querySelector(`tr[data-sensor-chart-id="${sensor.id}"]`);

                if (!sensorRow) {
                    // Create new sensor row and chart row if they don't exist
                    sensorRow = document.createElement('tr');
                    sensorRow.dataset.sensorId = sensor.id; // Mark row with sensor ID
                    sensorRow.innerHTML = `
                        <td>${htmlspecialchars(sensor.hive_name)} (${htmlspecialchars(sensor.location)})</td>
                        <td>${htmlspecialchars(sensor.serial_number)}</td>
                        <td>${htmlspecialchars(sensor.sensor_type)}</td>
                        <td>${new Date(sensor.created_at).toLocaleString()}</td>
                        <td>
                            <button class="btn btn-sm btn-info-custom edit-sensor-btn me-1"
                                data-id="${sensor.id}"
                                data-hive-id="${sensor.hive_id_fk}"
                                data-serial-number="${htmlspecialchars(sensor.serial_number)}"
                                data-sensor-type="${htmlspecialchars(sensor.sensor_type)}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-sensor-btn" data-id="${sensor.id}">Delete</button>
                        </td>
                    `;
                    tbody.appendChild(sensorRow);

                    chartRow = document.createElement('tr');
                    chartRow.dataset.sensorChartId = sensor.id; // Mark chart row with sensor ID
                    chartRow.innerHTML = `
                        <td colspan="5">
                            <div class="card p-2 mb-2">
                                <h6 class="mb-2">📈 Trend for Sensor ${htmlspecialchars(sensor.serial_number)}</h6>
                                <div class="chart-container-wrapper" style="height: 350px;"> <!-- Increased height for sensor charts -->
                                    <canvas id="sensorChart-${sensor.id}"></canvas>
                                </div>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(chartRow);

                    const canvasElement = document.getElementById(`sensorChart-${sensor.id}`);
                    const chart = initializeChart(canvasElement, `Sensor ${htmlspecialchars(sensor.serial_number)} Trends`);
                    if (chart) {
                        sensorCharts.set(sensor.id, chart);
                    }
                } else {
                    // Update existing sensor row content
                    sensorRow.querySelector('td:nth-child(1)').textContent = `${htmlspecialchars(sensor.hive_name)} (${htmlspecialchars(sensor.location)})`;
                    sensorRow.querySelector('td:nth-child(2)').textContent = htmlspecialchars(sensor.serial_number);
                    sensorRow.querySelector('td:nth-child(3)').textContent = htmlspecialchars(sensor.sensor_type);
                    sensorRow.querySelector('td:nth-child(4)').textContent = new Date(sensor.created_at).toLocaleString();
                    // Update data attributes for edit button
                    const editButton = sensorRow.querySelector('.edit-sensor-btn');
                    if (editButton) {
                        editButton.dataset.name = htmlspecialchars(sensor.hive_name); // This was missing
                        editButton.dataset.location = htmlspecialchars(sensor.location); // This was missing
                        editButton.dataset.hiveId = sensor.hive_id_fk;
                        editButton.dataset.serialNumber = htmlspecialchars(sensor.serial_number);
                        editButton.dataset.sensorType = htmlspecialchars(sensor.sensor_type);
                    }
                    const deleteButton = sensorRow.querySelector('.delete-sensor-btn');
                    if (deleteButton) {
                        deleteButton.dataset.id = sensor.id;
                    }

                    // Update chart title if it exists
                    const chartTitleElement = chartRow.querySelector('h6');
                    if (chartTitleElement) {
                        chartTitleElement.textContent = `📈 Trend for Sensor ${htmlspecialchars(sensor.serial_number)}`;
                    }
                }
                
                // Always fetch data for the chart, whether new or existing
                fetchSensorDataBySensorId(sensor.id);
            }

            // Remove rows (and destroy charts) for sensors that are no longer in the fetched data
            for (const sensorId of currentlyDisplayedSensorIds) {
                if (!fetchedSensorIds.has(sensorId)) {
                    const chartInstance = sensorCharts.get(sensorId);
                    if (chartInstance) {
                        chartInstance.destroy();
                        sensorCharts.delete(sensorId);
                        console.log(`Destroyed chart for deleted sensor: ${sensorId}`);
                    }
                    const sensorRowToRemove = tbody.querySelector(`tr[data-sensor-id="${sensorId}"]`);
                    const chartRowToRemove = tbody.querySelector(`tr[data-sensor-chart-id="${sensorId}"]`);
                    if (sensorRowToRemove) sensorRowToRemove.remove();
                    if (chartRowToRemove) chartRowToRemove.remove();
                    console.log(`Removed rows for deleted sensor: ${sensorId}`);
                }
            }

            // Re-add event listeners for all current buttons (newly created or existing)
            document.querySelectorAll('.edit-sensor-btn').forEach(button => {
                button.onclick = (event) => {
                    const sensorId = event.target.dataset.id;
                    const hiveId = event.target.dataset.hiveId;
                    const serialNumber = event.target.dataset.serialNumber;
                    const sensorType = event.target.dataset.sensorType;
                    showEditSensorModal(sensorId, hiveId, serialNumber, sensorType);
                };
            });

            document.querySelectorAll('.delete-sensor-btn').forEach(button => {
                button.onclick = (event) => {
                    const sensorId = event.target.dataset.id;
                    showDeleteConfirmModal('sensor', sensorId);
                };
            });

        } else {
            registeredSensorsListDiv.innerHTML = '<p class="text-center text-muted">No sensors registered yet.</p>';
            // If no sensors, destroy all existing sensor charts
            for (const [sensorId, chartInstance] of sensorCharts.entries()) {
                chartInstance.destroy();
                sensorCharts.delete(sensorId);
            }
        }
    } catch (error) {
        console.error('Error fetching registered sensors:', error);
        registeredSensorsListDiv.innerHTML = '<p class="text-center text-danger">Failed to load registered sensors.</p>';
    }
}

// Function to add a beehive
async function addBeehive(hiveName, location) {
    try {
        const response = await fetch('backend.php?action=add_beehive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hive_name: hiveName, location: location })
        });
        const data = await response.json();
        if (data.success) {
            showBootstrapAlert('success', data.message || 'Beehive added successfully.');
            fetchBeehivesOverview(); // Refresh the list (and hive charts)
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to add beehive.');
        }
    } catch (error) {
        console.error('Error adding beehive:', error);
        showBootstrapAlert('danger', 'An error occurred while adding the beehive.');
    }
}

// Function to update a beehive
async function updateBeehive(hiveId, hiveName, location) {
    try {
        const response = await fetch('backend.php?action=update_beehive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hive_id: hiveId, hive_name: hiveName, location: location })
        });
        const data = await response.json();
        if (data.success) {
            showBootstrapAlert('success', data.message || 'Beehive updated successfully.');
            fetchBeehivesOverview(); // Refresh the list (and hive charts)
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to update beehive.');
        }
    } catch (error) {
        console.error('Error updating beehive:', error);
        showBootstrapAlert('danger', 'An error occurred while updating the beehive.');
    }
}

// Function to delete a beehive
async function deleteBeehive(hiveId) {
    try {
        const response = await fetch(`backend.php?action=delete_beehive&id=${hiveId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            showBootstrapAlert('success', data.message || 'Beehive deleted successfully.');
            fetchBeehivesOverview(); // Refresh the list (and hive charts)
            fetchBeehivesForSensorRegistration(); // Also refresh hive dropdowns
            fetchRegisteredSensors(); // Refresh sensors as well, in case a sensor's hive was deleted
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to delete beehive.');
        }
    } catch (error) {
        console.error('Error deleting beehive:', error);
        showBootstrapAlert('danger', 'An error occurred while deleting the beehive.');
    }
}

// Function to update a sensor
async function updateSensor(sensorId, hiveId, serialNumber, sensorType) {
    try {
        const response = await fetch('backend.php?action=update_sensor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sensor_id: sensorId,
                hive_id: hiveId,
                serial_number: serialNumber,
                sensor_type: sensorType
            })
        });
        const data = await response.json();
        if (data.success) {
            showBootstrapAlert('success', data.message || 'Sensor updated successfully.');
            fetchRegisteredSensors(); // Refresh the list (and sensor charts)
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to update sensor.');
        }
    } catch (error) {
        console.error('Error updating sensor:', error);
        showBootstrapAlert('danger', 'An error occurred while updating the sensor.');
    }
}

// Function to delete a sensor
async function deleteSensor(sensorId) {
    try {
        const response = await fetch(`backend.php?action=delete_sensor&id=${sensorId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            showBootstrapAlert('success', data.message || 'Sensor deleted successfully.');
            fetchRegisteredSensors(); // Refresh the list (and sensor charts)
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to delete sensor.');
        }
    } catch (error) {
        console.error('Error deleting sensor:', error);
        showBootstrapAlert('danger', 'An error occurred while deleting the sensor.');
    }
}

// Function to update a report
async function updateReport(reportId, officerId, message) {
    try {
        const response = await fetch('backend.php?action=update_report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                report_id: reportId,
                officer_id: officerId,
                message: message
            })
        });
        const data = await response.json();
        if (data.success) {
            showBootstrapAlert('success', data.message || 'Report updated successfully.');
            fetchSentReports(); // Refresh the list
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to update report.');
        }
    } catch (error) {
        console.error('Error updating report:', error);
        showBootstrapAlert('danger', 'An error occurred while updating the report.');
    }
}


// Generic Delete Confirmation Modal Handler
let deleteActionType = ''; // 'report', 'recommendation', 'beehive', 'sensor'
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
    } else if (deleteActionType === 'beehive') {
        await deleteBeehive(deleteItemId);
    } else if (deleteActionType === 'sensor') { // Handle sensor deletion
        await deleteSensor(deleteItemId);
    }
    deleteItemId = null; // Reset for next use
});

// Function to show Edit Beehive Modal and populate fields
function showEditBeehiveModal(hiveId, hiveName, hiveLocation) {
    document.getElementById('editHiveId').value = hiveId;
    document.getElementById('editHiveName').value = hiveName;
    document.getElementById('editHiveLocation').value = hiveLocation;
    document.getElementById('editBeehiveFormMessage').style.display = 'none'; // Hide any previous message
    const editBeehiveModal = new bootstrap.Modal(document.getElementById('editBeehiveModal'));
    editBeehiveModal.show();
}

// Function to show Edit Sensor Modal and populate fields
async function showEditSensorModal(sensorId, hiveId, serialNumber, sensorType) {
    document.getElementById('editSensorId').value = sensorId;
    document.getElementById('editSensorSerialNumber').value = serialNumber;
    document.getElementById('editSensorType').value = sensorType;

    // Populate the beehive dropdown for the edit modal
    await fetchBeehivesForSensorRegistration(); // This will populate both hiveSelect and editSensorHiveSelect

    // Set the selected hive in the edit modal dropdown
    document.getElementById('editSensorHiveSelect').value = hiveId;

    document.getElementById('editSensorFormMessage').style.display = 'none'; // Hide any previous message
    const editSensorModal = new bootstrap.Modal(document.getElementById('editSensorModal'));
    editSensorModal.show();
}

// Function to show Edit Report Modal and populate fields
async function showEditReportModal(reportId, officerId, message) {
    document.getElementById('editReportId').value = reportId;
    document.getElementById('editReportMessage').value = message;

    // Populate the officer dropdown for the edit report modal
    await fetchOfficers(); // This will populate both officerSelect and editReportOfficerSelect

    // Set the selected officer in the edit modal dropdown
    document.getElementById('editReportOfficerSelect').value = officerId;

    document.getElementById('editReportFormMessage').style.display = 'none'; // Hide any previous message
    const editReportModal = new bootstrap.Modal(document.getElementById('editReportModal'));
    editReportModal.show();
}

// NEW: Function to show Alert Details Modal
function showViewAlertModal(alertData) {
    document.getElementById('viewAlertHiveName').textContent = alertData.hive_name;
    document.getElementById('viewAlertLevel').textContent = alertData.alert_level.toUpperCase();
    document.getElementById('viewAlertDateTime').textContent = new Date(alertData.created_at).toLocaleString();
    
    const viewAlertMessageDiv = document.getElementById('viewAlertMessage');
    viewAlertMessageDiv.textContent = alertData.message;
    // Set alert class based on level
    viewAlertMessageDiv.className = `alert mt-3 alert-${alertData.alert_level === 'critical' ? 'danger' : 'warning'}`;
    
    const viewAlertModal = new bootstrap.Modal(document.getElementById('viewAlertModal'));
    viewAlertModal.show();
}


// Event listeners and initial data loads
document.addEventListener('DOMContentLoaded', async function() {
    // Initial data fetches
    await fetchBeehivesOverview(); // This will now also initialize and fetch data for each hive's chart
    await fetchAlerts();
    await fetchSentReports();
    await fetchReceivedRecommendations();
    await fetchRegisteredSensors(); // This will now also initialize and fetch data for each sensor's chart

    // Auto-refresh data
    // Instead of re-fetching everything which can cause flicker,
    // we'll trigger updates for existing charts.
    setInterval(async () => {
        // Update hive charts
        for (const hiveId of hiveCharts.keys()) {
            await fetchHiveSensorData(hiveId);
        }
        // Update sensor charts
        for (const sensorId of sensorCharts.keys()) {
            await fetchSensorDataBySensorId(sensorId);
        }
        // Also refresh other lists that don't have charts
        fetchAlerts();
        fetchRegisteredSensors(); // This will handle adding/removing sensors and re-initializing their charts
        fetchSentReports();
    }, 10000); // Every 10 seconds

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
                showBootstrapAlert('danger', data.message || 'Failed to send report.'); // Show general alert
            }
        } catch (error) {
            console.error('Error sending report:', error);
            reportFormMessageDiv.classList.add('alert-danger');
            reportFormMessageDiv.textContent = 'An unexpected error occurred while sending the report.';
            reportFormMessageDiv.style.display = 'block';
            showBootstrapAlert('danger', 'An unexpected error occurred while sending the report.'); // Show general alert
        }
    });

    // Handle Register Sensor Form submission
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
                fetchRegisteredSensors(); // Refresh registered sensors list (and sensor charts)
                // Optionally close modal after success
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(registerSensorModal);
                    modal.hide();
                }, 1500);
            } else {
                registerSensorFormMessageDiv.classList.add('alert-danger');
                registerSensorFormMessageDiv.textContent = data.message || 'Failed to register sensor.';
                registerSensorFormMessageDiv.style.display = 'block';
                showBootstrapAlert('danger', data.message || 'Failed to register sensor.'); // Show general alert
            }
        } catch (error) {
            console.error('Error registering sensor:', error);
            registerSensorFormMessageDiv.classList.add('alert-danger');
            registerSensorFormMessageDiv.textContent = 'An unexpected error occurred while registering the sensor.';
            registerSensorFormMessageDiv.style.display = 'block';
            showBootstrapAlert('danger', 'An unexpected error occurred while registering the sensor.'); // Show general alert
        }
    });

    // Handle Add Beehive Form submission
    document.getElementById('addBeehiveForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const hiveName = document.getElementById('newHiveName').value;
        const location = document.getElementById('newHiveLocation').value;
        const addBeehiveFormMessageDiv = document.getElementById('addBeehiveFormMessage');

        addBeehiveFormMessageDiv.style.display = 'none';
        addBeehiveFormMessageDiv.className = 'alert mt-3'; // Reset classes

        if (!hiveName || !location) {
            addBeehiveFormMessageDiv.classList.add('alert-danger');
            addBeehiveFormMessageDiv.textContent = 'Please fill all beehive fields.';
            addBeehiveFormMessageDiv.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('backend.php?action=add_beehive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hive_name: hiveName, location: location })
            });
            const data = await response.json();

            if (data.success) {
                addBeehiveFormMessageDiv.classList.add('alert-success');
                addBeehiveFormMessageDiv.textContent = data.message || 'Beehive added successfully!';
                addBeehiveFormMessageDiv.style.display = 'block';
                document.getElementById('addBeehiveForm').reset(); // Clear form
                fetchBeehivesOverview(); // Refresh beehives list (which also refreshes charts)
                fetchBeehivesForSensorRegistration(); // Also refresh hive dropdowns in sensor modals
                // Optionally close modal after success
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addBeehiveModal'));
                    modal.hide();
                }, 1500);
            } else {
                addBeehiveFormMessageDiv.classList.add('alert-danger');
                addBeehiveFormMessageDiv.textContent = data.message || 'Failed to add beehive.';
                addBeehiveFormMessageDiv.style.display = 'block';
                showBootstrapAlert('danger', data.message || 'Failed to add beehive.'); // Show general alert
            }
        } catch (error) {
            console.error('Error adding beehive:', error);
            addBeehiveFormMessageDiv.classList.add('alert-danger');
            addBeehiveFormMessageDiv.textContent = 'An unexpected error occurred while adding the beehive.';
            addBeehiveFormMessageDiv.style.display = 'block';
            showBootstrapAlert('danger', 'An unexpected error occurred while adding the beehive.'); // Show general alert
        }
    });

    // Handle Edit Beehive Form submission
    document.getElementById('editBeehiveForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const hiveId = document.getElementById('editHiveId').value;
        const hiveName = document.getElementById('editHiveName').value;
        const location = document.getElementById('editHiveLocation').value;
        const editBeehiveFormMessageDiv = document.getElementById('editBeehiveFormMessage');

        editBeehiveFormMessageDiv.style.display = 'none';
        editBeehiveFormMessageDiv.className = 'alert mt-3'; // Reset classes

        if (!hiveId || !hiveName || !location) {
            editBeehiveFormMessageDiv.classList.add('alert-danger');
            editBeehiveFormMessageDiv.textContent = 'All fields are required for editing.';
            editBeehiveFormMessageDiv.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('backend.php?action=update_beehive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hive_id: hiveId, hive_name: hiveName, location: location })
            });
            const data = await response.json();

            if (data.success) {
                editBeehiveFormMessageDiv.classList.add('alert-success');
                editBeehiveFormMessageDiv.textContent = data.message || 'Beehive updated successfully!';
                editBeehiveFormMessageDiv.style.display = 'block';
                fetchBeehivesOverview(); // Refresh beehives list (which also refreshes charts)
                fetchBeehivesForSensorRegistration(); // Also refresh hive dropdowns in sensor modals
                // Optionally close modal after success
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editBeehiveModal'));
                    modal.hide();
                }, 1500);
            } else {
                editBeehiveFormMessageDiv.classList.add('alert-danger');
                editBeehiveFormMessageDiv.textContent = data.message || 'Failed to update beehive.';
                editBeehiveFormMessageDiv.style.display = 'block';
                showBootstrapAlert('danger', data.message || 'Failed to update beehive.'); // Show general alert
            }
        } catch (error) {
            console.error('Error updating beehive:', error);
            editBeehiveFormMessageDiv.classList.add('alert-danger');
            editBeehiveFormMessageDiv.textContent = 'An unexpected error occurred while updating the beehive.';
            editBeehiveFormMessageDiv.style.display = 'block';
            showBootstrapAlert('danger', 'An unexpected error occurred while updating the beehive.'); // Show general alert
        }
    });

    // Handle Edit Sensor Form submission
    document.getElementById('editSensorForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const sensorId = document.getElementById('editSensorId').value;
        const hiveId = document.getElementById('editSensorHiveSelect').value;
        const serialNumber = document.getElementById('editSensorSerialNumber').value;
        const sensorType = document.getElementById('editSensorType').value;
        const editSensorFormMessageDiv = document.getElementById('editSensorFormMessage');

        editSensorFormMessageDiv.style.display = 'none';
        editSensorFormMessageDiv.className = 'alert mt-3'; // Reset classes

        if (!sensorId || !hiveId || !serialNumber || !sensorType) {
            editSensorFormMessageDiv.classList.add('alert-danger');
            editSensorFormMessageDiv.textContent = 'Please fill all sensor fields.';
            editSensorFormMessageDiv.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('backend.php?action=update_sensor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sensor_id: sensorId,
                    hive_id: hiveId,
                    serial_number: serialNumber,
                    sensor_type: sensorType
                })
            });
            const data = await response.json();

            if (data.success) {
                editSensorFormMessageDiv.classList.add('alert-success');
                editSensorFormMessageDiv.textContent = data.message || 'Sensor updated successfully!';
                editSensorFormMessageDiv.style.display = 'block';
                fetchRegisteredSensors(); // Refresh registered sensors list (and sensor charts)
                // Optionally close modal after success
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editSensorModal'));
                    modal.hide();
                }, 1500);
            } else {
                editSensorFormMessageDiv.classList.add('alert-danger');
                editSensorFormMessageDiv.textContent = data.message || 'Failed to update sensor.';
                editSensorFormMessageDiv.style.display = 'block';
                showBootstrapAlert('danger', data.message || 'Failed to update sensor.'); // Show general alert
            }
        } catch (error) {
            console.error('Error updating sensor:', error);
            editSensorFormMessageDiv.classList.add('alert-danger');
            editSensorFormMessageDiv.textContent = 'An unexpected error occurred while updating the sensor.';
            editSensorFormMessageDiv.style.display = 'block';
            showBootstrapAlert('danger', 'An unexpected error occurred while updating the sensor.'); // Show general alert
        }
    });

    // andle Edit Report Form submission
    document.getElementById('editReportForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const reportId = document.getElementById('editReportId').value;
        const officerId = document.getElementById('editReportOfficerSelect').value;
        const message = document.getElementById('editReportMessage').value;
        const editReportFormMessageDiv = document.getElementById('editReportFormMessage');

        editReportFormMessageDiv.style.display = 'none';
        editReportFormMessageDiv.className = 'alert mt-3'; // Reset classes

        if (!reportId || !officerId || !message) {
            editReportFormMessageDiv.classList.add('alert-danger');
            editReportFormMessageDiv.textContent = 'Please select an officer and enter a message.';
            editReportFormMessageDiv.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('backend.php?action=update_report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report_id: reportId, officer_id: officerId, message: message })
            });
            const data = await response.json();

            if (data.success) {
                editReportFormMessageDiv.classList.add('alert-success');
                editReportFormMessageDiv.textContent = data.message || 'Report updated successfully!';
                editReportFormMessageDiv.style.display = 'block';
                fetchSentReports(); // Refresh sent reports list
                // Optionally close modal after success
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editReportModal'));
                    modal.hide();
                }, 1500);
            } else {
                editReportFormMessageDiv.classList.add('alert-danger');
                editReportFormMessageDiv.textContent = data.message || 'Failed to update report.';
                editReportFormMessageDiv.style.display = 'block';
                showBootstrapAlert('danger', data.message || 'Failed to update report.'); // Show general alert
            }
        } catch (error) {
            console.error('Error updating report:', error);
            editReportFormMessageDiv.classList.add('alert-danger');
            editReportFormMessageDiv.textContent = 'An unexpected error occurred while updating the report.';
            editReportFormMessageDiv.style.display = 'block';
            showBootstrapAlert('danger', 'An unexpected error occurred while updating the report.'); // Show general alert
        }
    });
});
