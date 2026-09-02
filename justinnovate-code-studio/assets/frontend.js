( function () {
	function initSlider( root ) {
		var track = root.querySelector( '.csx-track' );
		var slides = [].slice.call( track.querySelectorAll( '.csx-slide' ) );
		var prev = root.querySelector( '.csx-prev' );
		var next = root.querySelector( '.csx-next' );
		var dashTrack = root.querySelector( '.csx-dash-track' );
		var dashColor = dashTrack ? dashTrack.getAttribute( 'data-dash-color' ) || '#3157DF' : '#3157DF';
		var autoplay = parseInt( root.getAttribute( 'data-autoplay' ), 10 ) || 5200;
		var pauseOnHover = root.getAttribute( 'data-pause-hover' ) === '1';
		var current = 0;
		var timer = null;

		slides.forEach( function () {
			var d = document.createElement( 'div' );
			d.className = 'csx-dash';
			var span = document.createElement( 'span' );
			span.style.background = dashColor;
			d.appendChild( span );
			dashTrack.appendChild( d );
		} );
		var dashes = [].slice.call( dashTrack.querySelectorAll( '.csx-dash' ) );

		function render() {
			slides.forEach( function ( s, i ) {
				s.classList.toggle( 'is-active', i === current );
			} );
			dashes.forEach( function ( d, i ) {
				d.classList.remove( 'is-active', 'is-filled', 'is-animating' );
				var span = d.querySelector( 'span' );
				if ( i < current ) {
					d.classList.add( 'is-filled' );
				} else if ( i === current ) {
					d.classList.add( 'is-active' );
					void d.offsetWidth;
					if ( slides.length > 1 ) {
						d.classList.add( 'is-animating' );
						span.style.transitionDuration = autoplay + 'ms';
					}
				}
			} );
		}

		function go( i, isUserAction ) {
			current = ( i + slides.length ) % slides.length;
			render();
			if ( isUserAction ) {
				restart();
			}
		}

		function restart() {
			clearInterval( timer );
			if ( slides.length > 1 ) {
				timer = setInterval( function () {
					go( current + 1, false );
				}, autoplay );
			}
		}

		if ( next ) next.onclick = function () { go( current + 1, true ); };
		if ( prev ) prev.onclick = function () { go( current - 1, true ); };
		dashes.forEach( function ( d, i ) {
			d.onclick = function () { go( i, true ); };
		} );

		if ( pauseOnHover ) {
			root.addEventListener( 'mouseenter', function () { clearInterval( timer ); } );
			root.addEventListener( 'mouseleave', restart );
		}

		var startX = 0;
		track.addEventListener( 'touchstart', function ( e ) { startX = e.touches[ 0 ].clientX; }, { passive: true } );
		track.addEventListener( 'touchend', function ( e ) {
			var dx = e.changedTouches[ 0 ].clientX - startX;
			if ( Math.abs( dx ) > 40 ) go( dx < 0 ? current + 1 : current - 1, true );
		}, { passive: true } );

		render();
		restart();
	}

	function initAll() {
		document.querySelectorAll( '.csx-banner-root' ).forEach( function ( root ) {
			if ( root.dataset.jcsInit === '1' ) return;
			root.dataset.jcsInit = '1';
			initSlider( root );
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initAll );
	} else {
		initAll();
	}
} )();
