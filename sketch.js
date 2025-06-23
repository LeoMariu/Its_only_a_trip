let atlas
let data
let font;
let fontBold;
let immagini = []
let lineProgress = 0; // Add this new variable for line animation

// Parametri di zoom e spostamento
let dragX = 0
let dragY = 0
let zoom = 0.5

let selectedImage = null
let isAltezze = false 
let isSpostamenti = false // Add this new variable
let isMapView = true;  // Add this with your other state variables at the top

function preload() {
	atlas = loadImage('atlas_128.jpg')
	data = loadJSON('output.json')
}

function success(font) {
  fill('deeppink');
  textFont(font);
  textSize(36);
}

function setup() {
  font = loadFont('/assets/favorit.otf', success);
  fontBold = loadFont('/assets/favoritBold.otf', success);

  // Hide the canvas initially
  const canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.parent('mainContent');
  setupViewToggle();

  // Imposta la modalità Altimetro come predefinita
  isMapView = false;
  isAltezze = true;
  isSpostamenti = false;

  // Aggiorna il pannello informazioni per riflettere la modalità Altimetro
  updateInfoPanel();

  // Reset dei parametri di visualizzazione per Altimetro
  dragX = 0;
  dragY = 0;
  zoom = 0.5;

  // Workaround penoso visto che p5js non supporta JSON arrays
  Object.keys(data).forEach(k => {
    const item = data[k];

    const w = item.width;
    const h = item.height;

    const u1 = item.x / atlas.width;
    const v1 = item.y / atlas.height;
    const u2 = (item.x + w) / atlas.width;
    const v2 = (item.y + h) / atlas.height;

    immagini.push(new Immagine(item, w, h, u1, v1, u2, v2));
  });

	// document.body.style.cursor = 'grab'
}

// function mousePressed() {
// 	document.body.style.cursor = 'grabbing'
// }

// function mouseReleased() {
// 	document.body.style.cursor = 'grab'
// }

function mouseDragged() {
	dragX += (mouseX - pmouseX) / zoom
	dragY += (mouseY - pmouseY) / zoom
}

function mouseWheel(event) {
    // Calcola la posizione del mouse in coordinate mondiali prima dello zoom
    const worldX = (mouseX - width/2) / zoom - dragX
    const worldY = (mouseY - height/2) / zoom - dragY

    zoom += event.deltaY * 0.05
    zoom = Math.min(Math.max(0.6, zoom), 100000000000000000000000)

    // Calcola la nuova posizione del mouse in coordinate mondiali dopo lo zoom
    const newWorldX = (mouseX - width/2) / zoom - dragX
    const newWorldY = (mouseY - height/2) / zoom - dragY

    // Aggiusta dragX e dragY per mantenere il punto sotto il mouse nella stessa posizione
    dragX += (newWorldX - worldX)
    dragY += (newWorldY - worldY)
}

function gpsToMercator(lat, lon) {
	// console.log(lat, lon);

    const R = 6378137; // Raggio della Terra in metri (WGS84)
    const x = R * lon * Math.PI / 180;
    const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
	// console.log(x, y);

    return {x, y};


}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight)
}

function setupViewToggle() {
  const posizioniBtn = document.getElementById('posizioni');
  const toggleBtn = document.getElementById('viewToggle');
  const gridBtn = document.getElementById('gridToggle');
  
  posizioniBtn.addEventListener('click', () => {
    isMapView = true;
    isAltezze = false;
    isSpostamenti = false;
    lineProgress = 0; // Reset line animation progress
    dragX = 0;
    dragY = 0;
    zoom = 0.5;

    document.getElementById("kmPercorsi-wrapper").style.display = "none";
    document.getElementById("continenti-wrapper").style.display = "none";
    document.getElementById("kmPercorsiOgniAnno-wrapper").style.display = "none";
    document.getElementById("fotoScattateOgniAnno-wrapper").style.display = "none";

    updateInfoPanel();
  });

  toggleBtn.addEventListener('click', () => {
    isMapView = false;
    isAltezze = true;
    isSpostamenti = false;
    lineProgress = 0; // Reset line animation progress
    dragX = 0;
    dragY = 0;
    zoom = 0.5;

    document.getElementById("kmPercorsi-wrapper").style.display = "none";
    document.getElementById("continenti-wrapper").style.display = "none";
    document.getElementById("kmPercorsiOgniAnno-wrapper").style.display = "none";
    document.getElementById("fotoScattateOgniAnno-wrapper").style.display = "none";

    updateInfoPanel();
  });

  gridBtn.addEventListener('click', () => {
    isMapView = false;
    isAltezze = false;
    isSpostamenti = true;
    lineProgress = 0; // Reset line animation progress
    dragX = 0;
    dragY = 0;
    zoom = 0.5;

    document.getElementById("kmPercorsi-wrapper").style.display = "block";
    document.getElementById("continenti-wrapper").style.display = "block";
    document.getElementById("kmPercorsiOgniAnno-wrapper").style.display = "block";
    document.getElementById("fotoScattateOgniAnno-wrapper").style.display = "block";

    updateYearlyDistance(lineProgress);
    updatePhotoCountByYear(lineProgress);

    updateInfoPanel();
  });
}

