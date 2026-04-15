async function loadStats() {
  // Promise.allSettled fires all three fetches at the same time
  // Unlike Promise.all, it does NOT throw if one fetch fails
  const results = await Promise.allSettled([
    fetch('https://jsonplaceholder.typicode.com/users').then(r => r.json()),
    fetch('https://jsonplaceholder.typicode.com/posts').then(r => r.json()),
    fetch('https://jsonplaceholder.typicode.com/todos').then(r => r.json()),
  ]);

  const ids    = ['stat-users', 'stat-posts', 'stat-todos'];
  const labels = ['Users', 'Posts', 'Todos'];

  // Each result has { status: 'fulfilled' | 'rejected', value / reason }
  results.forEach((result, i) => {
    const card = document.getElementById(ids[i]);

    if (result.status === 'fulfilled') {
      card.innerHTML = `
        <p class="text-xs text-gray-400 mb-1">${labels[i]}</p>
        <p class="text-2xl font-bold text-gray-700">${result.value.length}</p>
      `;
    } else {
      // This card failed — the others are completely unaffected
      card.innerHTML = `
        <p class="text-xs text-gray-400 mb-1">${labels[i]}</p>
        <p class="text-sm text-red-400">Stats unavailable</p>
      `;
    }
  });
}
async function searchCountry() {
  const query  = document.getElementById('countryInput').value.trim();
  const result = document.getElementById('countryResult');

  // Error case 1: empty input — validate before fetching
  if (!query) {
    result.innerHTML =
      '<p class="text-red-500 text-sm">Please enter a country name.</p>';
    return;
  }

  result.innerHTML = '<p class="text-gray-400 text-sm">Searching...</p>';

  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(query)}`
    );

    // Error case 2: country not found (API returns 404)
    if (res.status === 404) {
      result.innerHTML =
        '<p class="text-red-500 text-sm">Country not found. Try another name.</p>';
      return;
    }
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();
    const c = data[0]; // API returns an array — use the first match

    // currencies is an object like { NGN: { name: "Nigerian naira", ... } }
    // Object.keys() gives us the currency code, then we read the name
    const currencyKey  = Object.keys(c.currencies)[0];
    const currencyName = c.currencies[currencyKey].name;

    // Format population with commas: 223804632 → 223,804,632
    const population = c.population.toLocaleString();

    result.innerHTML = `
      <div class="border rounded-lg p-4 mt-2">
        <p class="text-3xl mb-1">${c.flag}</p>
        <p class="font-bold text-lg">${c.name.common}</p>
        <div class="text-sm text-gray-600 mt-2 space-y-1">
          <p>Capital: ${c.capital?.[0] ?? 'N/A'}</p>
          <p>Population: ${population}</p>
          <p>Region: ${c.region}</p>
          <p>Currency: ${currencyName}</p>
        </div>
      </div>
    `;

  } catch (err) {
    // Error case 3: network failure or any other unexpected error
    result.innerHTML =
      `<p class="text-red-500 text-sm">Network error: ${err.message}</p>`;
  }
}
// Map Pokémon types to Tailwind colour classes
const typeColors = {
  fire:     'bg-red-100 text-red-700',
  water:    'bg-blue-100 text-blue-700',
  grass:    'bg-green-100 text-green-700',
  electric: 'bg-yellow-100 text-yellow-700',
  psychic:  'bg-pink-100 text-pink-700',
  normal:   'bg-gray-100 text-gray-600',
};

async function searchPokemon() {
  const name   = document.getElementById('pokemonInput').value.trim().toLowerCase();
  const result = document.getElementById('pokemonResult');

  if (!name) {
    result.innerHTML =
      '<p class="text-red-500 text-sm">Enter a Pokémon name.</p>';
    return;
  }

  // Show loading state
  result.innerHTML =
    '<p class="text-gray-400 text-sm animate-pulse">Loading...</p>';

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);

    // A 404 here means the Pokémon name is invalid
    if (!res.ok) throw new Error('Pokémon not found. Check the spelling.');

    const p = await res.json();

    // Build coloured type badges
    const badges = p.types.map(t => {
      const col = typeColors[t.type.name] || 'bg-purple-100 text-purple-700';
      return `<span class="px-2 py-0.5 rounded-full text-xs font-medium ${col}">
        ${t.type.name}
      </span>`;
    }).join('');

    // Helper: find a stat by name from the stats array
    const getStat = statName =>
      p.stats.find(s => s.stat.name === statName)?.base_stat ?? 'N/A';

    result.innerHTML = `
      <div class="border rounded-lg p-4 flex gap-4 items-start mt-2">
        <img src="${p.sprites.front_default}" alt="${p.name}"
             class="w-24 h-24 object-contain" />
        <div>
          <p class="font-bold text-lg capitalize">${p.name}</p>
          <div class="flex gap-1 mt-1 mb-3">${badges}</div>
          <div class="text-sm text-gray-600 space-y-0.5">
            <p>HP: <strong>${getStat('hp')}</strong></p>
            <p>Attack: <strong>${getStat('attack')}</strong></p>
            <p>Defense: <strong>${getStat('defense')}</strong></p>
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    result.innerHTML =
      `<p class="text-red-500 text-sm">${err.message}</p>`;
  }
}
async function publishPost() {
  const name   = document.getElementById('pubName').value.trim();
  const title  = document.getElementById('pubTitle').value.trim();
  const body   = document.getElementById('pubBody').value.trim();
  const btn    = document.getElementById('publishBtn');
  const result = document.getElementById('publishResult');

  // Validate — all three fields must be filled before we fetch
  if (!name || !title || !body) {
    result.innerHTML =
      '<p class="text-red-500 text-sm">All fields are required.</p>';
    return;
  }

  // Disable the button during the request
  btn.disabled = true;
  btn.textContent = 'Publishing...';
  result.innerHTML = '';

  try {
    const res = await fetch(
      'https://jsonplaceholder.typicode.com/posts',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'  // required — tells the server what format we are sending
        },
        body: JSON.stringify({
          title,
          body,
          userId: 1        // required by the JSONPlaceholder API
        })
      }
    );

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();

    // Display the full response in a green success card
    result.innerHTML = `
      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
        <p class="font-semibold text-green-700 mb-2">Published successfully!</p>
        <div class="text-sm text-green-800 space-y-1">
          <p>Post ID: <strong>${data.id}</strong></p>
          <p>Title: ${data.title}</p>
          <p>Body: ${data.body}</p>
        </div>
      </div>
    `;

  } catch (err) {
    result.innerHTML =
      `<p class="text-red-500 text-sm">Error: ${err.message}</p>`;

  } finally {
    // finally always runs — even if the request failed
    // This ensures the button never gets permanently stuck as "Publishing..."
    btn.disabled = false;
    btn.textContent = 'Publish';
  }
}

loadStats();