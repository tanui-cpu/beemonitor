// Function to fetch and display beekeeper reports for the officer
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
                        <th>Beekeeper</th>
                        <th>Report Message</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');

            data.reports.forEach(report => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${htmlspecialchars(report.beekeeper_name)} (${htmlspecialchars(report.beekeeper_email)})</td>
                    <td>${htmlspecialchars(report.report_message.substring(0, 100))}...</td>
                    <td>${new Date(report.report_created_at).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-sm btn-info-custom view-report-details-btn me-1"
                            data-id="${report.report_id}"
                            data-beekeeper-name="${htmlspecialchars(report.beekeeper_name)}"
                            data-beekeeper-email="${htmlspecialchars(report.beekeeper_email)}"
                            data-hive-name="${htmlspecialchars(report.hive_name || 'N/A')}"
                            data-hive-location="${htmlspecialchars(report.location || 'N/A')}"
                            data-date="${new Date(report.report_created_at).toLocaleString()}"
                            data-message="${htmlspecialchars(report.report_message)}"
                            data-recommendations="${htmlspecialchars(report.recommendations_text || 'No recommendations yet.')}">View</button>
                        <button class="btn btn-sm btn-primary-custom add-recommendation-btn me-1"
                            data-report-id="${report.report_id}"
                            data-beekeeper-name="${htmlspecialchars(report.beekeeper_name)}"
                            data-beekeeper-email="${htmlspecialchars(report.beekeeper_email)}"
                            data-report-message="${htmlspecialchars(report.report_message)}">Add Rec</button>
                        <button class="btn btn-sm btn-danger delete-report-officer-btn" data-id="${report.report_id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            reportsListDiv.appendChild(table);

            // Add event listeners for buttons
            document.querySelectorAll('.add-recommendation-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const reportId = event.target.dataset.reportId;
                    const beekeeperName = event.target.dataset.beekeeperName;
                    const beekeeperEmail = event.target.dataset.beekeeperEmail;
                    const reportMessage = event.target.dataset.reportMessage;
                    showAddRecommendationModal(reportId, beekeeperName, beekeeperEmail, reportMessage);
                });
            });

            document.querySelectorAll('.delete-report-officer-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const reportId = event.target.dataset.id;
                    showDeleteConfirmModal('report_officer', reportId);
                });
            });

            document.querySelectorAll('.view-report-details-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const beekeeperName = event.target.dataset.beekeeperName;
                    const beekeeperEmail = event.target.dataset.beekeeperEmail;
                    const hiveName = event.target.dataset.hiveName;
                    const hiveLocation = event.target.dataset.hiveLocation;
                    const date = event.target.dataset.date;
                    const message = event.target.dataset.message;
                    const recommendations = event.target.dataset.recommendations;

                    document.getElementById('viewReportDetailsBeekeeperName').textContent = beekeeperName;
                    document.getElementById('viewReportDetailsBeekeeperEmail').textContent = beekeeperEmail;
                    document.getElementById('viewReportDetailsHiveName').textContent = hiveName;
                    document.getElementById('viewReportDetailsHiveLocation').textContent = hiveLocation;
                    document.getElementById('viewReportDetailsDate').textContent = date;
                    document.getElementById('viewReportDetailsMessage').textContent = message;
                    document.getElementById('viewReportDetailsRecommendations').textContent = recommendations;

                    const viewModal = new bootstrap.Modal(document.getElementById('viewReportDetailsModal'));
                    viewModal.show();
                });
            });

        } else {
            reportsListDiv.innerHTML = '<p class="text-center text-muted">No beekeeper reports received yet.</p>';
        }
    } catch (error) {
        console.error('Error fetching beekeeper reports:', error);
        reportsListDiv.innerHTML = '<p class="text-center text-danger">Failed to load beekeeper reports.</p>';
    }
}

// Function to delete a report (officer's view)
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

