var FFCommunityMapWidget = function(settings, map_options, link) {
  
  var renderPopup = function (props) {
    //console.log(props);
    //clean up values before rendering
    if (props.url && !props.url.match(/^http([s]?):\/\/.*/)) { 
      props.url = "http://" + props.url; 
    }
    if (props.email && !props.email.match(/^mailto:.*/)) {
      props.email = "mailto:" + props.email;
    }
    if (props.twitter && !props.twitter.match(/^http([s]?):\/\/.*/)) {
      props.twitter = "https://twitter.com/" + props.twitter;
    }
    if (props.irc && !props.irc.match(/^irc:.*/)) {
      props.irc = "irc:" + props.irc;
    }
    if (props.jabber && !props.jabber.match(/^jabber:.*/)) {
      props.jabber = "xmpp:" + props.jabber;
    }
    if (props.identica && !props.identica.match(/^identica:.*/)) {
      props.identica = "identica:" + props.identica;
    }
 
    function getAgeFromProperties(props) {
      var ageindays = -1;
      if (props.mtime) {
        ageindays = Math.round((Math.round(+new Date()/1000) - props.mtime) / (3600*24));
      } 
      return ageindays;
    };
    
    function getStateFromProperties(props) {
      var state = 'unknown';
      if (props.mtime) {
        var ageindays = getAgeFromProperties(props);
        if (ageindays < 0 || isNaN(ageindays)) {
          state = 'unknown';
        } else if (ageindays < 2) {
          state = 'up-to-date';
        } else if (ageindays < 7) {
          state = 'valid';
        } else {
          state = 'outdated';
        }
      } 
      return state;
    };
    props.age = getAgeFromProperties(props);
    props.state = getStateFromProperties(props);
    
    props.contacts =  [];
    if (props.url) {
      props.contacts.push({
        type: 'www',
         url : props.url
      });
    }

    if (props.email) {
      props.contacts.push({
        type: 'email',
        url : props.email
      });
    }

    if (props.facebook) {
      props.contacts.push({
        type: 'facebook',
        url : props.facebook
      });
    }

    if (props.twitter) {
      props.contacts.push({
        type: 'twitter',
        url : props.twitter
      });
    }

    if (props.irc) {
      props.contacts.push({
        type: 'irc',
        url : props.irc
      });
    }

    if (props.jabber) {
      props.contacts.push({
        type: 'jabber',
        url : props.jabber
      });
    }

    if (props.identica) {
      props.contacts.push({
        type: 'identica',
        url : props.identicy
      });
    }

    if (props.googleplus) {
      props.contacts.push({
        type: 'googleplus',
        url : props.googleplus
      });
    }
    
    
    //render html and return
    return widget.communityTemplate(props);
  };
  
  var options = L.extend({
    divId: settings.divId || 'map',
    geoJSONUrl: settings.geoJson,
    getPopupHTML: renderPopup,
    zoom: 3,
    maxZoom: 8,
    center: [46.2830,86.6700]
  }, options);
  
  var widget = {};
  widget.map = L.map(options.divId, map_options);
  widget.map.setView(
    options.center,
    options.zoom
  );
  
  var mapboxLayer = L.tileLayer('https://{s}.tiles.mapbox.com/v3/andibraeu.kd6ccoce/{z}/{x}/{y}.png', {
attribution: '<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox &copy; OpenStreetMap</a> <a class="mapbox-improve-map" href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a>'
  });
  
  var osmlayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  });
  
  //set default layer
  widget.map.addLayer(osmlayer);
  
  var clusters = L.markerClusterGroup({ 
    spiderfyOnMaxZoom: true, 
    showCoverageOnHover: false, 
    maxClusterRadius: 40 
  }).addTo(widget.map);
  
  //disable srolling
  if (!settings.scrollByMousewheel) {
    widget.map.scrollWheelZoom.disable();
  }
  if (!settings.hideLocationButton) {
    var locationButton = new L.Control.Button({
      iconUrl: settings.currentDir + "images/location-icon.png",
      hideText: true,
      doToggle: false,
      onClick: function(e) {
          var btn = jQuery(this);
          /* disable the location button visually if location permission is not granted */
          widget.map.on('locationerror', function(e) {
            if (e.code == 1 /*PERMISSION_DENIED*/) {
              btn.addClass('disabled');
              console.log(btn);
            }
          });
          /* try to read the user location and center map there */
          widget.map.locate({
            setView: true, 
            maxZoom: 8, 
            timeout: 30000
          });
        }
    });
    widget.map.addControl(locationButton);
  }
  
  if (!settings.hideLayerControl) {
    var controls = L.control.layers({
      "Gray": mapboxLayer,
      "OSM": osmlayer
    }).addTo(widget.map);
  }

  function createGeoJSONLayer(geojson, filterFunction) {
    return L.geoJson(geojson, {
      onEachFeature: function(feature, layer) {
        layer.bindPopup(options.getPopupHTML(feature.properties), { minWidth: 210 });
      },
      filter: filterFunction,
      pointToLayer: function(feature, latlng) {
        var marker = L.circleMarker(latlng, {
          //title: feature.properties.name,
          //riseOnHover: true
          stroke: true,
          weight: 10,
          opacity: 0.3,
          color: '#d40000',
          fill: true,
          fillColor: '#d40000',
          fillOpacity: 0.7
        });
        return marker;
      }
    });
  }

  var savedGeoJson;
  function filterMapByCountries(countryCodes) {
    clusters.clearLayers();
    createGeoJSONLayer(savedGeoJson, function(feature, layer) {
      if (feature.geometry.coordinates[0] && feature.geometry.coordinates[1] && countryCodes.indexOf(feature.properties.country) != -1) {
        return true;
      } else {
        return false;
      }
    })
    .addTo(clusters);
  }

  jQuery.getJSON(options.geoJSONUrl, function(geojson) {
      savedGeoJson = geojson;

      // extract countries list
      var countriesList = {};
      jQuery.each(geojson.features, function(k, v) {
        var countryCode = v.properties.country;
        if (countriesList[countryCode] == undefined)
          countriesList[countryCode] = countryCode; 
      });

       var CustomFilterControl = L.Control.extend({
          options: {
            position: 'topright'
          },
           onAdd: function (map) {
              var container = L.DomUtil.create('div', 'leaflet-filter-control');
              var selectList = jQuery(container).append('<div class="leaflet-filter-control-toggle"></div><div class="leaflet-control-countries-list">')
                .find('.leaflet-control-countries-list');
              for (var key in countriesList) {
                selectList.append('<label><input type="checkbox" value="' + key + '"><span>' + countriesList[key] + '</span>');
                selectList.find('input[type="checkbox"]').click(function(e) {
                  var selectedCountries = [];
                  selectList.find('input[type="checkbox"]:checked').each(function(k, v) {
                    selectedCountries.push(v.value);
                  });
                  filterMapByCountries(selectedCountries);
                })
              }
              return container;
          }
        });
        widget.map.addControl(new CustomFilterControl());

      // create geojson map layer
      createGeoJSONLayer(savedGeoJson, function(feature, layer) {
        if (feature.geometry.coordinates[0] && feature.geometry.coordinates[1]) {
          return true;
        } else {
          return false;
        }
      })
      .addTo(clusters);
    
    //add stats info box
    if (!settings.hideInfoBox) {
      var legend = L.control({position: 'bottomleft'});
      legend.onAdd = function(data) {
        var div = L.DomUtil.create('div', 'info');
        var nodes = 0;
        _.each(geojson.features, function(item, key, list) {
          if (item.properties.nodes) { nodes += parseInt(item.properties.nodes); }
        });
        div.innerHTML = '<strong>' + geojson.features.length + ' Orte</strong>';
        div.innerHTML += '<hr>';
        div.innerHTML += '<strong>' + nodes + ' Zugänge</strong>';
        return div;
      };
      legend.addTo(widget.map);
    }
  });
  
  //initialize underscore templating
  _.templateSettings.variable = "props";
  widget.communityTemplate = _.template(
    jQuery( "script.template#community-popup" ).html()
  );
  
  widget.map.on('popupopen', function(e){
    var url = 'http://feed-fossasia-api.herokuapp.com//feed.php?limit=3&source='
        + e.popup._contentNode.getElementsByClassName('community-popup')[0].getAttribute('data-id');
    console.log(url);
    jQuery.ajax({
      url: url,
      error: function(err) {
        console.log(err);
      },
      success: function(data) {
        $data = jQuery(data);
        items = $data.find('item');
        if (items.length > 0) {
          console.log('There are some items');
          var rssfeed = jQuery(e.popup._container).find('.community-popup').append('<div class="rssfeed">').find('.rssfeed');
          rssfeed.append('<label>Recent posts</label>');
          items.each(function(k, item) {
            var blogLink = rssfeed.append('<a class="bloglink" target="_blank">' + jQuery(item).find('title').text() + '</a>').find('a').last();
            blogLink.attr('href', jQuery(item).find('link').text());
          });
        }
      },
      timeout: 20000
    });
  })
  return widget;
}