function updateYearlyDistance(progress) {
  const sortedImages = [...immagini].sort((a, b) => 
    new Date(a.meta.DateTimeOriginal) - new Date(b.meta.DateTimeOriginal)
  );

  const yearlyDistances = {};
  const visiblePoints = Math.floor(sortedImages.length * progress);

  for (let i = 1; i < visiblePoints; i++) {
    const img1 = sortedImages[i - 1];
    const img2 = sortedImages[i];
    const year = new Date(img2.meta.DateTimeOriginal).getFullYear();

    const distance = calculateDistance(
      img1.meta.latitude, img1.meta.longitude,
      img2.meta.latitude, img2.meta.longitude
    );

    yearlyDistances[year] = (yearlyDistances[year] || 0) + distance;
  }

  let htmlContent = '';
  Object.keys(yearlyDistances).sort((a, b) => a - b).forEach(year => {
    htmlContent += `${year}: ${Math.round(yearlyDistances[year]).toLocaleString()} km<br>`;
  });

  document.getElementById("kmPercorsiOgniAnno").innerHTML = htmlContent;
}

function updatePhotoCountByYear(progress) {
  const sortedImages = [...immagini].sort((a, b) =>
    new Date(a.meta.DateTimeOriginal) - new Date(b.meta.DateTimeOriginal)
  );

  const visiblePoints = Math.floor(sortedImages.length * progress);
  const yearlyPhotoCounts = {};

  for (let i = 0; i < visiblePoints; i++) {
    const year = new Date(sortedImages[i].meta.DateTimeOriginal).getFullYear();
    yearlyPhotoCounts[year] = (yearlyPhotoCounts[year] || 0) + 1;
  }

  let html = '';
  Object.keys(yearlyPhotoCounts).sort().forEach(year => {
    html += `${year}: ${yearlyPhotoCounts[year]} foto<br>`;
  });

  const fotoScattateElement = document.getElementById("fotoScattateOgniAnno");
  if (fotoScattateElement) {
    fotoScattateElement.innerHTML = html;
  } else {
    console.error("Element 'fotoScattateOgniAnno' not found in the DOM.");
  }
}


//-------- POSIZIONI -------------------------------------------------------------------------------------------------------------------------------------------------

function draw() {

  background(50);
  scale(zoom);
  translate(dragX, dragY, 0);

  if (isMapView) {
    drawMapView();
  } else if (isAltezze) {
    drawAltezze();
  } else if (isSpostamenti) {
    drawSpostamenti();
  }
}

