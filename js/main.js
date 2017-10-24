var app = angular.module('mapApp', []);

var map;
var markers = [];
var directions = [];
var i;
var infowindow = new google.maps.InfoWindow({
    content: ''
});

app.controller('mapAppCtrl', function($scope) {
    $scope.marker = null;
    $scope.currentTour = 0;
    $scope.DataPoints = [{
      'id': 'point1',
      'text': 'point1',
      'position': [ 43.1365, 131.911]
    }, {
      'id': 'point2',
      'text': 'point2',
      'position': [43.1056, 131.8735]
    }];
    $scope.Tours = [[{
      'id': 'point1',
      'text': 'point1',
      'position': [43.1365, 131.911]
    }, {
      'id': 'point2',
      'text': 'point2',
      'position': [43.1056, 131.8735]
    }]];
    $scope.ToursInformation=[
    {
      "DriverName": "Alex",
      "RouteName" : "Route1"
    }];
    $scope.copyid = 0;
    $scope.posid = 0;
    $scope.ViewTours = false;
    $scope.deleteTourPoint = function(index){
      for ( i = 0 ; i < directions.length; i ++){
        directions[i].setMap(null);
      }
      $scope.Tours[$scope.currentTour].splice(index, 1);
      for (i = 0; i < $scope.Tours[$scope.currentTour].length - 1; i++) {
          $scope.calculateAndDisplayRoute(i);
      }
    }
    $scope.deletePoint = function(index){
      markers[index].setMap(null);
      markers.splice(index, 1);
      $scope.DataPoints.splice(index, 1);
    }
    $scope.NewTour = function(){
      if($scope.formRouteName == null) {
        alert("Please input the Route name.");
        return;
      }
      $scope.ToursInformation.push({
        "DriverName": $scope.formDriverName,
        "RouteName" : $scope.formRouteName
      });
      $scope.Tours.push([]);
    }
    $scope.gotoTour = function(index){
      $scope.ViewTours = false;
      $scope.currentTour = index;
      for ( i = 0 ; i < directions.length; i ++){
        directions[i].setMap(null);
      }
      directions = [];
      for (i = 0; i < $scope.Tours[$scope.currentTour].length - 1; i++) {
          $scope.calculateAndDisplayRoute(i);
      }
    }
    $scope.CopyItem = function(origin, dest, item_id) {
      if (origin == dest) return;

      for (i = 0; i < $scope.DataPoints.length; i++) {
        if ($scope.DataPoints[i].id == item_id) {

          var item_copy = {
            'id': "copy" + $scope.copyid,
            'text': $scope.DataPoints[i].text,
            'position': $scope.DataPoints[i].position
          };
          $scope.copyid += 1;

          $scope.Tours[$scope.currentTour].push( item_copy );
          break;
        }
      }

      $scope.$apply();
    }

    $scope.initialize = function () {
        var haightAshbury = new google.maps.LatLng(43.1365, 131.911);
        var mapOptions = {
            zoom: 12,
            center: haightAshbury,
            mapTypeId: google.maps.MapTypeId.TERRAIN
        };
        map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);

        google.maps.event.addListener(map, 'click', function (event) {
            // Dont add this marker if you don't want users markers. Closest function will still work.
            $scope.addMarker(event.latLng);
        });
        var posArr = $scope.Tours[$scope.currentTour];
        for (i = 0; i < posArr.length; i++) {
            marker = new google.maps.Marker({
                title: posArr[i]['text'],
                position: new google.maps.LatLng(posArr[i]['position'][0], posArr[i]['position'][1]),
                map: map
            });
            markers.push(marker);

            google.maps.event.addListener(marker, 'click', (function (marker, i) {
                return function () {
                    infowindow.setContent(posArr[i]['text']);
                    infowindow.open(map, marker);
                }
            })(marker, i));
        }
        for (i = 0; i < posArr.length - 1; i ++) {
          $scope.calculateAndDisplayRoute(i);
        }
    }

    $scope.addMarker = function (location) {
      if($scope.marker){
        $scope.marker.setMap(null);
        $scope.marker = null;
      }
      $scope.marker = new google.maps.Marker({
            title: 'User added marker',
            // Just to differ from default markers
            icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 5
            },
            position: location,
            map: map
      });
      $scope.latpos = location.lat();
      $scope.lngpos = location.lng();

      var geocoder = new google.maps.Geocoder();
      geocoder.geocode({
          "latLng":location
      }, function (results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            $scope.postext = results[5].formatted_address;
            $scope.$apply();
          }
      });        
      $scope.$apply();
    }

    $scope.AddPosition = function(){
      if($scope.postext == null)  $scope.postext = "DefaultText";
      if($scope.latpos == null || $scope.lngpos == null){
        alert("Position is incorrect");
        return;
      }
      $scope.DataPoints.push({
        'id': "posid" + $scope.posid,
        'text': $scope.postext,
        'position': [$scope.latpos, $scope.lngpos]
      });

      $scope.posid += 1;

      if($scope.marker) {
        $scope.marker.setMap(null);
        $scope.marker = null;
      }
      var marker = new google.maps.Marker({
        title: 'User added marker',
        position: new google.maps.LatLng($scope.latpos, $scope.lngpos),
        map: map
      });

      markers.push(marker);
      $scope.latpos = null;
      $scope.lngpos = null;
      $scope.postext = null;
    }

    $scope.CancelPosition = function(){
      if($scope.marker){
        $scope.marker.setMap(null);
        $scope.marker = null;
      }
      $scope.latpos = null;
      $scope.lngpos = null;
      $scope.postext = null;
    }

   $scope.calculateAndDisplayRoute = function(i) {
      if (i == -1) return;
      var posArr = $scope.Tours[$scope.currentTour];
      var pointA = new google.maps.LatLng(posArr[i]['position'][0], posArr[i]['position'][1]);
      var pointB = new google.maps.LatLng(posArr[i+1]['position'][0], posArr[i+1]['position'][1]);

      var directionsService = new google.maps.DirectionsService,
        directionsDisplay = new google.maps.DirectionsRenderer({
          map: map
        });
      var direction = directionsService.route({
        origin: pointA,
        destination: pointB,
        avoidTolls: true,
        avoidHighways: false,
        travelMode: google.maps.TravelMode.DRIVING
      }, function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          directionsDisplay.setDirections(response);
          directions.push(directionsDisplay);
        }
        else {
          window.alert('Directions request failed due to ' + status);
        }
      });
    }
    angular.element(document).ready($scope.initialize);
});