// Function to fetch and display recommendations sent by the current officer
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
                        <th>Actions</th>
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
                    <td>${rec.related_report_message ? htmlspecialchars(rec.related_report_message.substring(0, 50)) + '...' : 'N/A'}</td>
                    <td>Temp: ${rec.temperature !== null ? htmlspecialchars(rec.temperature) + '°C' : 'N/A'}, Hum: ${rec.humidity !== null ? htmlspecialchars(rec.humidity) + '%' : 'N/A'}, Weight: ${rec.weight !== null ? htmlspecialchars(rec.weight.toFixed(2)) + 'kg' : 'N/A'}</td>
                    <td>${new Date(rec.created_at).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-sm btn-info-custom view-officer-recommendation-btn me-1"
                            data-id="${rec.id}"
                            data-beekeeper-name="${htmlspecialchars(rec.beekeeper_name)}"
                            data-beekeeper-email="${htmlspecialchars(rec.beekeeper_email)}"
                            data-date="${new Date(rec.created_at).toLocaleString()}"
                            data-message="${htmlspecialchars(rec.message)}"
                            data-related-report="${htmlspecialchars(rec.related_report_message || 'N/A')}"
                            data-temp="${htmlspecialchars(rec.temperature)}"
                            data-humidity="${htmlspecialchars(rec.humidity)}"
                            data-weight="${htmlspecialchars(rec.weight)}">View</button>
                        <button class="btn btn-sm btn-primary-custom edit-recommendation-btn me-1"
                            data-id="${rec.id}"
                            data-beekeeper-name="${htmlspecialchars(rec.beekeeper_name)}"
                            data-related-report="${htmlspecialchars(rec.related_report_message || 'N/A')}"
                            data-message="${htmlspecialchars(rec.message)}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-recommendation-officer-btn" data-id="${rec.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            officerRecommendationsListDiv.appendChild(table);

            // Add event listeners for buttons
            document.querySelectorAll('.delete-recommendation-officer-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const recId = event.target.dataset.id;
                    showDeleteConfirmModal('recommendation_officer', recId);
                });
            });

            document.querySelectorAll('.view-officer-recommendation-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const beekeeperName = event.target.dataset.beekeeperName;
                    const beekeeperEmail = event.target.dataset.beekeeperEmail;
                    const date = event.target.dataset.date;
                    const message = event.target.dataset.message;
                    const relatedReport = event.target.dataset.relatedReport;
                    const temp = event.target.dataset.temp;
                    const humidity = event.target.dataset.humidity;
                    const weight = event.target.dataset.weight;

                    document.getElementById('viewOfficerRecommendationBeekeeperName').textContent = beekeeperName;
                    document.getElementById('viewOfficerRecommendationBeekeeperEmail').textContent = beekeeperEmail;
                    document.getElementById('viewOfficerRecommendationDate').textContent = date;
                    document.getElementById('viewOfficerRecommendationMessage').textContent = message;
                    document.getElementById('viewOfficerRecommendationRelatedReport').textContent = relatedReport;
                    document.getElementById('viewOfficerRecommendationSensorData').textContent = `Temp: ${temp}°C, Hum: ${humidity}%, Weight: ${weight}kg`;

                    const viewRecModal = new bootstrap.Modal(document.getElementById('viewOfficerRecommendationModal'));
                    viewRecModal.show();
                });
            });

            // NEW: Add event listeners for edit buttons
            document.querySelectorAll('.edit-recommendation-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const recId = event.target.dataset.id;
                    const beekeeperName = event.target.dataset.beekeeperName;
                    const relatedReport = event.target.dataset.relatedReport;
                    const message = event.target.dataset.message;
                    showEditRecommendationModal(recId, beekeeperName, relatedReport, message);
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

// Function to delete a recommendation (officer's view)
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

// Function to show Add Recommendation Modal
function showAddRecommendationModal(reportId, beekeeperName, beekeeperEmail, reportMessage) {
    document.getElementById('recommendationReportId').value = reportId;
    document.getElementById('recommendationBeekeeperName').textContent = beekeeperName;
    document.getElementById('recommendationBeekeeperEmail').textContent = beekeeperEmail;
    document.getElementById('recommendationReportMessage').textContent = reportMessage;
    document.getElementById('recommendationMessage').value = ''; // Clear previous message
    document.getElementById('addRecommendationFormMessage').style.display = 'none'; // Hide any previous message
    const addModal = new bootstrap.Modal(document.getElementById('addRecommendationModal'));
    addModal.show();
}

// NEW: Function to show Edit Recommendation Modal and populate fields
function showEditRecommendationModal(recommendationId, beekeeperName, relatedReport, message) {
    document.getElementById('editRecommendationId').value = recommendationId;
    document.getElementById('editRecommendationBeekeeperName').textContent = beekeeperName;
    document.getElementById('editRecommendationRelatedReport').textContent = relatedReport;
    document.getElementById('editRecommendationMessage').value = message;
    document.getElementById('editRecommendationFormMessage').style.display = 'none'; // Hide any previous message
    const editModal = new bootstrap.Modal(document.getElementById('editRecommendationModal'));
    editModal.show();
}


// Generic Delete Confirmation Modal Handler
let deleteActionType = ''; // 'report_officer', 'recommendation_officer'
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
    deleteItemId = null; // Reset for next use
});