function drawMapView() {
	beginShape(QUADS)

	noStroke()
	textureMode(NORMAL)
	texture(atlas)

	for (let i = 0; i < immagini.length; i++) {
		immagini[i].emettiVertici()
	}

	endShape()

   // Add text at specific coordinates
    push();
    const specificPos = gpsToMercator(4.099917, -72.9088133);
    const xPos = specificPos.x * 0.0001;
    const yPos = specificPos.y * -0.0001;
    
    // // Draw a marker at the position
    // fill(0, 0, 255); // Yellow marker
    // noStroke()
    // circle(xPos, yPos, 10);
    
    // Draw text
    fill(255);
    textSize(20);
    textAlign(CENTER, BOTTOM);
    text("Colombia", xPos, yPos - 3);
    
    // Add the new marker for Thailand coordinates
    const thaiPos = gpsToMercator(13.7524938, 100.4935089);
    const thaiX = thaiPos.x * 0.0001;
    const thaiY = thaiPos.y * -0.0001;
    
    // // Draw a marker at the Thai position
    // fill(0, 0, 255);
    // noStroke();
    // circle(thaiX, thaiY, 10);
    
    // Draw text for Thailand
    fill(255);
    textSize(20);
    textAlign(CENTER, BOTTOM);
    text("Thailandia", thaiX, thaiY - 3);
    
    // Add the new marker for italia coordinates
    const italiaPos = gpsToMercator(42.6384261, 12.674297);
    const italiaX = italiaPos.x * 0.0001;
    const italiaY = italiaPos.y * -0.0001;
    
    // // Draw a marker at the italia position
    // fill(0, 0, 255);
    // noStroke();
    // circle(italiaX, italiaY, 10);
    
    // Draw text for italia
    fill(255);
    textSize(20);
    textAlign(CENTER, BOTTOM);
    text("Italia", italiaX, italiaY - 3);
    
    // Add the new marker for India City coordinates
    const indiaPos = gpsToMercator(22.3511148, 78.6677428);
    const indiaX = indiaPos.x * 0.0001;
    const indiaY = indiaPos.y * -0.0001;
    
    // // Draw a marker at the india position
    // fill(0, 0, 255);
    // noStroke();
    // circle(indiaX, indiaY, 10);
    
    // Draw text for India City
    fill(255);
    textSize(20);
    textAlign(CENTER, BOTTOM);
    text("India", indiaX, indiaY - 3);
    
    // Add the new marker for cina coordinates
    const cinaPos = gpsToMercator(35.0000663, 104.999955);
    const cinaX = cinaPos.x * 0.0001;
    const cinaY = cinaPos.y * -0.0001;
    
    // // Draw a marker at the cina position
    // fill(0, 0, 255);
    // noStroke();
    // circle(cinaX, cinaY, 10);
    
    // Draw text for cina
    fill(255);
    textSize(20);
    textAlign(CENTER, BOTTOM);
    text("Cina", cinaX, cinaY - 3);
    
    // Add the new marker for Argentina coordinates
    const argPos = gpsToMercator(-34.9964963, -64.9672817);
    const argX = argPos.x * 0.0001;
    const argY = argPos.y * -0.0001;
    
    // // Draw a marker at the Argentina position
    // fill(0, 0, 255);
    // noStroke();
    // circle(argX, argY, 10);
    
    // Draw text for Argentina
    fill(255);
    textSize(20);
    textAlign(CENTER, BOTTOM);
    text("Argentina", argX, argY - 3);
    
    // Add the new marker for nigeria coordinates (9.6000359, 7.9999721)
    const nigeriaPos = gpsToMercator(9.6000359, 7.9999721);
    const nigeriaX = nigeriaPos.x * 0.0001;
    const nigeriaY = nigeriaPos.y * -0.0001;
    
    // // Draw a marker at the nigeria position
    // fill(0, 0, 255);
    // noStroke();
    // circle(nigeriaX, nigeriaY, 10);
    
    // Draw text for nigeria
    fill(255);
    textSize(20);
    textAlign(CENTER, BOTTOM);
    text("Nigeria", nigeriaX, nigeriaY - 3);

  const messicoPos = gpsToMercator(23.6585116, -102.0077097);
  const messicoX = messicoPos.x * 0.0001;
  const messicoY = messicoPos.y * -0.0001;
    
  // // Draw a marker at the messico position
  // fill(0, 0, 255);
  // noStroke();
  // circle(messicoX, messicoY, 10);
    
  // Draw text for messico
  fill(255);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("Messico", messicoX, messicoY - 3);

  const sudafricaPos = gpsToMercator(-28.8166236, 24.991639);
  const sudafricaX = sudafricaPos.x * 0.0001;
  const sudafricaY = sudafricaPos.y * -0.0001;
    
  // // Draw a marker at the sudafrica position
  // fill(0, 0, 255);
  // noStroke();
  // circle(sudafricaX, sudafricaY, 10);
    
  // Draw text for sudafrica
  fill(255);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("Sudafrica", sudafricaX, sudafricaY - 3);

  const regnoPos = gpsToMercator(54.3151594, -1.9181532);
  const regnoX = regnoPos.x * 0.0001;
  const regnoY = regnoPos.y * -0.0001;
    
  // // Draw a marker at the regno position
  // fill(0, 0, 255);
  // noStroke();
  // circle(regnoX, regnoY, 10);
    
  // Draw text for regno
  fill(255);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("Regno Unito", regnoX, regnoY - 3);

  pop();

}

//--------- PULSANTE PLAYPAUSE ----------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const playPauseButton = document.getElementById("playPause");
  const viewToggle = document.getElementById("viewToggle");
  const posizioniButton = document.getElementById("posizioni");
  const gridToggle = document.getElementById("gridToggle");

  function drawSpostamenti() {
    playPauseButton.style.display = "block";
  }

  viewToggle.addEventListener("click", () => {
    playPauseButton.style.display = "none";
  });

  posizioniButton.addEventListener("click", () => {
    playPauseButton.style.display = "none";
  });

  gridToggle.addEventListener("click", () => {
    drawSpostamenti();

    
  });

  let isPlaying = false;

  playPauseButton.addEventListener("click", () => {
    isPlaying = !isPlaying;
    playPauseButton.textContent = isPlaying ? "Pause" : "Play";
    console.log(isPlaying ? "Animazione ripresa" : "Animazione fermata");
  });
});

//--------- SPOSTAMENTI -------------------------------------------------------------------------------------------------------------------------------------------