app.directive('draggable', function() {
  return function(scope, element, attrs) {

    var el = element[0];
    el.draggable = true; 


    el.addEventListener(
      'dragstart',
      function(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('item_id', this.id);
        e.dataTransfer.setData('origin_id', el.parentElement.id);
        this.classList.add('dragging');
        return false;
      }, false
    );

    el.addEventListener(
      'dragend',
      function(e) {
        this.classList.remove('dragging');
        return false;
      },
      false
    );
  }
});

app.directive('droppable', function() {
  return function(scope, element, attrs) {
    // Get the native element
    var el = element[0];

    // Add event listeners
    el.addEventListener(
      'dragover',
      function(e) {
        e.preventDefault(); // Allow the drop

        // Set effects
        e.dataTransfer.dropEffect = 'move';
        this.classList.add('dragover');
        return false;
      }, false
    );

    el.addEventListener(
      'dragenter',
      function(e) {
        this.classList.add('dragover');
        return false;
      }, false
    );

    el.addEventListener(
      'dragleave',
      function(e) {
        this.classList.remove('dragover');
        return false;
      }, false
    );

    el.addEventListener(
      'drop',
      function(e) {
        this.classList.remove('dragover');

        // Get the data
        var destination = this.id;
        var item_to_move = e.dataTransfer.getData('item_id');
        var origin = e.dataTransfer.getData('origin_id');

        // Call the scope move function
        scope.CopyItem(origin, destination, item_to_move);
        scope.calculateAndDisplayRoute(scope.Tours[scope.currentTour].length - 2);

        return false;
      }, false
    );
  }
});