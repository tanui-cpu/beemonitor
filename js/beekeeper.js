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
    // ThingSpeak integration removed. Always fetch from local backend.
    const sensorData = await fetchLocalSensorData();

    // Process and update chart
    if (sensorData && sensorData.length > 0) {
        const sortedData = sensorData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const labels = sortedData.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        const temperatures = sortedData.map(d => d.temperature);
        const humidities = sortedData.map(d => d.humidity);
        const weights = sortedData.map(d => d.weight);

        liveChart.data.labels = labels;
        liveChart.data.datasets[0].data = temperatures;
        liveChart.data.datasets[1].data = humidities;
        liveChart.data.datasets[2].data = weights;
        liveChart.update();
    } else {
        console.warn('No sensor data available to display on chart.');
        liveChart.data.labels = [];
        liveChart.data.datasets[0].data = [];
        liveChart.data.datasets[1].data = [];
        liveChart.data.datasets[2].data = [];
        liveChart.update();
    }
}

// Helper function to fetch data from your local backend
async function fetchLocalSensorData() {
    try {
        const response = await fetch('backend.php?action=get_live_sensor_data');
        const data = await response.json();
        if (data.success && data.sensor_data) {
            console.log('Fetched data from local backend:', data.sensor_data);
            return data.sensor_data;
        } else {
            console.error('Failed to fetch local sensor data:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching local sensor data:', error);
        return [];
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
                        <div class="hive-actions w-100 text-end mt-2">
                            <button class="btn btn-sm btn-info-custom edit-beehive-btn me-1"
                                data-id="${hive.hive_id}"
                                data-name="${htmlspecialchars(hive.hive_name)}"
                                data-location="${htmlspecialchars(hive.location)}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-beehive-btn" data-id="${hive.hive_id}">Delete</button>
                        </div>
                    </div>
                `;
                beehivesOverviewDiv.appendChild(hiveCard);
            });

            // Add event listeners for new buttons
            document.querySelectorAll('.edit-beehive-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const hiveId = event.target.dataset.id;
                    const hiveName = event.target.dataset.name;
                    const hiveLocation = event.target.dataset.location;
                    showEditBeehiveModal(hiveId, hiveName, hiveLocation);
                });
            });

            document.querySelectorAll('.delete-beehive-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const hiveId = event.target.dataset.id;
                    showDeleteConfirmModal('beehive', hiveId);
                });
            });

        } else {
            beehivesOverviewDiv.innerHTML = '<p class="text-center text-muted">No beehives registered yet. Click "Add New Beehive" to get started!</p>';
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
        const editReportOfficerSelect = document.getElementById('editReportOfficerSelect'); // For edit report modal
        
        officerSelect.innerHTML = '<option value="">Select an officer</option>'; // Reset options
        editReportOfficerSelect.innerHTML = '<option value="">Select an officer</option>'; // Reset options for edit modal

        if (data.success && data.officers && data.officers.length > 0) {
            data.officers.forEach(officer => {
                const option = document.createElement('option');
                option.value = officer.id;
                option.textContent = `${officer.full_name} (${officer.email})`;
                officerSelect.appendChild(option);

                const editOption = option.cloneNode(true); // Clone for edit modal
                editReportOfficerSelect.appendChild(editOption);
            });
        } else {
            officerSelect.innerHTML = '<option value="">No officers found</option>';
            editReportOfficerSelect.innerHTML = '<option value="">No officers found</option>';
        }
    } catch (error) {
        console.error('Error fetching officers:', error);
        document.getElementById('officerSelect').innerHTML = '<option value="">Error loading officers</option>';
        document.getElementById('editReportOfficerSelect').innerHTML = '<option value="">Error loading officers</option>';
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
        const editSensorHiveSelect = document.getElementById('editSensorHiveSelect'); // For edit modal
        
        hiveSelect.innerHTML = '<option value="">Select a beehive</option>'; // Reset options
        editSensorHiveSelect.innerHTML = '<option value="">Select a beehive</option>'; // Reset options for edit modal

        if (data.success && data.hives && data.hives.length > 0) {
            data.hives.forEach(hive => {
                const option = document.createElement('option');
                option.value = hive.id;
                option.textContent = htmlspecialchars(hive.hive_name);
                hiveSelect.appendChild(option);

                const editOption = option.cloneNode(true); // Clone for edit modal
                editSensorHiveSelect.appendChild(editOption);
            });
            hiveSelect.disabled = false; // Enable if hives are found
            editSensorHiveSelect.disabled = false; // Enable for edit modal
        } else {
            hiveSelect.innerHTML = '<option value="">No beehives found. Please add one first!</option>';
            hiveSelect.disabled = true; // Disable if no hives
            editSensorHiveSelect.innerHTML = '<option value="">No beehives found.</option>';
            editSensorHiveSelect.disabled = true;
        }
    } catch (error) {
        console.error('Error fetching beehives for sensor registration:', error);
        document.getElementById('hiveSelect').innerHTML = '<option value="">Error loading beehives</option>';
        document.getElementById('hiveSelect').disabled = true;
        document.getElementById('editSensorHiveSelect').innerHTML = '<option value="">Error loading beehives</option>';
        document.getElementById('editSensorHiveSelect').disabled = true;
    }
}

// NEW: Function to fetch and display registered sensors
async function fetchRegisteredSensors() {
    try {
        const response = await fetch('backend.php?action=get_registered_sensors');
        const data = await response.json(); // Await the JSON parsing
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
                        <th>Actions</th> <!-- Added Actions column -->
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
                    <td>
                        <button class="btn btn-sm btn-info-custom edit-sensor-btn me-1"
                            data-id="${sensor.id}"
                            data-hive-id="${sensor.hive_id_fk}"
                            data-serial-number="${htmlspecialchars(sensor.serial_number)}"
                            data-sensor-type="${htmlspecialchars(sensor.sensor_type)}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-sensor-btn" data-id="${sensor.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            registeredSensorsListDiv.appendChild(table);

            // Add event listeners for new buttons
            document.querySelectorAll('.edit-sensor-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const sensorId = event.target.dataset.id;
                    const hiveId = event.target.dataset.hiveId;
                    const serialNumber = event.target.dataset.serialNumber;
                    const sensorType = event.target.dataset.sensorType;
                    showEditSensorModal(sensorId, hiveId, serialNumber, sensorType);
                });
            });

            document.querySelectorAll('.delete-sensor-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const sensorId = event.target.dataset.id;
                    showDeleteConfirmModal('sensor', sensorId);
                });
            });

        } else {
            registeredSensorsListDiv.innerHTML = '<p class="text-center text-muted">No sensors registered yet.</p>';
        }
    } catch (error) {
        console.error('Error fetching registered sensors:', error);
        registeredSensorsListDiv.innerHTML = '<p class="text-center text-danger">Failed to load registered sensors.</p>';
    }
}

// NEW: Function to add a beehive
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
            fetchBeehivesOverview(); // Refresh the list
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to add beehive.');
        }
    } catch (error) {
        console.error('Error adding beehive:', error);
        showBootstrapAlert('danger', 'An error occurred while adding the beehive.');
    }
}

// NEW: Function to update a beehive
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
            fetchBeehivesOverview(); // Refresh the list
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to update beehive.');
        }
    } catch (error) {
        console.error('Error updating beehive:', error);
        showBootstrapAlert('danger', 'An error occurred while updating the beehive.');
    }
}

// NEW: Function to delete a beehive
async function deleteBeehive(hiveId) {
    try {
        const response = await fetch(`backend.php?action=delete_beehive&id=${hiveId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            showBootstrapAlert('success', data.message || 'Beehive deleted successfully.');
            fetchBeehivesOverview(); // Refresh the list
            fetchBeehivesForSensorRegistration(); // Also refresh hive dropdowns
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to delete beehive.');
        }
    } catch (error) {
        console.error('Error deleting beehive:', error);
        showBootstrapAlert('danger', 'An error occurred while deleting the beehive.');
    }
}

// NEW: Function to update a sensor
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
            fetchRegisteredSensors(); // Refresh the list
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to update sensor.');
        }
    } catch (error) {
        console.error('Error updating sensor:', error);
        showBootstrapAlert('danger', 'An error occurred while updating the sensor.');
    }
}

