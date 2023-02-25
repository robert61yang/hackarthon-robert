
let searchText = "";
let spotType = "";
var geocoder;
var numArray = ['1', '2', '3', '4', '5', '6','7', '8', '9', '10'];
var istable = false;
var tempmarkersArray = [];
const tempicon = "https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=T|FFFFFF|000000";
var tselected = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
var openmarktable = false;
var len = 0;
var ConcernTime;
var ConcernPlace;
var PS;

window.onload = function() {
    const useNodeJS = true;   // if you are not using a node server, set this value to false
    const defaultLiffId = "";   // change the default LIFF value if you are not using a node server

    // DO NOT CHANGE THIS
    let myLiffId = "";

    // if node is used, fetch the environment variable and pass it to the LIFF method
    // otherwise, pass defaultLiffId
    if (useNodeJS) {
        fetch('/send-id')
            .then(function(reqResponse) {
                return reqResponse.json();
            })
            .then(function(jsonResponse) {
                myLiffId = jsonResponse.id;
                initializeLiffOrDie(myLiffId);
            })
            .catch(function(error) {
                document.getElementById("liffAppContent").classList.add('hidden');
                document.getElementById("nodeLiffIdErrorMessage").classList.remove('hidden');
            });
    } else {
        myLiffId = defaultLiffId;
        initializeLiffOrDie(myLiffId);
    }
};

let map;
let bounds;
function initMap() {
    geocoder = new google.maps.Geocoder();
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 25.02, lng:  121.3},
    zoom: 15,
    });
    directionsRenderer.setMap(map);
    const onChangeHandler = function () {
        calculateAndDisplayRoute(directionsService, directionsRenderer);
    };
    document.getElementById("start").addEventListener("change", onChangeHandler);
    document.getElementById("end").addEventListener("change", onChangeHandler);
    bounds = new google.maps.LatLngBounds();
}

///destination matrix
function destinationMap(origins, destinations, draw) {
    const markersArray = [];
    const destinationIcon = "https://chart.googleapis.com/chart?" +"chst=d_map_pin_letter&chld=D|FF0000|000000";
    const originIcon = "https://chart.googleapis.com/chart?" +"chst=d_map_pin_letter&chld=O|FFFF00|000000";
    const geocoder = new google.maps.Geocoder();
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
          origins: [origins],
          destinations: [destinations],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false,
      },
      (response, status) => {
          if (status !== "OK") {
            alert("Error was: " + status);
          } else {
            const originList = response.originAddresses;
            const destinationList = response.destinationAddresses;
            const outputDiv = document.getElementById("output");
            outputDiv.innerHTML = "";
            deleteMarkers(markersArray);
            const showGeocodedAddressOnMap = function (asDestination) {
              const icon = asDestination ? destinationIcon : originIcon;
              return function (results, status) {
                if (status === "OK") {
                  map.fitBounds(bounds.extend(results[0].geometry.location));
                  if(draw){
                  markersArray.push(
                    new google.maps.Marker({
                      map,
                      position: results[0].geometry.location,
                      icon: icon,
                    })
                  );
                  }
                }else {
                   alert("Geocode was not successful due to: " + status);
                }
              };
            };
    
            for (let i = 0; i < originList.length; i++) {
              const results = response.rows[i].elements;
              geocoder.geocode(
                 { address: originList[i] },
                 showGeocodedAddressOnMap(false)
              );
    
              for (let j = 0; j < results.length; j++) {
                 geocoder.geocode(
                    { address: destinationList[j] },
                    showGeocodedAddressOnMap(true)
                 );
                  outputDiv.innerHTML +=
                    "  Distance :" +
                    results[j].distance.text +
                    "  Duration : " +
                    results[j].duration.text +
                    "<br>";
                  if(draw) return results[j].duration.value;
              }
            }
          }
      }
    );
  }
    
  function deleteMarkers(markersArray) {
      for (let i = 0; i < markersArray.length; i++) {
        markersArray[i].setMap(null);
      }
      markersArray = [];
  }
  
  ///direction
  /*document.getElementById("start").addEventListener("change", onChangeHandler);
  document.getElementById("end").addEventListener("change", onChangeHandler);*/
  function calculateAndDisplayRoute(directionsService, directionsRenderer) {
      let a = document.getElementById("start").value;
      let b = document.getElementById("end").value;
      let c1 = document.getElementById("resultaddress"+numArray[a-1]).textContent;
      let d1 = document.getElementById("resultaddress"+numArray[b-1]).textContent;
      const geocoder = new google.maps.Geocoder();
      function geocodeAddress(geocoder, resultsMap) {
        const address = c1;
        geocoder.geocode({ address: address }, (results, status) => {
          if (status === "OK") {
            c1 = results[0].geometry.location;
          } else {
            alert("Geocode was not successful for the following reason: " + status);
          }
        });
        address = d1;
        geocoder.geocode({ address: address }, (results, status) => {
          if (status === "OK") {
            d1 = results[0].geometry.location;
          } else {
            alert("Geocode was not successful for the following reason: " + status);
          }
        });
      }
      destinationMap(c1, d1, 0);
      directionsService.route(
          {
          origin: {
             query: c1,
          },
          destination: {
             query: d1,
          },
          travelMode: google.maps.TravelMode.DRIVING,
          },
          (response, status) => {
          if (status === "OK") {
             directionsRenderer.setDirections(response);
             //map.setCenter(c1);
          } else {
             window.alert("Directions request failed due to " + status);
          }
          }
      );        
  }


