class Puzzles {
    #puzzlesArray;
    #map;

    constructor() {
        this.#puzzlesArray = [];
        this.#map = L.map('map').setView([51.505, -0.09], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.#map);
        this.#setListeners();
    }

    #setListeners() {
        const localizationButton = document.getElementById("localization-button");
        const downloadButton = document.getElementById("download-button");

        localizationButton.addEventListener("click", (_) => {
            if (navigator.credentials) {
                navigator.geolocation.getCurrentPosition(this.#success.bind(this), null);
            } else {
                this.#showNotification("Cannot get your localization");
            }   
        })
        
        downloadButton.addEventListener("click", (_) => {
            this.#createPuzzles().then(() => {
                this.#displayPuzzles();
                this.#createPuzzleBoard();
            });
        })
    }

    async #createPuzzles() {
        this.#puzzlesArray = [];
        const mapDimensions = this.#map.getSize();
        const imageHeight = mapDimensions.y;
        const imageWidth = mapDimensions.x;
        const puzzleHeight = imageHeight / 4;
        const puzzleWidth = imageWidth / 4;
        
        const img = await new Promise((resolve, _) => {
            leafletImage(this.#map, (_, canvas) => {  
                const leafletImage = document.createElement("img"); 
                leafletImage.width = imageHeight;
                leafletImage.height = imageWidth;
                leafletImage.src = canvas.toDataURL();
                resolve(leafletImage);
            });
        });
        
        const canvas = document.createElement("canvas");
        canvas.height = puzzleHeight;
        canvas.width = puzzleWidth;
        const ctx = canvas.getContext("2d");
        let index = 0;
        
        for (let i = 0 ; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                ctx.drawImage(img, j * puzzleWidth, i * puzzleHeight, imageWidth, imageHeight, 0, 0, imageWidth, imageHeight);  
                this.#puzzlesArray.push({puzzle: canvas.toDataURL(), id: index});
                index += 1;
            }
        }
        
        for (let i = 0; i < this.#puzzlesArray.length; i++) {
            const temp = this.#puzzlesArray[i];
            const rndIndex = Math.floor(Math.random() * (i + 1));
            this.#puzzlesArray[i] = this.#puzzlesArray[rndIndex];
            this.#puzzlesArray[rndIndex] = temp;
        }
    }

    #displayPuzzles() {
        const mapDimensions = this.#map.getSize();
        const imageHeight = mapDimensions.y;
        const imageWidth = mapDimensions.x;
        const puzzleHeight = imageHeight / 4;
        const puzzleWidth = imageWidth / 4;
        const puzzlePieces = document.getElementById("puzzles-container");
        puzzlePieces.innerHTML = "";
    
        for (let i = 0; i < 16; i++) {
            const puzzle = document.createElement("div");
            puzzle.setAttribute("id", this.#puzzlesArray[i].id);
            puzzle.style.backgroundImage = `url('${this.#puzzlesArray[i].puzzle}')`;
            puzzle.style.height = puzzleHeight + "px";
            puzzle.style.width = puzzleWidth + "px";
            puzzle.className = "puzzle";
            puzzle.setAttribute("draggable", "true");
            puzzle.addEventListener("dragstart", (event) => event.dataTransfer.setData("puzzle", event.target.id));

            puzzlePieces.appendChild(puzzle);
        }
    }

    #createPuzzleBoard() {
        const puzzleBoardContainer = document.getElementById("puzzle-board-container");
        puzzleBoardContainer.innerHTML = "";
        const mapDimensions = this.#map.getSize();
        const puzzleHeight = mapDimensions.y / 4;
        const puzzleWidth = mapDimensions.x / 4;

        const dropEvent = (event) => {
            if (event.target.className == "puzzle") { 
                return; 
            }
        
            event.preventDefault();
            let data = event.dataTransfer.getData("puzzle");
            event.target.appendChild(document.getElementById(data));

            const puzzleSlots = document.getElementById("puzzle-board-container").childNodes;

            for (let i = 0; i < 16; i++) {
                if (
                    !puzzleSlots[i].firstChild ||
                    parseInt(puzzleSlots[i].firstChild.getAttribute("id")) !== i
                    ) {
                        console.log("Puzzle on wrong place or no puzzle in the slot")
                    return;
                }
                console.log("Puzzle on right place: ", i)
            }

            this.#showNotification("You put puzzles together correctly!");
        }

        for (let i = 0; i < 16; i++) {
            const puzzleSlot = document.createElement("div");
            puzzleSlot.style.height = puzzleHeight + "px";
            puzzleSlot.style.width = puzzleWidth + "px";
            puzzleSlot.addEventListener("dragover", (event) => event.preventDefault());
            puzzleSlot.addEventListener("drop", dropEvent);
            puzzleBoardContainer.appendChild(puzzleSlot);
        }
    }

    #success(coordinates) {
        L.marker([coordinates.coords.latitude, coordinates.coords.longitude])
            .addTo(this.#map)
            .bindPopup('You are here')
            .openPopup();
        this.#map.panTo(new L.LatLng(coordinates.coords.latitude, coordinates.coords.longitude));
        document.getElementById("download-button").disabled = false;

        this.#showNotification(`Your coordinates:\nLatitude:${coordinates.coords.latitude}\n` + 
                                `Longitude:${coordinates.coords.longitude}`);
    }

    #showNotification(notificationText) {
        if (!("Notification" in window)) {
            alert("Your browser does not support notification");
        } else if (Notification.permission === "granted") {
            new Notification(notificationText);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    new Notification(notificationText);
                }
            });
        }     
    }
}

new Puzzles();