(function () {
    // Function to display the search results
    function displaySearchResults(results, store) {
        const searchResults = document.getElementById('search-results');

        if (results.length) { // Are there any results?
            let appendString = '';

            for (let i = 0; i < results.length; i++) {  // Iterate over the results
                const ref = results[i].ref;
                const item = store[ref];

                // Check if item is found in store
                if (!item) {
                    continue; // Skip this result if item is not found
                }

                // Check if the URL needs to be fixed (e.g., relative URL issue)
                if (item.url && !item.url.startsWith("http")) {
                    item.url = window.location.origin + item.url; // Make the URL absolute if it's relative
                }

                appendString += `<li><a href="${item.url}"><h3>${item.title}</h3></a>`;
                appendString += `<p>${item.content.substring(0, 150)}...</p></li>`;
            }

            searchResults.innerHTML = appendString;
            searchResults.classList.add('show'); // Show results with fade-in effect
        } else {
            searchResults.innerHTML = '<li>No results found</li>';
            searchResults.classList.add('show'); // Show 'No results found' message with fade-in effect
        }
    }

    // Function to get the query variable from the URL
    function getQueryVariable(variable) {
        const query = window.location.search.substring(1);
        const vars = query.split('&');

        for (let i = 0; i < vars.length; i++) {
            const pair = vars[i].split('=');

            if (pair[0] === variable) {
                return decodeURIComponent(pair[1].replace(/\+/g, '%20'));
            }
        }

        return null;
    }

    // Get the initial search term from the URL if any
    const searchTerm = getQueryVariable('query');

    // If there is a search term in the URL, pre-fill the search box with it
    if (searchTerm) {
        document.getElementById('search-box').setAttribute("value", searchTerm);
    }

    // Fetch the search.json and create the Lunr index
    fetch('/search.json')
        .then(response => response.json())
        .then(data => {
            // Initialize Lunr index
            const idx = lunr(function () {
                this.ref('id');
                this.field('title', { boost: 10 });
                this.field('author');
                this.field('category');
                this.field('content');

                // Initialize the store as an object
                const store = {};

                // Add documents to the index and populate the store
                data.forEach(item => {
                    this.add({
                        id: item.id,
                        title: item.title,
                        author: item.author,
                        category: item.category,
                        content: item.content
                    });

                    // Populate the store as an object
                    store[item.id] = item;
                });

                // If there's a search term, perform the search
                if (searchTerm) {
                    const results = idx.search(searchTerm);

                    // Display the results
                    displaySearchResults(results, store); // Pass the store as a parameter
                }

                // Add an event listener to the search box for real-time search
                const searchBox = document.getElementById('search-box');
                searchBox.addEventListener('input', function (event) {
                    const query = event.target.value.trim();

                    if (query === '') {
                        // If the search box is empty, clear the search results
                        searchResults.innerHTML = ''; // Or you can display a message like 'No results found'
                        document.getElementById('search-results').classList.remove('show');
                        return;
                    }

                    // Perform search when the user types in the search box
                    const results = idx.search(query);

                    // Display the results
                    displaySearchResults(results, store); // Pass the store as a parameter
                });
            });
        })
        .catch(error => {
            console.error('Error loading search.json:', error);
        });
})();


// Add an event listener to the search box for real-time search
const searchBox = document.getElementById('search-box');
searchBox.addEventListener('input', function (event) {
    const query = event.target.value.trim();

    // Check if the query is empty
    if (query === "") {
        // Remove the 'show' class to trigger fade-out
        const results = document.getElementById('search-results');

        // Apply fade-out transition and remove content after the transition completes
        results.classList.remove('show');

        // Wait for the fade-out transition to complete, then clear the content
        results.addEventListener('transitionend', function () {
            results.innerHTML = ''; // Clear old results
        });
    } else {
        // Perform search when the user types in the search box
        const results = idx.search(query);

        // Display the results and show the result container
        displaySearchResults(results, data); // Use the data as store

        // Add the 'show' class to make sure results are visible
        document.getElementById('search-results').classList.add('show');
    }
});