// NEW: Function to delete a sensor
async function deleteSensor(sensorId) {
    try {
        const response = await fetch(`backend.php?action=delete_sensor&id=${sensorId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            showBootstrapAlert('success', data.message || 'Sensor deleted successfully.');
            fetchRegisteredSensors(); // Refresh the list
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to delete sensor.');
        }
    } catch (error) {
        console.error('Error deleting sensor:', error);
        showBootstrapAlert('danger', 'An error occurred while deleting the sensor.');
    }
}

// NEW: Function to update a report
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

// NEW: Function to show Edit Report Modal and populate fields
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


// Event listeners and initial data loads
document.addEventListener('DOMContentLoaded', async function() {
    // Initial data fetches
    await fetchBeehivesOverview();
    await fetchSensorData(); // This will now use local backend only
    await fetchAlerts();
    await fetchSentReports();
    await fetchReceivedRecommendations();
    await fetchRegisteredSensors(); // Fetch registered sensors on load

    // Auto-refresh sensor data, alerts, and beehives overview every 10 seconds
    setInterval(fetchBeehivesOverview, 10000);
    setInterval(fetchSensorData, 10000); // This will now use local backend only
    setInterval(fetchAlerts, 10000);
    setInterval(fetchRegisteredSensors, 10000);
    setInterval(fetchSentReports, 10000);

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

    // NEW: Handle Add Beehive Form submission
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
                fetchBeehivesOverview(); // Refresh beehives list
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

    // NEW: Handle Edit Beehive Form submission
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
                fetchBeehivesOverview(); // Refresh beehives list
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

    // NEW: Handle Edit Sensor Form submission
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
                fetchRegisteredSensors(); // Refresh registered sensors list
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

    // NEW: Handle Edit Report Form submission
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
