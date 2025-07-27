// Function to fetch and display beekeeper reports
async function fetchBeekeeperReports() {
    try {
        const response = await fetch('backend.php?action=get_reports_for_officer');
        const data = await response.json();
        const reportsListDiv = document.getElementById('beekeeperReportsList');
        reportsListDiv.innerHTML = ''; // Clear existing content

        if (data.success && data.reports && data.reports.length > 0) {
            const table = document.createElement('table');
            table.className = 'table table-striped table-hover';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Report ID</th>
                        <th>Beekeeper</th>
                        <th>Hive</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th>Recommendations</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');

            data.reports.forEach(report => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${htmlspecialchars(report.report_id)}</td>
                    <td>${htmlspecialchars(report.beekeeper_name)} (${htmlspecialchars(report.beekeeper_email)})</td>
                    <td>${htmlspecialchars(report.hive_name || 'N/A')} (${htmlspecialchars(report.location || 'N/A')})</td>
                    <td>${htmlspecialchars(report.report_message.substring(0, 100))}...</td>
                    <td>${new Date(report.report_created_at).toLocaleString()}</td>
                    <td>${htmlspecialchars(report.recommendations_text || 'None')}</td>
                    <td>
                        <button class="btn btn-sm btn-info-custom view-report-btn me-1"
                            data-report-id="${report.report_id}"
                            data-beekeeper-name="${htmlspecialchars(report.beekeeper_name)}"
                            data-beekeeper-email="${htmlspecialchars(report.beekeeper_email)}"
                            data-hive-name="${htmlspecialchars(report.hive_name || 'N/A')}"
                            data-hive-location="${htmlspecialchars(report.location || 'N/A')}"
                            data-date="${new Date(report.report_created_at).toLocaleString()}"
                            data-message="${htmlspecialchars(report.report_message)}"
                            data-recommendations="${htmlspecialchars(report.recommendations_text || 'None')}">View</button>
                        <button class="btn btn-sm btn-primary-custom add-recommendation-btn me-1"
                            data-report-id="${report.report_id}"
                            data-beekeeper-name="${htmlspecialchars(report.beekeeper_name)}"
                            data-beekeeper-email="${htmlspecialchars(report.beekeeper_email)}"
                            data-report-message="${htmlspecialchars(report.report_message)}">Add Rec</button>
                        <button class="btn btn-sm btn-danger delete-report-btn" data-id="${report.report_id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            reportsListDiv.appendChild(table);

            // Add event listeners for buttons
            document.querySelectorAll('.view-report-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    document.getElementById('viewReportDetailsBeekeeperName').textContent = event.target.dataset.beekeeperName;
                    document.getElementById('viewReportDetailsBeekeeperEmail').textContent = event.target.dataset.beekeeperEmail;
                    document.getElementById('viewReportDetailsHiveName').textContent = event.target.dataset.hiveName;
                    document.getElementById('viewReportDetailsHiveLocation').textContent = event.target.dataset.hiveLocation;
                    document.getElementById('viewReportDetailsDate').textContent = event.target.dataset.date;
                    document.getElementById('viewReportDetailsMessage').textContent = event.target.dataset.message;
                    document.getElementById('viewReportDetailsRecommendations').textContent = event.target.dataset.recommendations;
                    const viewModal = new bootstrap.Modal(document.getElementById('viewReportDetailsModal'));
                    viewModal.show();
                });
            });

            document.querySelectorAll('.add-recommendation-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    document.getElementById('recommendationReportId').value = event.target.dataset.reportId;
                    document.getElementById('recommendationBeekeeperName').textContent = event.target.dataset.beekeeperName;
                    document.getElementById('recommendationBeekeeperEmail').textContent = event.target.dataset.beekeeperEmail;
                    document.getElementById('recommendationReportMessage').textContent = event.target.dataset.reportMessage;
                    document.getElementById('recommendationMessage').value = ''; // Clear previous message
                    document.getElementById('addRecommendationFormMessage').style.display = 'none'; // Hide previous alert
                    const addRecModal = new bootstrap.Modal(document.getElementById('addRecommendationModal'));
                    addRecModal.show();
                });
            });

            document.querySelectorAll('.delete-report-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const reportId = event.target.dataset.id;
                    showDeleteConfirmModal('report_officer', reportId);
                });
            });

        } else {
            reportsListDiv.innerHTML = '<p class="text-center text-muted">No reports found.</p>';
        }
    } catch (error) {
        console.error('Error fetching beekeeper reports:', error);
        reportsListDiv.innerHTML = '<p class="text-center text-danger">Failed to load beekeeper reports.</p>';
    }
}

