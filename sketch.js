let atlas
let data
let immagini = []
let lineProgress = 0; // Add this new variable for line animation

// Parametri di zoom e spostamento
let dragX = 0
let dragY = 0
let zoom = 0.5

let selectedImage = null
let isAltezze = false 
let isSpostamenti = false // Add this new variable
let showMainContent = false;
let isMapView = false;  // Add this with your other state variables at the top

function preload() {
	atlas = loadImage('atlas_128.jpg')
	data = loadJSON('output.json')
}

function setup() {
	// Hide the canvas initially
	const canvas = createCanvas(windowWidth, windowHeight, WEBGL);
	canvas.parent('mainContent');
	setupViewToggle();

	const enterButton = document.getElementById("archiveLink");
const startPage = document.getElementById("startPage");
const mainContent = document.getElementById("mainContent");
const buttonContainer = document.querySelector(".button-container");

enterButton.addEventListener("click", () => {
    startPage.style.display = "none";
    mainContent.style.display = "block";
    buttonContainer.style.display = "flex"; // Mostra i pulsanti
    showMainContent = true;
});



	// Workaround penoso visto che p5js non supporta JSON arrays
	Object.keys(data).forEach(k => {
			
		const item = data[k]

		const w = item.width
		const h = item.height

		const u1 = item.x / atlas.width
		const v1 = item.y / atlas.height
		const u2 = (item.x + w) / atlas.width
		const v2 = (item.y + h) / atlas.height

		immagini.push(new Immagine(item, w, h, u1, v1, u2, v2))
	})

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
    // Reset view parameters when switching
    dragX = 0;
    dragY = 0;
    zoom = 0.5;
  });

  toggleBtn.addEventListener('click', () => {
    isMapView = false;
    isAltezze = true;
    isSpostamenti = false;
    // Reset view parameters when switching
    dragX = 0;
    dragY = 0;
    zoom = 0.5;
  });

  gridBtn.addEventListener('click', () => {
    isMapView = false;
    isAltezze = false;
    isSpostamenti = true;
    lineProgress = 0; // Reset line animation
    // Reset view parameters when switching
    dragX = 0;
    dragY = 0;
    zoom = 0.5;
  });
}

function draw() {
  if (!showMainContent) return;

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
}

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
    for (let img of sortedImages) {
        const x = img.pos.x * 0.0001;
        const y = img.pos.y * -0.0001;
        circle(x, y, 1);
    }
    pop();

    // Increment the animation progress
    if (lineProgress < 1) { 
        lineProgress += 0.001; // Adjust this value to control animation speed
    }
}

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
  stroke(255);
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
    strokeWeight(1);
    line(-width/2, y, -width/2 + 20, y);
    
    // Altitude label
    noStroke();
    fill(255);
    textAlign(RIGHT, CENTER);
    textSize(16);
    text(altitude + 'm', -width/2 - 20, y);
  }
  pop();

  // Draw images
  beginShape(QUADS);
  noStroke();
  textureMode(NORMAL);
  texture(atlas);

  for (let img of sortedImages) {
    const timePosition = (new Date(img.meta.DateTimeOriginal) - startTime) / timeRange;
    const x = map(timePosition, 0, 1, -width/2 + 100, width/2); // Offset x to make room for axis
    const y = map(img.altitude, minAlt, maxAlt, height/2, -height/2);
    
    // Draw image at timeline position
    vertex(x - img.w2, y - img.h2, 0, img.u1, img.v1);
    vertex(x + img.w2, y - img.h2, 0, img.u2, img.v1);
    vertex(x + img.w2, y + img.h2, 0, img.u2, img.v2);
    vertex(x - img.w2, y + img.h2, 0, img.u1, img.v2);
  }

  endShape();
}

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
		this.w2 = w /100
		this.h = h
		this.h2 = h /100

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

function gpsToMercator(lat, lon) {
	// console.log(lat, lon);

    const R = 6378137; // Raggio della Terra in metri (WGS84)
    const x = R * lon * Math.PI / 180;
    const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
	// console.log(x, y);

    return {x, y};


}

function mouseClicked() {
  // Converti la posizione del mouse in coordinate mondiali
  const worldX = (mouseX - width/2) / zoom - dragX;
  const worldY = (mouseY - height/2) / zoom - dragY;

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
      const x = map(timePosition, 0, 1, -width/2 + 100, width/2);
      const y = map(img.altitude, minAlt, maxAlt, height/2, -height/2);
      
      if (worldX > x - img.w2 && worldX < x + img.w2 &&
          worldY > y - img.h2 && worldY < y + img.h2) {
        showSidebar(img);
        return;
      }
    }
  } else {
    // Map view click handling (existing code)
    for (let img of immagini) {
      const imgX = img.pos.x * 0.0001;
      const imgY = img.pos.y * -0.0001;
      
      if (worldX > imgX - img.w2 && worldX < imgX + img.w2 &&
          worldY > imgY - img.h2 && worldY < imgY + img.h2) {
        showSidebar(img);
        return;
      }
    }
  }
  
  // Se clicchiamo fuori, nascondiamo la sidebar
  document.getElementById('sidebar').style.display = 'none';
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
      <div class="image-container">
        <img src="images/${file_name_pad}${img.meta.FileExtension}" alt="images/${img.meta.FileName}${img.meta.FileExtension}">
      </div>
      <div class="metadata-container" style="padding: 0 20px;">
        <h2 style="text-align: left; margin-bottom: 16px;">Informazioni</h2>
        <div class="metadata-item" style="display: flex; flex-direction: column; gap: 8px;">
          <div class="info-row" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><span class="label">Data:</span> ${date}</div>
          <div class="info-row" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><span class="label">Ora:</span> ${time}</div>
          <div class="info-row" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><span class="label">Altitudine:</span> ${Math.round(img.altitude)} m</div>
          <div class="info-row" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><span class="label">Luogo:</span> ${locationName}</div>
          <div class="info-row" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><span class="label">Latitudine:</span> ${latitude}°</div>
          <div class="info-row" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><span class="label">Longitudine:</span> ${longitude}°</div>
        </div>
      </div>
    </div>`;
  
  sidebar.innerHTML = html;
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
