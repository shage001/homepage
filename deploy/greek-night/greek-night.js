/**
 * Sam Hage
 * Is it greek night?
 * 11/2015
 */

readFile( 'today.txt', isItGreekNight );

/**********************************************************************************************************************
 * Functions to run on AJAX success and failure
 */
function xhrSuccess() { this.callback.apply( this ); }

function xhrError () { console.error( this.statusText ); }


/**********************************************************************************************************************
 * Try to load the file provided
 *
 * @param: {string} sURL Path to the file
 * @param: {function} fCallback Callback function
 */
function readFile ( sURL, fCallback )
{
	/* create a request and set its callback */
	var request = new XMLHttpRequest();
	request.callback = fCallback;
	request.onload = xhrSuccess;
	request.onerror = xhrError;

	/* open the request and send */
	request.open( 'GET', sURL, true );
	request.send( null );
}


/**********************************************************************************************************************
 * Determine if it's greek night based on the contents of today.txt
 */
function isItGreekNight()
{
	var isGreek = this.responseText.toLowerCase().includes( 'artichoke' ) &&
				  this.responseText.toLowerCase().includes( 'lamb' ) &&
				  this.responseText.toLowerCase().includes( 'pita' );
	console.log( isGreek );

	var response = document.getElementsByClassName( 'response' )[0];
	if ( isGreek ) {
		response.innerHTML = 'Yes! Hurry up and get to Ross!';
	}
	else {
		response.innerHTML = 'Nope! Sorry.';
	}
}