// Function to fetch and display recommendations sent by the officer
async function fetchOfficerRecommendations() {
    try {
        const response = await fetch('backend.php?action=get_recommendations_by_officer');
        const data = await response.json();
        const officerRecommendationsListDiv = document.getElementById('officerRecommendationsList');
        officerRecommendationsListDiv.innerHTML = ''; // Clear existing content

        if (data.success && data.recommendations && data.recommendations.length > 0) {
            const table = document.createElement('table');
            table.className = 'table table-striped table-hover';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>To Beekeeper</th>
                        <th>Message</th>
                        <th>Related Report</th>
                        <th>Related Sensor Data</th>
                        <th>Date Sent</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');

            data.recommendations.forEach(rec => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${htmlspecialchars(rec.beekeeper_name)} (${htmlspecialchars(rec.beekeeper_email)})</td>
                    <td>${htmlspecialchars(rec.message.substring(0, 100))}...</td>
                    <td>${htmlspecialchars(rec.related_report_message ? rec.related_report_message.substring(0, 50) + '...' : 'N/A')}</td>
                    <td>${rec.temperature !== null ? `Temp: ${htmlspecialchars(rec.temperature)}°C, Hum: ${htmlspecialchars(rec.humidity)}%, Weight: ${htmlspecialchars(rec.weight)}kg` : 'N/A'}</td>
                    <td>${new Date(rec.created_at).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-sm btn-info-custom view-officer-recommendation-btn me-1"
                            data-beekeeper-name="${htmlspecialchars(rec.beekeeper_name)}"
                            data-beekeeper-email="${htmlspecialchars(rec.beekeeper_email)}"
                            data-date="${new Date(rec.created_at).toLocaleString()}"
                            data-message="${htmlspecialchars(rec.message)}"
                            data-related-report="${htmlspecialchars(rec.related_report_message || 'N/A')}"
                            data-temp="${htmlspecialchars(rec.temperature || 'N/A')}"
                            data-humidity="${htmlspecialchars(rec.humidity || 'N/A')}"
                            data-weight="${htmlspecialchars(rec.weight || 'N/A')}">View</button>
                        <button class="btn btn-sm btn-danger delete-recommendation-officer-btn" data-id="${rec.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            officerRecommendationsListDiv.appendChild(table);

            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-recommendation-officer-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const recId = event.target.dataset.id;
                    showDeleteConfirmModal('recommendation_officer', recId);
                });
            });

            // Add event listeners for view buttons
            document.querySelectorAll('.view-officer-recommendation-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    document.getElementById('viewOfficerRecommendationBeekeeperName').textContent = event.target.dataset.beekeeperName;
                    document.getElementById('viewOfficerRecommendationBeekeeperEmail').textContent = event.target.dataset.beekeeperEmail;
                    document.getElementById('viewOfficerRecommendationDate').textContent = event.target.dataset.date;
                    document.getElementById('viewOfficerRecommendationMessage').textContent = event.target.dataset.message;
                    document.getElementById('viewOfficerRecommendationRelatedReport').textContent = event.target.dataset.relatedReport;
                    document.getElementById('viewOfficerRecommendationSensorData').textContent = `Temp: ${event.target.dataset.temp}°C, Hum: ${event.target.dataset.humidity}%, Weight: ${event.target.dataset.weight}kg`;

                    const viewRecModal = new bootstrap.Modal(document.getElementById('viewOfficerRecommendationModal'));
                    viewRecModal.show();
                });
            });

        } else {
            officerRecommendationsListDiv.innerHTML = '<p class="text-center text-muted">No recommendations sent yet.</p>';
        }
    } catch (error) {
        console.error('Error fetching officer recommendations:', error);
        officerRecommendationsListDiv.innerHTML = '<p class="text-center text-danger">Failed to load recommendations.</p>';
    }
}

