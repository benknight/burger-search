var wing_dev = 'http://www.wing-946e.dev.yelp.com';
var app_url = 'http://localhost/~ben/Code/burger-search';
var $views = $('#view div');
var $map = $('#map');
var $grid = $('#grid');
var $q = $('#query');
var gmaps;
var active_infowindow;
var markers = [];

var gallery_options = {
	'sizeSuffixes': {
		'lt100': '/l',
		'lt240': '/l',
		'lt320': '/l',
		'lt500': '/l',
		'lt640': '/l',
		'lt1024': '/o'
	},
	'usedSuffix': 'lt640',
	'justifyLastRow': false,
	'rowHeight': 150,
	'captions': true,
	'margins': 10
};

navigator.geolocation.getCurrentPosition(function(geo) {
	lat = String(geo.coords.latitude);
	lon = String(geo.coords.longitude);
	initMap();
	getPhotos();
});

// convert a photo URI to a different size
function convertPhotoURL(photo_url, to_size) {
	var re = /\/(o|l|m|s|xs|ls|ms|ss|xss|30s|60s|120).jpg/
	return photo_url.replace(re, '/' + to_size + '.jpg')
}

function getItemHTML(item) {
	var img = $('<img>').attr({
		'src': item.photo_url,
		'title': item.item_name,
		'alt': item.item_name + ' @ ' + item.biz_name
	});
	return $('<a>').attr({
		'href': 'http://yelp.com' + item.item_url,
		'title': item.item_name
	}).append(img);
}

function getPhotos(params) {

	$(document.body).addClass('loading');
	$grid.empty();

	// clear existing markers
	for ( var i = 0; i < markers.length; i++ ) {
		markers[i].setMap( null );
	}

	params = $.extend(
		{
			'term': $q.text(),
			'location': {
				'lat': lat,
				'lon': lon
			},
			'radius': 1.0
		},
		params
	);

	console.log(params);

	$.post(
		wing_dev + '/grid/search',
		{ 'params': JSON.stringify(params) },
		function(data) {
			$(document.body).removeClass('loading');

			$.each(data, function(index, item) {
				// grid
				$grid.append( getItemHTML(item) );

				// map
				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(
						item.location['lat'], item.location['long']
					),
					map: gmaps,
					icon: convertPhotoURL(item.photo_url, 'ss'),
					shadow: {
						url: app_url + '/img/marker-shadow.png',
						anchor: new google.maps.Point(23, 43)
					}
				});
				markers.push( marker );
				var infowindow = new google.maps.InfoWindow({
					content: [
						'<h3 style="margin: 0;">',
							'<a href="http://yelp.com' + item.item_url + '">',
								item.item_name,
							'</a>',
						'</h3>',
						'<p style="margin-top: .3em;">@ ' + item.biz_name + '</p>',
						'<img src="' + item.photo_url + '">'
					].join('')
				});
				google.maps.event.addListener(marker, 'click', function() {
					if ( active_infowindow ) {
						active_infowindow.close();
					}
					infowindow.open(gmaps, marker);
					active_infowindow = infowindow;
				});
			});
			$grid.justifiedGallery(gallery_options);
		}
	);
}

function initMap() {
	var latlng = new google.maps.LatLng(lat, lon);
	var mapOptions = {
		center: latlng,
		zoom: 16,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	gmaps = new google.maps.Map(document.getElementById('map'), mapOptions);
}

/** Keyboard Events */

// Focus query box on slash keypress
$(document).keyup(function(e) {
	if ( e.which == 191 && ! $q.is(':focus') ) { // slash
		$q.empty().focus();
	}
});

$q.keyup(function(e) {
	if ( e.which == 27 ) { // esc
		$q.blur();
	}
});

// handle query change
$q.keydown(function(e) {
	if ( e.which == 13 ) { // enter
		e.preventDefault();
		getPhotos({ 'term': $q.text() });
		$q.blur();
		$('#grid-toggle').trigger('click');
	}
});


/** View Toggle */
$('#view-toggle .btn').click(function() {
	if ( this.innerText == 'Grid' ) {
		$map.hide();
		$grid.show();
	}
	if ( this.innerText == 'Map' ) {
		$grid.hide();
		$map.show();
		google.maps.event.trigger(gmaps, 'resize');
		gmaps.setCenter(new google.maps.LatLng(lat, lon));
	}
	$(this).addClass('active').siblings().removeClass('active');
});
