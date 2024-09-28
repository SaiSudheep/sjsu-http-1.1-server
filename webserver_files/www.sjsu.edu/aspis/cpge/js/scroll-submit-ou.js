window.onload = function() {
	// Function to check if the page URL contains any of the specified parameters
	function shouldScroll() {
		var params = new URLSearchParams(window.location.search);
		return params.has('fields') || params.has('degree') || params.has('location');
	}

	// Scroll to the results listings container if any of the specified parameters are present
	if (shouldScroll()) {
		var resultsContainer = document.getElementById('results-listings-container');
		if (resultsContainer) {
			<!--                 resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }); -->
				window.scrollTo( 0, pos);
		}
	}
}