// Generic Delete Confirmation Modal Handler
let deleteActionType = ''; // 'report_officer' or 'recommendation_officer'
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

    if (deleteActionType === 'report_officer') {
        await deleteReportOfficer(deleteItemId);
    } else if (deleteActionType === 'recommendation_officer') {
        await deleteRecommendationOfficer(deleteItemId);
    }
});

async function deleteReportOfficer(reportId) {
    try {
        const response = await fetch(`backend.php?action=delete_report_officer&id=${reportId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            showBootstrapAlert('success', data.message || 'Report deleted successfully.');
            fetchBeekeeperReports(); // Refresh the list
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to delete report.');
        }
    } catch (error) {
        console.error('Error deleting report:', error);
        showBootstrapAlert('danger', 'An error occurred while deleting the report.');
    }
}

async function deleteRecommendationOfficer(recommendationId) {
    try {
        const response = await fetch(`backend.php?action=delete_recommendation_officer&id=${recommendationId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            showBootstrapAlert('success', data.message || 'Recommendation deleted successfully.');
            fetchOfficerRecommendations(); // Refresh the list
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to delete recommendation.');
        }
    } catch (error) {
        console.error('Error deleting recommendation:', error);
        showBootstrapAlert('danger', 'An error occurred while deleting the recommendation.');
    }
}


// Event listeners and initial data loads
document.addEventListener('DOMContentLoaded', async function() {
    // Initial data fetches
    await fetchBeekeeperReports();
    await fetchOfficerRecommendations();

    // Auto-refresh reports and recommendations every 10 seconds
    setInterval(fetchBeekeeperReports, 10000);
    setInterval(fetchOfficerRecommendations, 10000);

    // Handle Add Recommendation Form submission
    document.getElementById('addRecommendationForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const reportId = document.getElementById('recommendationReportId').value;
        const message = document.getElementById('recommendationMessage').value;
        const formMessageDiv = document.getElementById('addRecommendationFormMessage');

        formMessageDiv.style.display = 'none';
        formMessageDiv.className = 'alert mt-3'; // Reset classes

        if (!reportId || !message) {
            formMessageDiv.classList.add('alert-danger');
            formMessageDiv.textContent = 'Report ID and message are required.';
            formMessageDiv.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('backend.php?action=add_recommendation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report_id: reportId, message: message })
            });
            const data = await response.json();

            if (data.success) {
                formMessageDiv.classList.add('alert-success');
                formMessageDiv.textContent = data.message || 'Recommendation added successfully!';
                formMessageDiv.style.display = 'block';
                document.getElementById('addRecommendationForm').reset(); // Clear form
                fetchBeekeeperReports(); // Refresh reports list
                fetchOfficerRecommendations(); // Refresh officer's recommendations list
                // Optionally close modal after success
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addRecommendationModal'));
                    modal.hide();
                }, 1500);
            } else {
                formMessageDiv.classList.add('alert-danger');
                formMessageDiv.textContent = data.message || 'Failed to add recommendation.';
                formMessageDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Error adding recommendation:', error);
            formMessageDiv.classList.add('alert-danger');
            formMessageDiv.textContent = 'An unexpected error occurred while adding the recommendation.';
            formMessageDiv.style.display = 'block';
        }
    });
});
