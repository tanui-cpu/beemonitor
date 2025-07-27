// Get the current admin's user ID from PHP session (for client-side check)
// This variable will be defined in the admin_dashboard.php file before this script is loaded.
// const currentAdminId = <php_variable_here>;

// Function to fetch and display all users
async function fetchAllUsers() {
    try {
        const response = await fetch('backend.php?action=get_all_users');
        const data = await response.json();
        const usersListDiv = document.getElementById('usersList');
        usersListDiv.innerHTML = ''; // Clear existing content

        if (data.success && data.users && data.users.length > 0) {
            const table = document.createElement('table');
            table.className = 'table table-striped table-hover';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Approved</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');

            data.users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${htmlspecialchars(user.id)}</td>
                    <td>${htmlspecialchars(user.full_name)}</td>
                    <td>${htmlspecialchars(user.email)}</td>
                    <td>${htmlspecialchars(user.role.charAt(0).toUpperCase() + user.role.slice(1))}</td>
                    <td>${user.is_approved == 1 ? 'Yes' : 'No'}</td>
                    <td>
                        ${user.is_approved == 0 ? `
                            <button class="btn btn-sm btn-approve approve-btn me-1" data-id="${user.id}">Approve</button>
                        ` : ''}
                        ${user.id != currentAdminId ? `
                            <button class="btn btn-sm btn-delete delete-btn" data-id="${user.id}">Delete</button>
                        ` : `
                            <span class="text-muted">(You)</span>
                        `}
                    </td>
                `;
                tbody.appendChild(tr);
            });
            usersListDiv.appendChild(table);

            // Add event listeners for buttons
            document.querySelectorAll('.approve-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const userId = event.target.dataset.id;
                    await approveUser(userId);
                });
            });

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const userId = event.target.dataset.id;
                    showDeleteConfirmModal(userId);
                });
            });

        } else {
            usersListDiv.innerHTML = '<p class="text-center text-muted">No users found.</p>';
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        usersListDiv.innerHTML = '<p class="text-center text-danger">Failed to load users.</p>';
    }
}

// Function to approve a user
async function approveUser(userId) {
    try {
        const response = await fetch('backend.php?action=approve_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });
        const data = await response.json();
        if (data.success) {
            showBootstrapAlert('success', data.message || 'User approved successfully.');
            fetchAllUsers(); // Refresh the list
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to approve user.');
        }
    } catch (error) {
        console.error('Error approving user:', error);
        showBootstrapAlert('danger', 'An error occurred while approving the user.');
    }
}

// Function to delete a user
async function deleteUser(userId) {
    try {
        const response = await fetch(`backend.php?action=delete_user&id=${userId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            showBootstrapAlert('success', data.message || 'User deleted successfully.');
            fetchAllUsers(); // Refresh the list
        } else {
            showBootstrapAlert('danger', data.message || 'Failed to delete user.');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showBootstrapAlert('danger', 'An error occurred while deleting the user.');
    }
}

// Generic Delete Confirmation Modal Handler
let userIdToDelete = null;

function showDeleteConfirmModal(userId) {
    userIdToDelete = userId;
    const modal = new bootstrap.Modal(document.getElementById('genericDeleteConfirmModal'));
    modal.show();
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    const modal = bootstrap.Modal.getInstance(document.getElementById('genericDeleteConfirmModal'));
    modal.hide(); // Hide the modal immediately

    if (userIdToDelete) {
        await deleteUser(userIdToDelete);
        userIdToDelete = null; // Reset
    }
});


// Event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Initial data fetch
    await fetchAllUsers();

    // Auto-refresh users list every 10 seconds
    setInterval(fetchAllUsers, 10000);
});