function drawSpostamenti() {
  // Find bounds of all coordinates to scale the view appropriately
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  // Sort images by date first
  const sortedImages = [...immagini].sort((a, b) => 
    new Date(a.meta.DateTimeOriginal) - new Date(b.meta.DateTimeOriginal)
  );
  
  for (let img of sortedImages) {
    const x = img.pos.x * 0.0001;
    const y = img.pos.y * -0.0001;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  
  // Draw the animated connecting red line
  push();
  stroke(255, 0, 0); // Red color
  strokeWeight(0.5);
  noFill();
  beginShape();
  
  // Calculate how many points to draw based on animation progress
  const numPoints = Math.floor(sortedImages.length * lineProgress);
  
  // Calculate total distance
  let totalDistance = 0;
  for (let i = 1; i < numPoints; i++) {
    const img1 = sortedImages[i-1];
    const img2 = sortedImages[i];
    totalDistance += calculateDistance(
      img1.meta.latitude, img1.meta.longitude,
      img2.meta.latitude, img2.meta.longitude
    );
  }
  
  // Draw up to the current progress point
  for (let i = 0; i < numPoints; i++) {
    const img = sortedImages[i];
    const x = img.pos.x * 0.0001;
    const y = img.pos.y * -0.0001;
    vertex(x, y);
  }
  
  endShape();
  pop();

  // Draw circles for each image position
  push();
  noStroke();
  fill(255); // White circles
  
  // Check if mouse is over any circle
  let isOverCircle = false;
  for (let img of sortedImages) {
    const x = img.pos.x * 0.0001;
    const y = img.pos.y * -0.0001;
    
    // Check if mouse is over this circle
    const d = dist((mouseX - width/2)/zoom - dragX, (mouseY - height/2)/zoom - dragY, x, y);
    if (d < 1) {
      isOverCircle = true;
      cursor(HAND);
    }
    
    circle(x, y, 1);
  }
  
  // Reset cursor if not over any circle
  if (!isOverCircle) {
    cursor(ARROW);
  }
  pop();

  // Add text at specific coordinates
  push();
  const specificPos = gpsToMercator(4.099917, -72.9088133);
  const xPos = specificPos.x * 0.0001;
  const yPos = specificPos.y * -0.0001;
  
  // Draw text
  fill(255);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("Colombia", xPos, yPos - 3);
  
  // Add the new marker for Thailand coordinates
  const thaiPos = gpsToMercator(13.7524938, 100.4935089);
  const thaiX = thaiPos.x * 0.0001;
  const thaiY = thaiPos.y * -0.0001;
  
  // Draw text for Thailand
  fill(255);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("Thailandia", thaiX, thaiY - 3);
  
  // Add the new marker for italia coordinates
  const italiaPos = gpsToMercator(42.6384261, 12.674297);
  const italiaX = italiaPos.x * 0.0001;
  const italiaY = italiaPos.y * -0.0001;
  
  // Draw text for italia
  fill(255);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("Italia", italiaX, italiaY - 3);
  
  // Add the new marker for India City coordinates
  const indiaPos = gpsToMercator(22.3511148, 78.6677428);
  const indiaX = indiaPos.x * 0.0001;
  const indiaY = indiaPos.y * -0.0001;
  
  // Draw text for India City
  fill(255);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("India", indiaX, indiaY - 3);
  
  // Add the new marker for cina coordinates
  const cinaPos = gpsToMercator(35.0000663, 104.999955);
  const cinaX = cinaPos.x * 0.0001;
  const cinaY = cinaPos.y * -0.0001;
  
  // Draw text for cina
  fill(255);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("Cina", cinaX, cinaY - 3);
  
  // Add the new marker for Argentina coordinates
  const argPos = gpsToMercator(-34.9964963, -64.9672817);
  const argX = argPos.x * 0.0001;
  const argY = argPos.y * -0.0001;
  
  // Draw text for Argentina
  fill(255);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("Argentina", argX, argY - 3);
  
  // Add the new marker for nigeria coordinates (9.6000359, 7.9999721)
  const nigeriaPos = gpsToMercator(9.6000359, 7.9999721);
  const nigeriaX = nigeriaPos.x * 0.0001;
  const nigeriaY = nigeriaPos.y * -0.0001;
  
  // Draw text for nigeria
  fill(255);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("Nigeria", nigeriaX, nigeriaY - 3);

  const messicoPos = gpsToMercator(23.6585116, -102.0077097);
  const messicoX = messicoPos.x * 0.0001;
  const messicoY = messicoPos.y * -0.0001;
    
  // // Draw a marker at the messico position
  // fill(0, 0, 255);
  // noStroke();
  // circle(messicoX, messicoY, 10);
    
  // Draw text for messico
  fill(255);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("Messico", messicoX, messicoY - 3);

  const sudafricaPos = gpsToMercator(-28.8166236, 24.991639);
  const sudafricaX = sudafricaPos.x * 0.0001;
  const sudafricaY = sudafricaPos.y * -0.0001;
    
  // // Draw a marker at the sudafrica position
  // fill(0, 0, 255);
  // noStroke();
  // circle(sudafricaX, sudafricaY, 10);
    
  // Draw text for sudafrica
  fill(255);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("Sudafrica", sudafricaX, sudafricaY - 3);

  const regnoPos = gpsToMercator(54.3151594, -1.9181532);
  const regnoX = regnoPos.x * 0.0001;
  const regnoY = regnoPos.y * -0.0001;
    
  // // Draw a marker at the regno position
  // fill(0, 0, 255);
  // noStroke();
  // circle(regnoX, regnoY, 10);
    
  // Draw text for regno
  fill(255);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("Regno Unito", regnoX, regnoY - 3);
  pop();

  // MODIFICATO: Riquadro distanza percorsa
  push();
  // Reset transformation matrix to draw in screen coordinates
  resetMatrix();
  document.getElementById("kmPercorsi").innerText = Math.round(totalDistance).toLocaleString() + " km";
  pop();

  //---------- LISTA DEI CONTINENTI VISITATI E NUMERO DI FOTO SCATTATE ----------------------------- 

  // Map coordinates to continents
  function getContinent(lat, lng) {
    if (lat > 35 && lat < 72 && lng > -25 && lng < 40) return "Europe";
    if ((lat > 34 && lng > 40 && lng < 180) || (lat > 0 && lat < 34 && lng > 100 && lng < 180)) return "Asia";
    if ((lat > 25 && lng < -30 && lng > -170) || (lat > 50 && lng < -30 && lng > -180)) return "North America";
    if (lat < 35 && lat > -35 && lng > -20 && lng < 55) return "Africa";
    if (lat < 12 && lat > -60 && lng < -30 && lng > -90) return "South America";
    if (lat < 0 && lat > -50 && lng > 110 && lng < 180) return "Oceania";
    if (lat < -60) return "Antarctica";
    return "Unknown";
  }

  // Get unique continents and count images per continent up to current progress point
  const visiblePoints = Math.floor(sortedImages.length * lineProgress);
  const continentCounts = {};
  const visitedContinents = new Set();
  
  for (let i = 0; i < visiblePoints; i++) {
    const img = sortedImages[i];
    const continent = getContinent(img.meta.latitude, img.meta.longitude);
    if (continent !== "Unknown") {
      continentCounts[continent] = (continentCounts[continent] || 0) + 1;
      visitedContinents.add(continent);
    }
  }
  
  // Create HTML with continent names and counts
  let htmlContent = '';
  visitedContinents.forEach(continent => {
    if (continent !== "Unknown") {
      htmlContent += `${continent}: ${continentCounts[continent]} foto<br>`;
    }
  });
  
  document.getElementById("continenti").innerHTML = htmlContent;

  // Increment the animation progress only if playing
  if (isPlaying && lineProgress < 1) { 
    lineProgress += 0.004;
  }

  updateYearlyDistance(lineProgress);
  updatePhotoCountByYear(lineProgress);

}

// Add play/pause functionality
let isPlaying = false;

document.addEventListener("DOMContentLoaded", () => {
  const playPauseButton = document.getElementById("playPause");

  playPauseButton.addEventListener("click", () => {
    isPlaying = !isPlaying;
    playPauseButton.textContent = isPlaying ? "Pause" : "Play";
    console.log(isPlaying ? "Animazione ripresa" : "Animazione fermata");
  });
});

//---------- CALCOLO DELLA DISTANZA ----------------------------- 

// Function to calculate the distance between two points using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

//------------- ALTEZZE ---------------------------------------------------------------------------------------------------------------------------------------

function drawAltezze() {
  // Sort images by date
  const sortedImages = [...immagini].sort((a, b) => 
    new Date(a.meta.DateTimeOriginal) - new Date(b.meta.DateTimeOriginal)
  );

  // Find time range
  const startTime = new Date(sortedImages[0].meta.DateTimeOriginal);
  const endTime = new Date(sortedImages[sortedImages.length - 1].meta.DateTimeOriginal);
  const timeRange = endTime - startTime;

  // Find altitude range
  const altitudes = sortedImages.map(img => img.altitude);
  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);
  const altRange = maxAlt - minAlt;

  // Calculate altitude markers at 1000m intervals
  const altitudeStep = 1000; // 1000 meters between each marker
  const minThousand = Math.floor(minAlt/1000) * 1000;
  const maxThousand = Math.ceil(maxAlt/1000) * 1000;
  
  // Draw y-axis
  push();
  stroke(255, 255, 255, 30);
  strokeWeight(0.5);
  line(-width/2, height/2, -width/2, -height/2);
  
  // Draw altitude markers and horizontal lines every 1000m
  for(let altitude = minThousand; altitude <= maxThousand; altitude += altitudeStep) {
    const y = map(altitude, minAlt, maxAlt, height/2, -height/2);
    
    // Horizontal grid line
    stroke(255, 255, 255, 30);
    strokeWeight(0.5);
    line(-width/2, y, width/2, y);
    
    // Tick mark
    stroke(255);
    strokeWeight(0.5);
    line(-width/2, y, -width/2 - 10, y);
    
    // Altitude label
    noStroke();
    fill(255);
    textAlign(RIGHT, CENTER);
    textSize(20); // Usa una dimensione testo più ragionevole
    // Disegna il testo DOPO la griglia, così non viene coperto dalle immagini
    text(altitude + 'm', -width/2 - 30, y);
  }
  pop();
  
  push();
    // linea asse X
    stroke(255, 255, 255, 30);
    strokeWeight(0.5);
    line(-width/2, height/2, width/2 + 108, height/2);

    // per ogni 1° gennaio dal 2016 al 2026
    for (let year = 2016; year <= 2026; year++) {
      const dt = new Date(year, 0, 1); // mese 0 = gennaio
      // considera solo se nel range temporale
      if (dt >= startTime && dt <= endTime) {
        const t = (dt - startTime) / timeRange;
        const x = map(t, 0, 1, -width/2 + 100, width/2);

        // lineetta di tick (verso il basso)
        stroke(255);
        strokeWeight(0.5);
        line(x, height/2, x, height/2 + 10);

        // label anno
        noStroke();
        fill(255);
        textAlign(CENTER, TOP);
        textSize(20);
        text(year, x, height/2 + 20);
      }
    }
    // Always show tick for year 2016
    const dt2016 = new Date(2016, 0, 1);
    const t2016 = (dt2016 - startTime) / timeRange;
    const x2016 = map(t2016, 0, 1, -width/2 + 100, width/2);

    stroke(255);
    strokeWeight(0.5);
    line(x2016, height/2, x2016, height/2 + 10);

    noStroke();
    fill(255);
    textAlign(CENTER, TOP);
    textSize(20);
    text(2016, x2016, height/2 + 20);
    
    // Always show tick for year 2025
    const dt2025 = new Date(2025, 0, 1);
    const t2025 = (dt2025 - startTime) / timeRange;
    const x2025 = map(t2025, 0, 1, -width/2 + 100, width/2);

    stroke(255);
    strokeWeight(0.5);
    line(x2025, height/2, x2025, height/2 + 10);

    noStroke();
    fill(255);
    textAlign(CENTER, TOP);
    textSize(20);
    text(2025, x2025, height/2 + 20);
    pop();


  // Draw images
  beginShape(QUADS);
  noStroke();
  textureMode(NORMAL);
  texture(atlas);

  let isOverImage = false; // Track if the pointer is over any image

  for (let img of sortedImages) {
    const timePosition = (new Date(img.meta.DateTimeOriginal) - startTime) / timeRange;
    const x = map(timePosition, 0, 1, -width/2 + 100, width/2); // Offset x to make room for axis
    const y = map(img.altitude, minAlt, maxAlt, height/2, -height/2);

    // Check if the mouse is over this image
    const mouseWorldX = (mouseX - width / 2) / zoom - dragX;
    const mouseWorldY = (mouseY - height / 2) / zoom - dragY;

    if (
      mouseWorldX > x - img.w2 &&
      mouseWorldX < x + img.w2 &&
      mouseWorldY > y - img.h2 &&
      mouseWorldY < y + img.h2
    ) {
      isOverImage = true;
    }

    // Draw image at timeline position
    vertex(x - img.w2, y - img.h2, 0, img.u1, img.v1);
    vertex(x + img.w2, y - img.h2, 0, img.u2, img.v1);
    vertex(x + img.w2, y + img.h2, 0, img.u2, img.v2);
    vertex(x - img.w2, y + img.h2, 0, img.u1, img.v2);
  }

  endShape();

  // Change cursor to hand if over an image
  if (isOverImage) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}