/**
* Check if myLiffId is null. If null do not initiate liff.
* @param {string} myLiffId The LIFF ID of the selected element
*/
function initializeLiffOrDie(myLiffId) {
    if (!myLiffId) {
        document.getElementById("liffAppContent").classList.add('hidden');
        document.getElementById("liffIdErrorMessage").classList.remove('hidden');
    } else {
        initializeLiff(myLiffId);
    }
}

/**
* Initialize LIFF
* @param {string} myLiffId The LIFF ID of the selected element
*/
function initializeLiff(myLiffId) {
    liff
        .init({
            liffId: myLiffId
        })
        .then(() => {
            // start to use LIFF's api
            initializeApp();
        })
        .catch((err) => {
            document.getElementById("liffAppContent").classList.add('hidden');
            document.getElementById("liffInitErrorMessage").classList.remove('hidden');
        });
}

/**
 * Initialize the app by calling functions handling individual app components
 */


function initializeApp() {
    initMap();
    displayLiffData();
    displayIsInClientInfo();
    registerButtonHandlers();

    

    // check if the user is logged in/out, and disable inappropriate button
    if (liff.isLoggedIn()) {
        document.getElementById('liffLoginButton').disabled = true;
    } else {
        document.getElementById('liffLogoutButton').disabled = true;
    }
}

/**
* Display data generated by invoking LIFF methods
*/
function displayLiffData() {
    document.getElementById('browserLanguage').textContent = liff.getLanguage();
    document.getElementById('sdkVersion').textContent = liff.getVersion();
    document.getElementById('lineVersion').textContent = liff.getLineVersion();
    document.getElementById('isInClient').textContent = liff.isInClient();
    document.getElementById('isLoggedIn').textContent = liff.isLoggedIn();
    document.getElementById('deviceOS').textContent = liff.getOS();
}

/**
* Toggle the login/logout buttons based on the isInClient status, and display a message accordingly
*/
function displayIsInClientInfo() {
    if (liff.isInClient()) {
        document.getElementById('liffLoginButton').classList.toggle('hidden');
        document.getElementById('liffLogoutButton').classList.toggle('hidden');
        document.getElementById('isInClientMessage').textContent = 'You are opening the app in the in-app browser of LINE.';
    } else {
        document.getElementById('isInClientMessage').textContent = 'You are opening the app in an external browser.';
        document.getElementById('shareTargetPicker').classList.toggle('hidden');
    }
}