// Event listeners for DOM content loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Initial data fetches
    await fetchBeekeeperReports();
    await fetchOfficerRecommendations();

    // Auto-refresh lists every 10 seconds
    setInterval(fetchBeekeeperReports, 10000);
    setInterval(fetchOfficerRecommendations, 10000);

    // Handle Add Recommendation Form submission
    document.getElementById('addRecommendationForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const reportId = document.getElementById('recommendationReportId').value;
        const message = document.getElementById('recommendationMessage').value;
        const addRecommendationFormMessageDiv = document.getElementById('addRecommendationFormMessage');

        addRecommendationFormMessageDiv.style.display = 'none';
        addRecommendationFormMessageDiv.className = 'alert mt-3'; // Reset classes

        if (!reportId || !message) {
            addRecommendationFormMessageDiv.classList.add('alert-danger');
            addRecommendationFormMessageDiv.textContent = 'Report ID and message are required.';
            addRecommendationFormMessageDiv.style.display = 'block';
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
                addRecommendationFormMessageDiv.classList.add('alert-success');
                addRecommendationFormMessageDiv.textContent = data.message || 'Recommendation added successfully!';
                addRecommendationFormMessageDiv.style.display = 'block';
                document.getElementById('addRecommendationForm').reset(); // Clear form
                fetchOfficerRecommendations(); // Refresh recommendations list
                fetchBeekeeperReports(); // Refresh reports list as well, to show new recommendation
                // Optionally close modal after success
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addRecommendationModal'));
                    modal.hide();
                }, 1500);
            } else {
                addRecommendationFormMessageDiv.classList.add('alert-danger');
                addRecommendationFormMessageDiv.textContent = data.message || 'Failed to add recommendation.';
                addRecommendationFormMessageDiv.style.display = 'block';
                showBootstrapAlert('danger', data.message || 'Failed to add recommendation.'); // Show general alert
            }
        } catch (error) {
            console.error('Error adding recommendation:', error);
            addRecommendationFormMessageDiv.classList.add('alert-danger');
            addRecommendationFormMessageDiv.textContent = 'An unexpected error occurred while adding the recommendation.';
            addRecommendationFormMessageDiv.style.display = 'block';
            showBootstrapAlert('danger', 'An unexpected error occurred while adding the recommendation.'); // Show general alert
        }
    });

    // NEW: Handle Edit Recommendation Form submission
    document.getElementById('editRecommendationForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const recommendationId = document.getElementById('editRecommendationId').value;
        const message = document.getElementById('editRecommendationMessage').value;
        const editRecommendationFormMessageDiv = document.getElementById('editRecommendationFormMessage');

        editRecommendationFormMessageDiv.style.display = 'none';
        editRecommendationFormMessageDiv.className = 'alert mt-3'; // Reset classes

        if (!recommendationId || !message) {
            editRecommendationFormMessageDiv.classList.add('alert-danger');
            editRecommendationFormMessageDiv.textContent = 'Recommendation ID and message are required.';
            editRecommendationFormMessageDiv.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('backend.php?action=update_recommendation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recommendation_id: recommendationId, message: message })
            });
            const data = await response.json();

            if (data.success) {
                editRecommendationFormMessageDiv.classList.add('alert-success');
                editRecommendationFormMessageDiv.textContent = data.message || 'Recommendation updated successfully!';
                editRecommendationFormMessageDiv.style.display = 'block';
                fetchOfficerRecommendations(); // Refresh recommendations list
                // Optionally close modal after success
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editRecommendationModal'));
                    modal.hide();
                }, 1500);
            } else {
                editRecommendationFormMessageDiv.classList.add('alert-danger');
                editRecommendationFormMessageDiv.textContent = data.message || 'Failed to update recommendation.';
                editRecommendationFormMessageDiv.style.display = 'block';
                showBootstrapAlert('danger', data.message || 'Failed to update recommendation.'); // Show general alert
            }
        } catch (error) {
            console.error('Error updating recommendation:', error);
            editRecommendationFormMessageDiv.classList.add('alert-danger');
            editRecommendationFormMessageDiv.textContent = 'An unexpected error occurred while updating the recommendation.';
            editRecommendationFormMessageDiv.style.display = 'block';
            showBootstrapAlert('danger', 'An unexpected error occurred while updating the recommendation.'); // Show general alert
        }
    });
});
