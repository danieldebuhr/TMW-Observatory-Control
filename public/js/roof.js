var progress_image = null;

var zeitwert_beginn = null;
var zeitwert_aktuell = 0;
var prozentwert = 0;

var stop = false;

var maximale_laufzeit = 57;
var anzahl_bilder = 37;
var letztes_bild = 1;

$(document).ready(function() {
    initRoof();
    setRoof(prozentwert);
});

function stopRoof() {
    stop= true;
}

/**
 * Dach öffnen starten.
 */
function startOpenRoof(callback) {
    if(prozentwert > 0 && prozentwert < 100) {
        zeitwert_beginn = new Date().getTime() - zeitwert_aktuell * 1000;
    } else {
        zeitwert_beginn = new Date().getTime();
    }
    stop = false;
    openRoof(callback);
}

/**
 * Dach schließen starten.
 */
function startCloseRoof(callback) {
    if(prozentwert > 0 && prozentwert < 100) {
        zeitwert_beginn = new Date().getTime() - (maximale_laufzeit-zeitwert_aktuell) * 1000;
    } else {
        zeitwert_beginn = new Date().getTime();
    }
    stop = false;
    closeRoof(callback);
}

function initRoof() {
    progress_image = $("<img/>").attr('src', "img/sternwarte_progress/" + getImage(prozentwert) + '.jpg');
    $("#progress").append(progress_image);
}

/**
 * Initialisiert die Anzeige anhand eines Prozentwertes.
 * @param prozent
 */
function setRoof(prozent) {
    prozentwert = prozent;
    zeitwert_aktuell = 0.57 * prozent;
    progress_image.attr('src', "img/sternwarte_progress/" + getImage(prozent) + '.jpg');
}

/**
 * Öffnende Dachanimation.
 * @param callback
 */
function openRoof(callback) {

    setTimeout(function() {
        zeitwert_aktuell = ((new Date().getTime() - zeitwert_beginn)/1000);
        prozentwert = ( ((new Date().getTime() - zeitwert_beginn)/1000) * 100 / maximale_laufzeit );
        progress_image.attr('src', "img/sternwarte_progress/" + getImage(prozentwert) + ".jpg");
        if(prozentwert < 100 && !stop) {
            openRoof();
        } else {
            if(callback) callback();
        }
    }, 200);
}

/**
 * Schließende Dachanimation.
 * @param callback
 */
function closeRoof(callback) {
    setTimeout(function() {
        zeitwert_aktuell = maximale_laufzeit - ((new Date().getTime() - zeitwert_beginn)/1000);
        var zeit = zeitwert_beginn - new Date().getTime();
        prozentwert = 100 - (-1* ( (zeit / 1000) * 100 / maximale_laufzeit ));
        progress_image.attr('src', "img/sternwarte_progress/" + getImage(prozentwert) + ".jpg");
        if(prozentwert > 0 && !stop) {
            closeRoof(callback);
        } else {
            if(callback) callback();
        }
    }, 200);
}

/**
 * Berechnet das anzuzeigende Bild.
 * @param prozent
 * @returns {number}
 */
function getImage(prozent) {
    var image = Math.round(anzahl_bilder / 100 * prozent);
    if(image > 0 && image <= anzahl_bilder) {
        letztes_bild = image;
        return image;
    } else {
        return letztes_bild;
    }
}