/**
* Register event handlers for the buttons displayed in the app
*/
function registerButtonHandlers() {
    // openWindow call
    document.getElementById('openWindowButton').addEventListener('click', function() {
        liff.openWindow({
            url: 'https://line.me',
            external: true
        });
    });

    // closeWindow call
    document.getElementById('closeWindowButton').addEventListener('click', function() {
        if (!liff.isInClient()) {
            sendAlertIfNotInClient();
        } else {
            liff.closeWindow();
        }
    });

    // sendMessages call
    document.getElementById('sendMessageButton').addEventListener('click', function() {
        if (!liff.isInClient()) {
            sendAlertIfNotInClient();
        } else {
            liff.sendMessages([{
                'type': 'text',
                'text': "You've successfully sent a message! Hooray!"
            }]).then(function() {
                window.alert('Message sent');
            }).catch(function(error) {
                window.alert('Error sending message: ' + error);
            });
        }
    });

    // scanCode call
    document.getElementById('scanQrCodeButton').addEventListener('click', function() {
        if (!liff.isInClient()) {
            sendAlertIfNotInClient();
        } else {
            liff.scanCode().then(result => {
                // e.g. result = { value: "Hello LIFF app!" }
                const stringifiedResult = JSON.stringify(result);
                document.getElementById('scanQrField').textContent = stringifiedResult;
                toggleQrCodeReader();
            }).catch(err => {
                document.getElementById('scanQrField').textContent = "scanCode failed!";
            });
        }
    });

    // get access token
    document.getElementById('getAccessToken').addEventListener('click', function() {
        if (!liff.isLoggedIn() && !liff.isInClient()) {
            alert('To get an access token, you need to be logged in. Please tap the "login" button below and try again.');
        } else {
            const accessToken = liff.getAccessToken();
            document.getElementById('accessTokenField').textContent = accessToken;
            toggleAccessToken();
        }
    });

    // get profile call
    document.getElementById('getProfileButton').addEventListener('click', function() {
        liff.getProfile().then(function(profile) {
            document.getElementById('userIdProfileField').textContent = profile.userId;
            document.getElementById('displayNameField').textContent = profile.displayName;

            const profilePictureDiv = document.getElementById('profilePictureDiv');
            if (profilePictureDiv.firstElementChild) {
                profilePictureDiv.removeChild(profilePictureDiv.firstElementChild);
            }
            const img = document.createElement('img');
            img.src = profile.pictureUrl;
            img.alt = 'Profile Picture';
            profilePictureDiv.appendChild(img);

            document.getElementById('statusMessageField').textContent = profile.statusMessage;
            toggleProfileData();
        }).catch(function(error) {
            window.alert('Error getting profile: ' + error);
        });
    });

    document.getElementById('shareTargetPicker').addEventListener('click', function () {
        if (liff.isApiAvailable('shareTargetPicker')) {
            liff.shareTargetPicker([{
                'type': 'text',
                'text': 'Hello, World!'
            }]).then(
                document.getElementById('shareTargetPickerMessage').textContent = "Share target picker was launched."
            ).catch(function (res) {
                document.getElementById('shareTargetPickerMessage').textContent = "Failed to launch share target picker.";
            });
        }
    });

    // login call, only when external browser is used
    document.getElementById('liffLoginButton').addEventListener('click', function() {
        if (!liff.isLoggedIn()) {
            // set `redirectUri` to redirect the user to a URL other than the front page of your LIFF app.
            liff.login();
        }
    });

    // logout call only when external browse
    document.getElementById('liffLogoutButton').addEventListener('click', function() {
        if (liff.isLoggedIn()) {
            liff.logout();
            window.location.reload();
        }
    });

    //searchPlace
    document.getElementById('inputPlace').addEventListener('keyup', function (event) {
        searchText = event.target.value;
        //console.log("searchinput="+searchText);
        
        //console.log(spotType);
    });

    document.getElementById('searchButton').addEventListener('click', function() {
        if(openmarktable==true){
            openmarktable = false;
            document.getElementById("marktable").classList.add("hidden");
            let table = document.getElementById("marktable");
            for(let i=0;i<len;i++){    
                table.deleteRow(-1);
            }
        }
        for(let i=0;i<10;i++){
            if(tselected[i] != -1){
                document.getElementById("trow"+numArray[i]).classList.remove("selected");
                tselected[i] = -1;
            }
        }
        deleteMarkers(tempmarkersArray);
        geocoder.geocode( { 'address': searchText}, function(results, status) {
            let e = document.getElementById('spottype')
            spotType = e.options[e.selectedIndex].value;
            console.log(spotType);
            if (status == 'OK') {
                //map.setCenter(results[0].geometry.location);
                //map.fitBounds(bounds.extend(results[0].geometry.location));  
                map.setCenter(results[0].geometry.location);
                console.log(results[0].geometry.location);
                var request = {
                    location: results[0].geometry.location,
                    radius: '500',
                    type: [spotType,],
                };
                service = new google.maps.places.PlacesService(map);
                service.nearbySearch(request, callbackSearch);
            } else {
              alert('Geocode was not successful for the following reason: ' + status);
            }
          });
        
    });

    document.getElementById("hidesearch").addEventListener('click',function() {
        if(istable == true){
            istable = false;
            deleteMarkers(tempmarkersArray);
            document.getElementById("searchtable").classList.add("hidden");
        }
    });
    //console.log("@@@@@@@")
    for(let i=0;i<10;i++){
        document.getElementById("trow"+numArray[i]).addEventListener('click', function(){
            if(tselected[i]== -1){
                tselected[i] = 1;
                document.getElementById("trow"+numArray[i]).classList.add("selected");                
                liff.getProfile().then((result) => {
                    const authname = result.displayName;
                    fetch('/mymap/setmark', {
                      method: 'POST',
                      headers: {
                        'content-type': 'application/json'
                      },
                      body: JSON.stringify({
                        author: authname,
                        name: document.getElementById("resultname"+numArray[i]).textContent ,
                        address: document.getElementById("resultaddress"+numArray[i]).textContent ,
                      })
                    })

                  });

            }       
        });
    };
    //console.log("@@@@@@@")


    
    //open marker table
    document.getElementById("openmarktable").addEventListener('click',function(){
        if(openmarktable == false){
            if(istable == true){
                istable = false;
                deleteMarkers(tempmarkersArray);
                document.getElementById("searchtable").classList.add("hidden");
            }

                openmarktable = true;
                const geocoder = new google.maps.Geocoder();
                document.getElementById("marktable").classList.remove("hidden");
                fetch('/mymap/getmarks',{
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(function (result) {
                    console.log(result);
                    return result.json()
                }).then(json => {
                    console.log(json[0].name);
                    let table = document.getElementById("marktable");
                    len = json.length;
                    var suremarkersArray = [];
                    for(i=0;i<json.length;i++){
                        let row = table.insertRow(-1);
                        //row.innerHTML = '<td scope="row"></td>'
                        row.innerHTML = '<td scope="row">'+numArray[i]+'</td><td id="markname1">'+json[i].name+'</td><td id="markaddress1">'+json[i].address+'</td><td id="markrating1">'+json[i].author+'</td>'
                                geocoder.geocode({ address: json[i].address }, (results, status) => {
                                    if (status === "OK") {
                                        suremarkersArray.push(
                                            new google.maps.Marker({
                                                map,
                                                position: results[0].geometry.location,
                                                icon: "https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=S|FF0000|000000",
                                            })
                                          );
                                    } else {
                                        alert("Geocode was not successful for the following reason: " + status);
                                    }
                                });
                    }
                })

                

        }else{
            openmarktable = false;
            document.getElementById("marktable").classList.add("hidden");
            let table = document.getElementById("marktable");
            for(let i=0;i<len;i++){    
                table.deleteRow(-1);
            }
        }
    })

}

function deleteMarkers(markersArray) {
    for (let i = 0; i < markersArray.length; i++) {
      markersArray[i].setMap(null);
    }
    markersArray = [];
}

function callbackSearch(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      for (var i = 0; i < 10; i++) {
        //createMarker(results[i]);

        if(results[i]){
            tempmarkersArray.push(
                new google.maps.Marker({
                  map,
                  position: results[i].geometry.location,
                  icon: "https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld="+numArray[i]+"|FFFFFF|000000",
                })
              );
            document.getElementById("resultname"+numArray[i]).textContent = results[i].name;
            document.getElementById("resultaddress"+numArray[i]).textContent = results[i].vicinity;
            document.getElementById("resultrating"+numArray[i]).textContent = results[i].rating;
        }else{
            document.getElementById("resultname"+numArray[i]).textContent = '';
            document.getElementById("resultaddress"+numArray[i]).textContent = '';
            document.getElementById("resultrating"+numArray[i]).textContent = '';
        }

        
        //console.log(results[i]);
      }
      if(istable==false){
        istable = true;
        document.getElementById("searchtable").classList.remove("hidden");
    }
    
      
    }else{
        for(var i=0;i<10;i++){
            document.getElementById("resultname"+numArray[i]).textContent = '';
            document.getElementById("resultaddress"+numArray[i]).textContent = '';
            document.getElementById("resultrating"+numArray[i]).textContent = '';
        }
    }

    document.getElementById('ConcernTime').addEventListener('keyup', function (event) {
        ConcernTime = event.target.value;
    });
    document.getElementById('ConcernPlace').addEventListener('keyup', function (event) {
        ConcernPlace = event.target.value;
    });
    document.getElementById('PScb').addEventListener('keyup', function (event) {
        PS = event.target.value;
    });

    
    document.getElementById('sendschedule').addEventListener('click', function() {
        if (!liff.isInClient()) {
            sendAlertIfNotInClient();
        } else {
            liff.getProfile().then((result) => {
                const authname = result.displayName;
                fetch('/mymap/getmarks',{
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(function (result) {
                    console.log(result);
                    return result.json()
                }).then(json => {
                    var abc = json[parseInt(ConcernPlace)].name;
                    liff.sendMessages([{
                        'type': 'text',
                        'text': 'Departure time : ' + ConcernTime + '\n' + 'Destination :' + abc + '\n' + 'P.S.' + PS,
                    }]).then(function() {
                        window.alert('Message sent');
                    }).catch(function(error) {
                        window.alert('Error sending message: ' + error);
                    });
                })

              });
        }
    });    
}

/**
* Alert the user if LIFF is opened in an external browser and unavailable buttons are tapped
*/
function sendAlertIfNotInClient() {
    alert('This button is unavailable as LIFF is currently being opened in an external browser.');
}

/**
* Toggle access token data field
*/
function toggleAccessToken() {
    toggleElement('accessTokenData');
}

/**
* Toggle profile info field
*/
function toggleProfileData() {
    toggleElement('profileInfo');
}

/**
* Toggle scanCode result field
*/
function toggleQrCodeReader() {
    toggleElement('scanQr');
}

/**
* Toggle specified element
* @param {string} elementId The ID of the selected element
*/
function toggleElement(elementId) {
    const elem = document.getElementById(elementId);
    if (elem.offsetWidth > 0 && elem.offsetHeight > 0) {
        elem.style.display = 'none';
    } else {
        elem.style.display = 'block';
    }
}
