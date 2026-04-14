// Store all users here so the search filter can use them later
let allUsers = [];

async function loadUsers() {
  // Show loading state before the request starts
  document.getElementById('status').innerHTML =
    '<p class="text-gray-500 text-center py-4">Loading users...</p>';

  try {
    const response = await fetch(
      'https://jsonplaceholder.typicode.com/users'
    );

    // Always check response.ok — a 404 or 500 does NOT throw automatically
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const users = await response.json();
    allUsers = users; // save for search filtering later
    renderUsers(users);
    // Clear the loading message
    document.getElementById('status').innerHTML = '';
    console.log(users); // confirm data before building the UI

  } catch (error) {
    // Show the error in the DOM — not just in the console
    document.getElementById('status').innerHTML = `
      <p class="text-red-600 bg-red-50 border border-red-200
                 rounded-lg px-4 py-3">
        Failed to load users: ${error.message}
      </p>
    `;
  }
}
function renderUsers(users) {
  const grid = document.getElementById('userGrid');

  // Handle the case where no users match the search
  if (users.length === 0) {
    grid.innerHTML =
      '<p class="col-span-3 text-center text-gray-400 py-8">No users match your search.</p>';
    return;
  }

  // Build a card for each user and inject them all at once
  grid.innerHTML = users.map(user => `
    <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
         data-user-id="${user.id}">

      <p class="font-bold text-gray-800 text-lg">${user.name}</p>
      <p class="text-blue-500 text-sm mb-3">@${user.username}</p>

      <div class="text-sm text-gray-600 space-y-1">
        <p>✉ ${user.email}</p>
        <p>📍 ${user.address.city}</p>
        <p>🏢 ${user.company.name}</p>
      </div>

      <!-- View Posts button + posts container for this user -->
      <button
        onclick="togglePosts(${user.id}, this)"
        class="mt-4 w-full text-sm text-blue-600 border border-blue-300
               rounded-lg py-1.5 hover:bg-blue-50 transition">
        View Posts
      </button>
      <div id="posts-${user.id}" class="hidden mt-3"></div>
    </div>
  `).join('');
}
async function togglePosts(userId, btn) {
  const container = document.getElementById(`posts-${userId}`);

  // Toggle off: if posts are already visible, hide them and stop
  if (!container.classList.contains('hidden')) {
    container.classList.add('hidden');
    btn.textContent = 'View Posts';
    return;
  }

  // Show loading inside this card's posts container
  container.innerHTML =
    '<p class="text-xs text-gray-400">Loading posts...</p>';
  container.classList.remove('hidden');

  try {
    // Query string: ?userId=3 filters posts to just this user's
    const res = await fetch(
      `https://jsonplaceholder.typicode.com/posts?userId=${userId}`
    );
    if (!res.ok) throw new Error('Failed to load posts');

    const posts = await res.json();

    if (posts.length === 0) {
      container.innerHTML =
        '<p class="text-xs text-gray-400">No posts found.</p>';
    } else {
      container.innerHTML = `
        <ul class="mt-2 space-y-1 list-disc list-inside">
          ${posts.map(p =>
            `<li class="text-xs text-gray-600">${p.title}</li>`
          ).join('')}
        </ul>
      `;
    }
    btn.textContent = 'Hide Posts';

  } catch (err) {
    container.innerHTML =
      `<p class="text-xs text-red-500">${err.message}</p>`;
  }
}
// Add this after loadUsers() is called at the bottom of your script
document.getElementById('searchInput')
  .addEventListener('input', function () {
    const query = this.value.toLowerCase().trim();

    // Filter the stored array — no fetch() here
    const filtered = allUsers.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
    );

    // Re-render the grid with only the matching users
    renderUsers(filtered);
  });

loadUsers();