//------------- SIDEBAR ---------------------------------------------------------------------------------------------------------------------------------------


/**
 * Classe Immagine
 *
 * Questa classe rappresenta un'immagine all'interno di un'atlas di texture.
 * Permette di gestire facilmente le coordinate di texture (UV) e le dimensioni
 * dell'immagine per il rendering.
 *
 * Parametri:
 * - filename: nome del file dell'immagine originale
 * - w: larghezza dell'immagine in pixel
 * - h: altezza dell'immagine in pixel
 * - u1, v1: coordinate UV dell'angolo superiore sinistro nell'atlas
 * - u2, v2: coordinate UV dell'angolo inferiore destro nell'atlas
 *
 * Il metodo emettiVertici() crea i quattro vertici necessari per disegnare
 * l'immagine come un quadrilatero nello spazio 3D, con le corrette coordinate
 * di texture.
 */

class Immagine {
	constructor(meta, w, h, u1, v1, u2, v2) {

		this.meta = meta
		this.w = w
		this.w2 = w /60
		this.h = h
		this.h2 = h /60

		// this.w = altitude * 0.5
		// this.w2 = altitude * 0.5 / 2
		// this.h = altitude * 0.5
		// this.h2 = altitude * 0.5 / 2

		this.u1 = u1
		this.v1 = v1
		this.u2 = u2
		this.v2 = v2

		this.pos = gpsToMercator(meta.latitude,meta.longitude) 		

		this.pos.x
		this.pos.y

		this.altitude = meta.GPSAltitude		
	}

