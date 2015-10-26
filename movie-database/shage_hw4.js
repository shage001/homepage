/**********************************************************************************************************************
 * Create and issue an HTTP request for JSON data
 *
 * @param: {string} url Location of the information
 * @return: {Promise}
 */
var getJSON = function( url )
{
	return new Promise( function( resolve, reject )
	{
		/* create a new request */
		var request = new XMLHttpRequest();
		/* event listener for success */
		request.addEventListener( 'load', function()
		{
			if ( request.status >= 200 && request.status < 400 ) {
				resolve( request.response );
			}
			else {
				reject( Error( request.statusText ) );
			}
		});
		/* event listener for error */
		request.addEventListener( 'error', function()
		{
			reject( Error( 'Network error' ) );
		});
		/* open the request then send it */
		request.responType = 'json';
		request.open( 'GET', url, true );
		request.send();
	});
};

/**********************************************************************************************************************
 * Initialize the page by setting up event listeners and displaying the data
 *
 * @param: {Object[]} movies Our movies array
 */
var initializePage = function( movies )
{
	/* perform initial sort */
	movies = sortMovies( movies, 'original_title', false );

	/* set up event listeners for sorting */
	var sortByDate = document.getElementById( 'sort-by-date' );
	addSortEventListener( sortByDate, 'DATE', 'release_date', movies );

	var sortByTitle = document.getElementById( 'sort-by-title' );
	addSortEventListener( sortByTitle, 'TITLE', 'original_title', movies );

	var sortByRating = document.getElementById( 'sort-by-rating' );
	addSortEventListener( sortByRating, 'RATING', 'vote_average', movies );

	sortByTitle.className = 'sort sort-key';

	/* set up expand/collapse event listener */
	var expandCollapse = document.getElementsByClassName( 'expand' )[0];
	expandCollapse.addEventListener( 'click', function()
	{
		var items = document.getElementsByClassName( 'item' );
		var descriptions = document.getElementsByClassName( 'description' );

		/* expand */
		if ( expandCollapse.className === 'expand' ) {
			for ( var i = 0; i < items.length; i++ )
			{
				items[i].className = 'item selected';
				descriptions[i].className = 'description';
			}
			expandCollapse.className = 'collapse';
			expandCollapse.innerHTML = 'COLLAPSE ALL <span class="fa fa-caret-down"></span>';
		}
		/* collapse */
		else {
			for ( var i = 0; i < items.length; i++ )
			{
				items[i].className = 'item';
				descriptions[i].className = 'description hidden';
			}
			expandCollapse.className = 'expand';
			expandCollapse.innerHTML = 'EXPAND ALL <span class="fa fa-caret-right"></span>';
		}
	});
	displayData( movies );
};

/**********************************************************************************************************************
 * Create an event listener for each sort criterion. Add appropriate caret to indicate
 * sort order.
 *
 * @param: {Object} element The HTML element on which to add the event listener
 * @param: {string} text The name of the sort criterion
 * @param: {string} sortKey The name of the object's property by which to sort
 * @param: {Object[]} movies Our movies array
 */
var addSortEventListener = function( element, text, sortKey, movies )
{
	element.addEventListener( 'click', function()
	{
		if ( element.className.includes( 'reversed' ) ) {
			var reversed = false;
			element.className = 'sort';
		}
		else {
			var reversed = true;
			element.className = 'sort reversed';
		}
		if ( element.className.includes( 'reversed' ) ) {
			element.innerHTML = text + ' <span class="fa fa-caret-down"></span>';
		}
		else {
			element.innerHTML = text + ' <span class="fa fa-caret-up"></span>';
		}
		/* remove 'sort-key' class from all elements, add to the actual one */
		var sortElements = document.getElementsByClassName( 'sort' );
		for ( var i = 0; i < sortElements.length; i++ )
		{
			if ( sortElements[i].className.includes( 'sort-key' ) ) {
				// sortElements[i].className.replace( ' sort-key', '' );
				sortElements[i].className = 'sort';
			}
		}
		element.className = element.className + ' sort-key';
		movies = sortMovies( movies, sortKey, reversed );
		displayData( movies );
	});
};

/**********************************************************************************************************************
 * Create HTML elements corresponding to each list item and add them to the DOM
 *
 * @param: {Object[]} movies Our movies array
 */
