// Background Scrolling

const backgroundScrollSpeed = .25;
var bgPosX = 0;
var bgPosY = 0;
var checkerboard;

function scrollCheckerboard() {
    bgPosX += backgroundScrollSpeed;
    bgPosY += backgroundScrollSpeed;
    checkerboard.style.backgroundPosition = bgPosX + "px " + bgPosY + "px";
    window.requestAnimationFrame(scrollCheckerboard);
}
window.requestAnimationFrame(scrollCheckerboard);

// Map Stuff
const defaultZoom = 1;
const reticleZoom = 1.0;
const halfReticleSize = 200;
var reticle;
var reticleMap;
var dates;
var dateList;
var showInfoElements;

var mapTween;
var reticleTween;
const reticleOffset = {x: 0, y: 0};

const currentWindowCoords = {x: 0, y: 0};
const defaultCoords = {x: 160, y: 320};
var currentSelectionIndex = -1;
const coordinatesArray = [
    {x: 144, y: 232}, // 1
    {x: 192, y: 185}, // 2
    {x: 145, y: 136}, // 3
    {x: 192, y: 88}, // 4
    {x: 288, y: 137}, // 5
    {x: 337, y: 136}, // 6
    {x: 288, y: 185}, // 7
    {x: 144, y: 232}, // 1
    {x: 192, y: 185}, // 2
    {x: 145, y: 136}, // 3
    {x: 192, y: 88}, // 4
    {x: 288, y: 137}, // 5
    {x: 337, y: 136}, // 6
];
const mapAnimDurationMS = 500;

const glitchMapBGPos = {x: 0, y: 0};

const currentZoomAmount = {x: 1, y: 1};

var glitchMap;
var realMap;
var mapWindowWidth;
var mapWindowHeight;
const mapActualWidth = 464;
const mapActualHeight = 360;

document.addEventListener('DOMContentLoaded', (event) => {
    // Get elements
    checkerboard = document.getElementsByClassName("checkerboard")[0];
    glitchMap = document.getElementById("map-background");
    reticle = document.getElementById("reticle");
    realMap = document.getElementById("real-map");
    dates = document.getElementById("dates");
    dateList = dates.getElementsByTagName("ul")[0];
    showInfoElements = dates.getElementsByClassName("show-info");

    // Reticle circle styling based on reticle size
    realMap.style.clipPath = "circle(" + halfReticleSize + "px at " + halfReticleSize + "px " + halfReticleSize + "px)";

    observeWindowResize();
    window.addEventListener("resize", observeWindowResize);

    let dateLinks = dates.getElementsByClassName("show");
    for (let i = 0; i < dateLinks.length; i++) {
        dateLinks[i].addEventListener("click", function(event) {
            currentSelectionIndex = i;
            animateMapTargetTo(coordinatesArray[i], mapAnimDurationMS);
            showInfoForShowIndex(i);
        });
    }

    // TEMP SOLUTION
    for (let i = 0; i < showInfoElements.length; i++) {
        let closeDiv = showInfoElements[i].getElementsByClassName("close")[0];
        closeDiv.addEventListener("click", function(event) {
            returnToDatesFrom(i);
        });
    }

    // Tween animation loop
    function animateTween(time) {
        requestAnimationFrame(animateTween);
        TWEEN.update(time);
    }
    requestAnimationFrame(animateTween);
});

function observeWindowResize() {
    mapWindowWidth = glitchMap.clientWidth;
    mapWindowHeight = glitchMap.clientHeight;

    // Update background zoom
    let windowRatio = mapWindowWidth/mapWindowHeight;
    let imageRatio = mapActualWidth/mapActualHeight;
    if (windowRatio > imageRatio) {
        let scalar = windowRatio / imageRatio;
        currentZoomAmount.x = defaultZoom;
        currentZoomAmount.y = defaultZoom * scalar;
    } else {
        let scalar = imageRatio / windowRatio;
        currentZoomAmount.x = defaultZoom * scalar;
        currentZoomAmount.y = defaultZoom;
    }
    glitchMap.style.backgroundSize = currentZoomAmount.x * 100 + "% " + currentZoomAmount.y * 100 + "%";
    realMap.style.backgroundSize = reticleZoom * currentZoomAmount.x * 100 + "% " + reticleZoom * currentZoomAmount.y * 100 + "%";

    let coords;
    if (currentSelectionIndex > -1) {
        coords = coordinatesArray[currentSelectionIndex];
    } else {
        coords = defaultCoords;
    }
    animateMapTargetTo(coords, 0);
}

function randomRoundedRange(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function animateMapTargetTo(coords, t) {
    if (mapTween) {
        mapTween.stop();
    }
    if (reticleTween) {
        reticleTween.stop();
    }
    
    let scaledCoords = convertTargetCoordsToDocCoords(coords, defaultZoom);
    let xOffset = randomRoundedRange(-100, 100);
    let yOffset = randomRoundedRange(-100, 100);
    scaledCoords.x += xOffset;
    scaledCoords.y += yOffset;

    mapTween = new TWEEN.Tween(currentWindowCoords)
        .to(scaledCoords, t)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            targetMapLocation(currentWindowCoords.x, currentWindowCoords.y);
        })
        .start();

    let targetOffset = {x: mapWindowWidth/2 - xOffset, y: mapWindowHeight/2 - yOffset};
    reticleTween = new TWEEN.Tween(reticleOffset)
        .to(targetOffset, t)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(() => {
            moveReticleTo(reticleOffset.x, reticleOffset.y);
        })
        .start();
}

function targetMapLocation(x, y) {
    // We need to find a backgroundPosition that will put the target
    // into the center of the map window starting from top/left coords
    let xOffset = mapWindowWidth/2;
    let yOffset = mapWindowHeight/2;
    glitchMapBGPos.x = xOffset - x;
    glitchMapBGPos.y = yOffset - y;
    glitchMap.style.backgroundPosition = glitchMapBGPos.x + "px " + glitchMapBGPos.y + "px";
}

function moveReticleTo(x, y) {
    console.log(x, y);
    x -= halfReticleSize;
    y -= halfReticleSize;
    reticle.style.left = x + "px";
    reticle.style.top = y + "px";
    let newX = 0;
    let newY = 0;
    newX = glitchMapBGPos.x * reticleZoom;
    newY = glitchMapBGPos.y * reticleZoom;
    newX -= x * reticleZoom;
    newY -= y * reticleZoom;
    newX -= halfReticleSize * (reticleZoom - 1);
    newY -= halfReticleSize * (reticleZoom - 1);
    realMap.style.backgroundPosition = newX + "px " + newY + "px";
}

function convertTargetCoordsToDocCoords(coords, zoom) {
    let effectiveMapBGScale = Math.max(mapWindowWidth/mapActualWidth, mapWindowHeight/mapActualHeight) * zoom;
    return {x: coords.x * effectiveMapBGScale, y: coords.y * effectiveMapBGScale};
}

function showInfoForShowIndex(index) {
    dateList.classList.add("hide");
    showInfoElements[index].classList.remove("hide");
}

function returnToDatesFrom(index) {
    dateList.classList.remove("hide");
    showInfoElements[index].classList.add("hide");
}