	emettiVertici() {
		const x = this.pos.x * 0.0001
		const y = this.pos.y * -0.0001
		const z = this.altitude * 0.01
		vertex(x - this.w2, y - this.h2, z, this.u1, this.v1)
		vertex(x + this.w2, y - this.h2, z, this.u2, this.v1)
		vertex(x + this.w2, y + this.h2, z, this.u2, this.v2)
		vertex(x - this.w2, y + this.h2, z, this.u1, this.v2)
	}
	// emettiVerticiRuotati(x = 0, y = 0, z = 0, angolo = 0) {
	// 	const c = Math.cos(angolo)
	// 	const s = Math.sin(angolo)

	// 	// Angolo superiore sinistro
	// 	const x1 = x + (-this.w2 * c - this.h2 * s)
	// 	const y1 = y + (-this.w2 * s + this.h2 * c)

	// 	// Angolo superiore destro
	// 	const x2 = x + (this.w2 * c - this.h2 * s)
	// 	const y2 = y + (this.w2 * s + this.h2 * c)

	// 	// Angolo inferiore destro
	// 	const x3 = x + (this.w2 * c + this.h2 * s)
	// 	const y3 = y + (this.w2 * s - this.h2 * c)

	// 	// Angolo inferiore sinistro
	// 	const x4 = x + (-this.w2 * c + this.h2 * s)
	// 	const y4 = y + (-this.w2 * s - this.h2 * c)