var displayData = function( movies )
{
	var movieList = document.getElementById( 'movie-list' );
	movieList.innerHTML = ''; // reset list for re-sorting
	movies.forEach( function( movie )
	{
		/* create empty div for each movie */
		var listItem = document.createElement( 'div' );
		listItem.className = 'item';

		/* create heading for title, year, rating */
		var titleText = document.createElement( 'h3' );
		titleText.className = 'movie-title';
		var year = movie['release_date'].slice( 0, 4 );
		titleText.innerHTML = movie['original_title'] + ' (' + year + ') - ' + movie['vote_average'] + ' / 10';
		listItem.appendChild( titleText );
		
		/* empty div for detail view */
		var description = document.createElement( 'div' );
		description.className = 'description hidden';

		/* get poster */
		var posterUrl = 'http://image.tmdb.org/t/p/w185' + movie['poster_path'];
		var poster = document.createElement( 'img' );
		poster.className = 'poster'
		poster.src = posterUrl;
		poster.alt = 'Poster for ' + movie["original_title"];

		/* get full release data */
		var releaseDate = document.createElement( 'p' );
		releaseDate.className = 'release-date';
		releaseDate.innerHTML = '<strong>Release date: </strong>' + ( new Date( parseInt( movie['release_date'].slice( 0, 4 ) ), 
																				parseInt( movie['release_date'].slice( 5, 7 ) ), 
																				parseInt( movie['release_date'].slice( 8, 10 ) ) ) ).toString().slice(0, 15);

		/* get vot count */
		var voteCount = document.createElement( 'p' );
		voteCount.className = 'vote-count';
		voteCount.innerHTML = '<strong>Vote count: </strong>' + movie['vote_count'];

		/* get summary */
		var summary = document.createElement( 'p' );
		summary.className = 'summary';
		summary.innerHTML = '<strong>Synopsis: </strong>' + movie['overview'];

		/* add details to description section */
		description.appendChild( poster );
		description.appendChild( releaseDate );
		description.appendChild( voteCount );
		description.appendChild( summary );

		/* add description section to movie item div */
		listItem.appendChild( description );

		/* make title clickable to show/hide details */
		listItem.addEventListener( 'click', function()
		{
			listItem.className = listItem.className.includes( 'selected' ) ? 'item' : 'item selected';
			description.className = description.className.includes( 'hidden' ) ? 'description' : 'description hidden';
		});

		/* add movie to list of movies */
		movieList.appendChild( listItem );
	});
};

/**********************************************************************************************************************
 * Parse JSON movie object data into an array, and sort it based on specifications.
 *
 * @param: {JSON Object} data The movie data in JSON
 * @param: {string} sortKey The key specifying sort order
 * @param: {boolean} reverseOrder Whether to reverse the array or not
 * @return: {Object[]} The movie objects in array form
 */
var sortMovies = function( movies, sortKey, reverseOrder )
{
	// var movies = JSON.parse( data )['movies'];
	if ( sortKey === 'release_date' ) {
		movies.sort( function( movie1, movie2 )
		{
			return Date.parse( movie1[sortKey] ) - Date.parse( movie2[sortKey] );
		});
	}
	/* TODO: ignore 'the', 'a', etc. in titles */
	else if ( sortKey === 'original_title' ) {
		movies.sort( function( movie1, movie2 )
		{
			if ( movie1[sortKey] < movie2[sortKey] ) {
				return -1;
			}
			if ( movie1[sortKey] > movie2[sortKey] ) {
				return 1;
			}
			return 0;
		});
	}
	else if ( sortKey === 'vote_average' ) {
		movies.sort( function( movie1, movie2 )
		{
			return parseFloat( movie1[sortKey] ) - parseFloat( movie2[sortKey] );
		});
	}

	if ( reverseOrder ) {
		movies.reverse();
	}
	return movies;
};

/* get the movie JSON and display the information on document load */
window.addEventListener( 'load', function()
{
	getJSON( 'movies.json' ).then( function( response )
	{
		var movies = JSON.parse( response )['movies'];
		initializePage( movies ); // called once
	}).catch( function( error )
	{
		console.log( error.message );
	});
});
















