SUPSI 2025  
Corso d’interaction design, CV429.01  
Docenti: A. Gysin, G. Profeta  

Elaborato 1: Diario geografico 

# Diario geografico
Autore: Leonardo Mariucci  
[Diario geografico]([https://ixd-supsi.github.io/2023/esempi/mp_hands/es6/1_landmarks](https://leomariu.github.io/jpeg/))


## Introduzione e tema
Questo progetto è un modo per rileggere il mio archivio fotografico attraverso la geografia. Le immagini non sono solo ricordi: sono coordinate, altitudini, percorsi. Ho voluto restituire visivamente il legame tra spazio, tempo e memoria, trasformando oltre diecimila foto in un'esperienza interattiva. Il risultato è una mappa personale del mondo, dove ogni scatto trova il suo posto, non in base a un album o una data, ma in funzione del luogo in cui è stato fatto

## Riferimenti progettuali
Per questo progetto ho scelto di adottare uno stile il più semplice e minimale possibile, con l’obiettivo di rendere i contenuti chiari, leggibili e privi di elementi superflui.

Riferimento:
https://sp.eriksiemund.com
https://bear-rabe.com
https://multiplestates.co.uk
https://oliviaezechukwu.com
https://artsexperiments.withgoogle.com/tsnemap/#11848.03,4663.59,11857.23,1206.97,242.11,432.74



## Design dell’interfaccia e modalità di interazione

L’interfaccia è progettata per essere essenziale e immersiva: le immagini riempiono completamente lo spazio visivo, mentre gli elementi grafici e testuali sono ridotti al minimo per lasciare spazio all’esperienza esplorativa. Il sito presenta tre diverse modalità di visualizzazione, attivabili tramite un menu in alto a sinistra. Nella vista “Altitudini”, le fotografie sono ordinate in base alla quota a cui sono state scattate, lungo un asse verticale, e distribuite nel tempo lungo un asse orizzontale. La modalità “Percorsi” mostra invece una linea rossa che connette cronologicamente tutti gli scatti, tracciando i percorsi dei miei viaggi. Infine, la vista “Mappa 3D” rappresenta un paesaggio tridimensionale in cui ogni immagine è posizionata in base alla sua latitudine, longitudine e altitudine. L’interazione avviene principalmente tramite movimenti liberi nello spazio: è possibile trascinare, zoomare o scorrere per esplorare l’archivio. Cliccando su una singola foto si apre una sidebar informativa che mostra l’immagine in alta risoluzione insieme a dettagli come data, luogo, altitudine e coordinate GPS. L’interfaccia è pensata per offrire un’esperienza di navigazione fluida, trasformando l’archivio in uno spazio da esplorare liberamente.

## Tecnologia usata
Il progetto è sviluppato interamente in JavaScript utilizzando la libreria p5.js, che consente un controllo preciso sul rendering grafico e sull’interazione in tempo reale. Il cuore dell’archivio è un atlas di immagini gestito in WebGL, da cui ogni singola foto viene estratta e posizionata nello spazio in base ai metadati GPS. Le modalità di esplorazione — Altitudini, Percorsi e Mappa 3D — sono state implementate come scene interattive, ognuna con una propria logica di visualizzazione, che può essere attivata dinamicamente dall’utente. Le interazioni (click, drag, zoom e selezione) sono tutte gestite via codice, senza l’uso di componenti esterni, offrendo massima libertà compositiva. Una delle funzionalità più significative è la linea rossa animata nella modalità Percorsi, che ripercorre l’ordine cronologico delle foto visualizzando il tracciato completo dei miei viaggi. La linea cresce nel tempo, seguendo l’ordine temporale degli scatti. Questo comportamento è ottenuto interpolando i punti con un parametro di avanzamento (lineProgress) che incrementa ad ogni frame se l’animazione è attiva:

```JavaScript

// Disegna la linea rossa animata che collega i punti
push();
stroke(255, 0, 0); // Rosso
strokeWeight(0.5);
noFill();
beginShape();

const numPoints = Math.floor(sortedImages.length * lineProgress);

for (let i = 0; i < numPoints; i++) {
  const img = sortedImages[i];
  const x = img.pos.x * 0.0001;
  const y = img.pos.y * -0.0001;
  vertex(x, y);
}

endShape();
pop();

// Aumenta la progressione se in modalità "Play"
if (isPlaying && lineProgress < 1) { 
  lineProgress += 0.004;
}
```

Questo approccio crea un effetto narrativo, in cui ogni punto sulla linea rappresenta una foto geolocalizzata in ordine temporale. L’utente può mettere in pausa o far ripartire il tracciamento attraverso un pulsante dedicato. L’intero sistema è progettato per essere reattivo, fluido e leggero, sfruttando tecniche di manipolazione diretta del canvas e delle texture.


## Target e contesto d’uso
Questo progetto si rivolge a chi è interessato alla visualizzazione di dati personali in chiave spaziale e narrativa: fotografi, viaggiatori, artisti visivi, o semplicemente curiosi attratti dal rapporto tra immagine e geografia. Il sito si presenta come un'esperienza contemplativa e interattiva, in cui è possibile attraversare visivamente un archivio fotografico lungo coordinate geografiche, temporali e altimetriche. L'interfaccia non è pensata per una consultazione rapida, ma per un'esplorazione lenta, immersiva, adatta a contesti espositivi (ad esempio mostre o installazioni digitali), ma anche alla fruizione personale da desktop.