	// 	vertex(x1, y1, z, this.u1, this.v1)
	// 	vertex(x2, y2, z, this.u2, this.v1)
	// 	vertex(x3, y3, z, this.u2, this.v2)
	// 	vertex(x4, y4, z, this.u1, this.v2)
	// }
}


function mouseClicked() {
  // Converti la posizione del mouse in coordinate mondiali
  const worldX = (mouseX - width / 2) / zoom - dragX;
  const worldY = (mouseY - height / 2) / zoom - dragY;

  if (isMapView) {
    // Non fare nulla se siamo nella modalità "posizioni"
    return;
  }

  if (isAltezze) {
    // Get time and altitude ranges for timeline view
    const sortedImages = [...immagini].sort((a, b) =>
      new Date(a.meta.DateTimeOriginal) - new Date(b.meta.DateTimeOriginal)
    );
    const startTime = new Date(sortedImages[0].meta.DateTimeOriginal);
    const endTime = new Date(sortedImages[sortedImages.length - 1].meta.DateTimeOriginal);
    const timeRange = endTime - startTime;

    const altitudes = sortedImages.map(img => img.altitude);
    const minAlt = Math.min(...altitudes);
    const maxAlt = Math.max(...altitudes);

    // Check clicks on images in timeline view
    for (let img of sortedImages) {
      const timePosition = (new Date(img.meta.DateTimeOriginal) - startTime) / timeRange;
      const x = map(timePosition, 0, 1, -width / 2 + 100, width / 2);
      const y = map(img.altitude, minAlt, maxAlt, height / 2, -height / 2);

      if (
        worldX > x - img.w2 &&
        worldX < x + img.w2 &&
        worldY > y - img.h2 &&
        worldY < y + img.h2
      ) {
        showSidebar(img);
        return;
      }
    }
  } else {
    // Map view click handling (existing code)
    for (let img of immagini) {
      const imgX = img.pos.x * 0.0001;
      const imgY = img.pos.y * -0.0001;

      if (
        worldX > imgX - img.w2 &&
        worldX < imgX + img.w2 &&
        worldY > imgY - img.h2 &&
        worldY < imgY + img.h2
      ) {
        showSidebar(img);
        return;
      }
    }
  }

  // Se clicchiamo fuori, nascondiamo la sidebar
  // document.getElementById('sidebar').style.display = 'none';
}

async function showSidebar(img) {
  const sidebar = document.getElementById('sidebar');
  sidebar.style.display = 'block';
  
  const file = img.meta.FileName;
  const file_name_pad = file.toString().padStart(5, '0');
  
  const datetime = new Date(img.meta.DateTimeOriginal);
  const date = datetime.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const time = datetime.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Format coordinates to 6 decimal places
  const latitude = img.meta.latitude.toFixed(6);
  const longitude = img.meta.longitude.toFixed(6);

  // Get location name from coordinates
  const locationName = await getLocationName(img.meta.latitude, img.meta.longitude);

  let html = `
    <div class="sidebar-content">
      <!-- Close button -->
      <button id="closeSidebar" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
      
      <!-- Image Section -->
      <div class="image-container">
        <img src="images/${file_name_pad}${img.meta.FileExtension}" alt="images/${img.meta.FileName}${img.meta.FileExtension}">
      </div>
      
      <!-- Metadata Section -->
      <div class="metadata-container">
        <h2>Informazioni</h2>
        <div class="metadata-item">
          <span class="label">Data:</span> <span class="info-text">${date}</span>
        </div>
        <div class="metadata-item">
          <span class="label">Ora:</span> <span class="info-text">${time}</span>
        </div>
        <div class="metadata-item">
          <span class="label">Altitudine:</span> <span class="info-text">${Math.round(img.altitude)} m</span>
        </div>
        <div class="metadata-item">
          <span class="label">Luogo:</span> <span class="info-text">${locationName}</span>
        </div>
        <div class="metadata-item">
          <span class="label">Latitudine:</span> <span class="info-text">${latitude}°</span>
        </div>
        <div class="metadata-item">
          <span class="label">Longitudine:</span> <span class="info-text">${longitude}°</span>
        </div>
      </div>
    </div>`;
  
  sidebar.innerHTML = html;

  // Add event listener to close button
  document.getElementById('closeSidebar').addEventListener('click', () => {
    sidebar.style.display = 'none';
  });
}

// Add this new function to handle reverse geocoding
async function getLocationName(lat, lon) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await response.json();
    
    // Extract relevant location information
    const address = data.address;
    let location = '';
    
    if (address.village) {
      location = address.village;
    } else if (address.town) {
      location = address.town;
    } else if (address.city) {
      location = address.city;
    }
    
    if (address.municipality) {
      location += `, ${address.municipality}`;
    }
    
    return location || 'Posizione non disponibile';
  } catch (error) {
    console.error('Error getting location:', error);
    return 'Posizione non disponibile';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const infoPanel = document.getElementById("infoPanel");
  const closePanelBtn = document.getElementById("closePanelBtn");
  const openPanelBtn = document.getElementById("openPanelBtn");

  closePanelBtn.addEventListener("click", () => {
    infoPanel.style.display = "none";
    openPanelBtn.style.display = "inline-block";
  });

  openPanelBtn.addEventListener("click", () => {
    infoPanel.style.display = "block";
    openPanelBtn.style.display = "none";
  });
});

// Nuova funzione per aggiornare il titolo e il sottotitolo del pannello informazioni
function updateInfoPanel() {
  const infoPanelTitle = document.getElementById("infoPanelTitle");
  const infoPanelSubtitle = document.getElementById("infoPanelSubtitle");

  if (isMapView) {
    infoPanelTitle.textContent = " Geografia personale";
    infoPanelSubtitle.textContent = "Una mappa tridimensionale dei miei scatti. Ogni foto è collocata nello spazio secondo le sue coordinate geografiche e altimetriche, per mostrare dove e a quale altezza è stata scattata.";
  } else if (isAltezze) {
    infoPanelTitle.textContent = "Altitudini nel tempo";
    infoPanelSubtitle.textContent = "Uno sguardo verticale alla mia vita. Ogni punto rappresenta una foto scattata a una determinata altitudine, ordinata cronologicamente lungo l'asse del tempo.";
  } else if (isSpostamenti) {
    infoPanelTitle.textContent = "Viaggi e distanze";
    infoPanelSubtitle.textContent = "Segui i miei spostamenti nel tempo. Una linea rossa traccia il mio percorso nel mondo, dalle prime alle ultime foto. Include il totale dei chilometri percorsi, le foto scattate e una panoramica dei luoghi visitati.";
  }
}

// Chiamare questa funzione ogni volta che la modalità cambia
posizioniBtn.addEventListener("click", () => {
  isMapView = true;
  isAltezze = false;
  isSpostamenti = false;
  updateInfoPanel(); // Aggiorna il titolo e sottotitolo
});

toggleBtn.addEventListener("click", () => {
  isMapView = false;
  isAltezze = true;
  isSpostamenti = false;
  updateInfoPanel(); // Aggiorna il titolo e sottotitolo
});

gridBtn.addEventListener("click", () => {
  isMapView = false;
  isAltezze = false;
  isSpostamenti = true;
  updateInfoPanel(); // Aggiorna il titolo e sottotitolo
});

