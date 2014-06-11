/***************************************************
* JavaScript-Framework für interaktive Lernaufgaben
****************************************************
*
* V 2.5 (2012/03/18)
*
* Dieses Script wandelt Teile einer Website
* in interaktive Quiz-Aufgaben um. Dazu orientiert
* es sich an CSS-Klassen einzelner HTML-Elemente.
* Dadurch können interaktive Aufgaben auf Websiten
* in einem einfachen WYSIWYG-Editor erstellt
* werden. Die Interaktion geschieht dann mittels
* dieses nachgeladenen Javascripts.
*
* SOFTWARE LICENSE: LGPL
* (C) 2007 Felix Riesterer
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
* 
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
* 
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
* Felix Riesterer (Felix.Riesterer@gmx.net)
*/


var Quiz = {

	triggerClass : "-quiz",	/* Variable, in der das Suffix der CSS-Klasse steht,
		auf die das Script reagiert, um eine Übung als solche zu erkennen und umzuwandeln.
		Es gibt derzeit folgende Übungen, deren Klassennamen wie folgt lauten:
		* Zuordnungsspiel
			-> class="zuordnungs-quiz"
		* Lückentext-Aufgabe
			-> class="lueckentext-quiz"
		* Memo
			-> class="memo-quiz"
		* Multiple Choice - Quiz
			-> class="multiplechoice-quiz"
		* Schüttelrätsel
			-> class="schuettel-quiz"
		* Kreuzworträtsel
			-> class="kreuzwort-quiz"
		*/

	poolClass : "daten-pool", // CSS-Klasse für das Element, in welchem die zu ziehenden Felder liegen
	feldClass : "feld", // CSS-Klasse für Datenfelder
	fertigClass : "geloest", // CSS-Klasse für gelöstes Quiz
	bewertungsClass : "quiz-bewertung", // CSS-Klasse für den Textabsatz mit den Bewertungsergebnissen
	highlightClass : "anvisiert", // CSS-Klasse für das Ziel-Highlighting
	highlightElm : null, // hier steht später eine Referenz auf das HTML-Element, welches gerade als potenzielles Ziel anvisiert wird
	baseURL : false, // enthält später den Pfad zum Ordner dieses Scripts
	codeTabelle : false, // wird später durch ein nachgeladenes Script mit einem Objekt befüllt
	draggableClass : "quiz-beweglich", // CSS-Klasse, die ein Element für Drag&Drop freigibt, damit es beweglich wird.
	draggedClass : "quiz-gezogen", // CSS-Klasse, wenn ein Element gerade bewegt wird.
	dragMode : false, // entscheidet, ob ein Element bei onmousedown gezogen werden soll, oder nicht
	dragElm : null, // hier steht später eine Referenz auf das HTML-Element in dem der mousedown stattfand
	dragElmOldVisibility : "", // hier steht später der originale Wert des gezogenen Elements (wird für's Highlighten verändert)

	mouseLastCoords : {
		// wird später mit den Mauskoordinaten überschrieben werden
		left : 0,
		top : 0
	},

	// Anzahl mouseover-Events, nach denen das Drag-Element unsichtbar geschaltet wird (reduziert das Flimmern beim Draggen)
	visibilityCountDefault : 5,

	// Hier findet später der Countdown statt, um das Drag-Element nicht bei jedem mouseover-Event unsichtbar zu schalten
	visibilityCount : 0,

	// Platzhalter für Eventhandler
	oldWinOnLoad : "leer",
	oldDocOnMouseMove : "leer",
	oldDocOnMouseOver : "leer",
	oldDocOnMouseUp : "leer",
	oldDocOnKeyUp : "leer",

	// Alle Quizze auf einer Seite werden hier beim Initialisieren abgespeichert
	alleQuizze : new Object(),

	// Das gerade benutze Quiz
	aktivesQuiz : null,

	domCreate : function (params) {
		var el, p;
		/* "params" ist ein Objekt mit folgender Struktur:
			{ 	tagName : "p", // z.B. für <p>
				text : "einfach ein Text" // als Kind-Textknoten des Elements
				... // weitere (native) Eigenschaften (wie id, className etc.)
			} */
		if (params.tagName && params.tagName.match(/[a-z]/)) {
			el = document.createElement(params.tagName);

			for (p in params) {
				if (p.match(/^text/i)) {
					el.appendChild(document.createTextNode(params[p]));
				} else {
					if (!p.match(/^tagname$/i)) {
						el[p] = params[p];
					}
				}
			}
		}

		return el;
	},

	domSelect : null, // Hier steht später eine Referenz auf die Sizzle-Engine

	each : function(o, cb, s) {
		// Die each-Methode wurde aus dem TinyMCE-Projekt (von Moxiecode.com) entnommen.
		var n, l;

		if (!o)
			return 0;

		s = s || o;

		if (o.length !== undefined) {
			// Indexed arrays, needed for Safari
			for (n=0, l = o.length; n < l; n++) {
				if (cb.call(s, o[n], n, o) === false)
					return 0;
			}
		} else {
			// Hashtables
			for (n in o) {
				if (o.hasOwnProperty(n)) {
					if (cb.call(s, o[n], n, o) === false)
						return 0;
				}
			}
		}

		return 1;
	},

	init : function () {
		// baseURL herausfinden
		var q = this;

		q.each(document.getElementsByTagName("script"), function (s) {
			if (s.src && s.src.match(/\/quiz.js$/)) {
				q.baseURL = s.src.substr(0, s.src.lastIndexOf("/") + 1);
			}
		});

		// Sizzle-Engine einbinden
		document.getElementsByTagName("head")[0].appendChild(
			q.domCreate({
				tagName : "script",
				type : "text/javascript",
				src : Quiz.baseURL + "sizzle.js"
			})
		);

		// Mehrsprachigkeit einbinden
		document.getElementsByTagName("head")[0].appendChild(
			q.domCreate({
				tagName : "script",
				type : "text/javascript",
				src : Quiz.baseURL + "multilingual.js"
			})
		);

		// UTF-8-Normalizer einbinden
		document.getElementsByTagName("head")[0].appendChild(
			q.domCreate({
				tagName : "script",
				type : "text/javascript",
				src : Quiz.baseURL + "utf8-normalizer.js"
			})
		);

		/* Die Initialisierung könnte mehrfach benötigt werden, die folgenden Umleitungen
			dürfen aber nur einmal gemacht werden! */
		if (q.oldDocOnMouseMove == "leer") {
			q.oldDocOnMouseMove = document.onmousemove;

			document.onmousemove = function (e) {
				if (typeof(q.oldDocOnMouseMove) == "function") {
					q.oldDocOnMouseMove(e);
				}

				q.whileDrag(e);
			}
		}

		// OnMouseOver-Handler nur einmal eintragen
		if (q.oldDocOnMouseOver == "leer") {
			q.oldDocOnMouseOver = document.onmouseover;

			document.onmouseover = function (e) {
				if (typeof(q.oldDocOnMouseOver) == "function") {
					q.oldDocOnMouseOver(e);
				}

				q.einBlender(e);
			}
		}

		// OnLoad-Handler nur einmal eintragen
		if (q.oldWinOnLoad == "leer") {
			q.oldWinOnLoad = window.onload;

			window.onload = function () {
				if (typeof(q.oldWinOnLoad) == "function") {
					q.oldWinOnLoad();
				}

				q.initQuizze();
			}
		}

		// OnMouseUp-Handler nur einmal eintragen
		if (q.oldDocOnMouseUp == "leer") {
			q.oldDocOnMouseUp = document.onmouseup;

			document.onmouseup = function (e) {
				if (typeof(q.oldDocOnMouseUp) == "function") {
					q.oldDocOnMouseUp(e);
				}

				q.each(q.alleQuizze, function (a) {
					if (a.element.onmouseup) {
						a.element.onmouseup(e);
					}
				});
			}
		}

		// OnKeyUp-Handler nur einmal eintragen
		if (q.oldDocOnKeyUp == "leer") {
			q.oldDocOnKeyUp = document.onkeyup;

			document.onkeyup = function (e) {
				if (typeof(q.oldDocOnKeyUp) == "function") {
					q.oldDocOnKeyUp(e);
				}

				q.each(q.alleQuizze, function (a) {
					if (a.element.onkeyup) {
						a.element.onkeyup(e);
					}
				});
			}
		}

		// Erweiterung für das native String-Objekt in JavaScript: trim()-Methode (wie in PHP verfügbar)
		if (typeof(new String().quizTrim) != "function") {
			String.prototype.quizTrim = function () {
				var l = new RegExp(
					"^[" + String.fromCharCode(32) + String.fromCharCode(160) + "\t\r\n]+",
					"g"
				);
				var r = new RegExp(
					"[" + String.fromCharCode(32) + String.fromCharCode(160) + "\t\r\n]+$",
					"g"
				);

				return this.replace(l, "").replace(r, "");
			};
		}

		// Erweiterung für das native Array-Objekt: contains()-Methode
		if (![].contains) {
			Array.prototype.contains = function (el, strict) {
				var i;

				for (i = 0; i < this.length; i++) {
					if (this[i] === el) {
						return true;
					}
				}

				return false;
			};
		}

		// Erweiterung für das native Array-Objekt: shuffle()-Methode
		if (typeof(new Array().shuffle) != "function") {
			Array.prototype.shuffle = function () {
				var ar = [], zufall, i;

				while (this.length > 0) {
					zufall = Math.floor(Math.random() * this.length);

					ar.push(this[zufall]);

					this.splice(zufall, 1); // Element entfernen
				}

				for (i = 0; i < ar.length; i++) {
					this[i] = ar[i];
				}

				return this;
			};
		}
	},

/*
=================
 Quiz - Funktionen
=================
 */

	/* Diese Funktion erzeugt ein Multiple Choice - Quiz. Dazu braucht sie Textabsätze innerhalb eines Elternelementes
	mit dem CSS-Klassen-Präfix "multiplechoice", z.B. "multiplechoice-quiz", wenn "-quiz" das Suffix der Quiz.triggerClass ist.
	In den Textabsätzen stehen die jeweiligen Quiz-Fragen, die Antworten stehen am Ende der Absätze in runden Klammern. Falsche
	Antworten haben innerhalb der Klammer gleich als erstes Zeichen ein Ausrufezeichen, richtige Antworten nicht.
	Textabsätze ohne Klammernpaar am Ende werden nicht als Quiz-Fragen interpretiert. */

	multiplechoiceQuiz : function (div) {
		var q = this,
			fragen, i;

		var quiz = {
			// Objekt-Gestalt eines Multiple Choice - Quizzes
			name : "Quiz-x", // Platzhalter - hier steht später etwas anderes.
			typ : "Multiple Choice - Quiz",
			loesungsClass : "quiz-antworten", // CSS-Klasse für das Elternelement mit den Antworten
			element : div, // Referenz auf das DIV-Element, in welchem sich das Quiz befindet
			fragen : new Array(), // Hier stehen später die Fragen zusammen mit ihren Antworten
			sprache : (div.lang && div.lang != "") ? div.lang : "de", // deutsche Meldungen als Voreinstellung

			// Funktion zum Auswerten eines aufgedeckten Sets
			auswerten : function () {
				var t = this,
					anzahl, test, richtigkeit;

				// Antwort-Blöcke ermitteln
				richtigkeit = 0; // Anzahl der gezählten Treffer
				anzahl = 0; // Anzahl der möglichen richtigen Antworten

				q.each(q.domSelect("."+t.loesungsClass, t.element), function(a) {
					// Jeden Antwortblock einzeln durchgehen
					var ok = 0; // Anzahl Treffer abzüglich falscher Treffer

					q.each(q.domSelect("input", a), function(i) {
						// <li>-Element ermitteln, um es später einzufärben
						var li = i.parentNode;

						while (!li.tagName || !li.tagName.match(/^li$/i)) {
							li = li.parentNode;
						}

						// Checkbox unveränderlich machen
						i.disabled = "disabled";

						if (i.id.match(/_f$/)) {
							// Aha, eine Falschantwort...
							if (i.checked) {
								// ... wurde fälschlicherweise angewählt!
								li.className = "falsch";
								ok--;
							}

						} else {
							// Aha, eine richtige Antwort...
							li.className = "richtig";
							anzahl++; // Anzahl der möglichen richtigen Antworten erhöhen

							if (i.checked) {
								// ...wurde korrekt angewählt
								ok++;
							}
						}
					});

					// keine negative Wertung für eine Antwort
					ok = ok < 0 ? 0 : ok;

					richtigkeit += ok; // richtige Treffer merken
				});

				richtigkeit = (anzahl > 0) ?
					Math.floor(richtigkeit / anzahl * 1000) / 10 // auf eine Zehntelstelle genau
					: 0;

				// Auswertung ins Dokument schreiben
				t.element.appendChild(q.domCreate({
					tagName : "p",
					className : q.bewertungsClass,
					text : q.meldungen[t.sprache].ergebnisProzent.replace(/%n/i, richtigkeit)
				}));

				t.solved = true;
				t.element.className += " " + q.fertigClass;

				// Auswertungs-Button entfernen
				test = q.domSelect(".auswertungs-button", t.element);

				if (test.length > 0) {
					t.element.removeChild(test[0]);
				}
			},

			// Funktion zum Anzeigen der Fragen und der vermischten möglichen Antworten
			init : function () {
				var t = this,
					frage, antworten, i, j, html, ID;

				// Spracheinstellungen auf deutsch zurück korrigieren, falls entsprechende Sprachdaten fehlen
				if (!q.meldungen[t.sprache]) {
					t.sprache = "de";
				}

				/* Jede Antwort wird zu einem Listen-Element innerhalb einer geordneten Liste.
					Die Liste erhält die CSS-Klasse quiz.loesungsClass.
					Die Listenelemente erhalten eine ID, die sich nur am letzten Buchstaben unterscheidet.
					Die ID einer Falschantwort erhält zusätzlich ein "_f". */

				for (i = 0; i < t.fragen.length; i++) {
					
					// Frage in das Dokument schreiben
					frage = q.domCreate({
						tagName: "p"
					});

					frage.innerHTML = t.fragen[i].frage;
					// t.element.insertBefore(frage, t.fragen[i].original);

					// Antworten zusammenstellen und vermischt ausgeben
					antworten = q.domCreate({
						tagName : "ul",
						className : t.loesungsClass
					});

					html = "";
					t.fragen[i].antworten.shuffle();

					for (j = 0; j < this.fragen[i].antworten.length; j++) {
						ID = this.name + "_" + i + String.fromCharCode(j + 97);

						if (this.fragen[i].antworten[j].match(/^\!/))
							ID += "_f"; // Falschantwort markieren

						html += '<li>'
							+ '<input type="checkbox" id="' + ID + '">'
							// + '<label for="' + ID + '"> '
							+ t.fragen[i].antworten[j].replace(/^\!/, "")
							// + '</label>'
							+ '</li>';
					}

					antworten.innerHTML += html;
					
					var ab = document.createElement("section");
					
					ab.appendChild(frage);
					ab.appendChild(antworten);

					t.element.appendChild(ab);
					t.element.removeChild(t.fragen[i].original);
				}

				// Auswertungsbutton anzeigen
				t.element.appendChild(q.domCreate({
					tagName : "p",
					className : "auswertungs-button",
					text : q.meldungen[t.sprache].pruefen,
					onclick : function () { t.auswerten(); }
				}));

				// ID für das umgebende DIV-Element vergeben
				t.element.id = t.name;
			}
		}


		// Laufende Nummer ermitteln -> Quiz-Name wird "quiz" + laufende Nummer
		i = 0;
		q.each(q.alleQuizze, function() {
			i++;
		});
		quiz.name = "quiz" + i;

		// Gibt es Quiz-Daten?
		fragen = q.domSelect("p", div);

		if (fragen.length < 1) {
			// Keine Textabsätze für Quiz-Daten gefunden! -> abbrechen
			return false;
		}

		// Daten sind also vorhanden? -> Auswerten
		q.each(fragen, function (f) {
			// Textabsatz durchforsten
			var test = f.innerHTML.replace(/[\t\r\n]/g, " "),
				daten = {
					frage : "",
					antworten : new Array(),
					original : null // Referenz auf den originalen Textabsatz, um ihn später zu entfernen
				};
			
			// test = test.replace(/(<p>|<\/p>)/g, "");

			// Zeilenumbrüche und überflüssige Leerzeichen entfernen
			test = test.replace(/(<br>|<br\/>|<br \/>|&bnsp;| )*$/ig, "");

			while (test.match(/\)$/)) {
				daten.antworten.push(test.replace(/^.*\(([^\(\)]*)\)$/, "$1"));

				// extrahierte Antwort aus dem String entfernen
				test = test.replace(/^(.*)\([^\(\)]*\)$/, "$1");
				test = test.quizTrim();
			}

			// Passende Fragen im aktuellen Textabsatz gefunden?
			if (daten.antworten.length > 0) {
				// Ja! Frage mit dazu ...
				daten.frage = test;
				daten.original = f; // Referenz zum ursprünglichen Textabsatz

				// ... und Daten ins Quiz übertragen
				quiz.fragen.push(daten);
			}
		});

		// Keine brauchbare Daten? -> Verwerfen!
		i = 0;
		q.each(quiz.fragen, function() {
			i++;
		});

		if (i < 1) {
			return false;
		}

		// Quiz in die Liste aufnehmen und initialisieren
		q.alleQuizze[quiz.name] = quiz;
		quiz.element.quiz = quiz;
		quiz.init();

		return true;
	},

/*
==================
 weitere Funktionen
==================
 */
	// Zeichen in eintragbare Buchstaben umwandeln: "s" ist ein String
	wandleZeichen : function (s) {
		var q = this,
			r = "",
			z, i, j;

		for (i = 0; i < s.length; i++) {
			if (s[i] == String.fromCharCode(160) || s[i] == String.fromCharCode(32)) {
				r += String.fromCharCode(160);

			} else {
				for (z in q.codeTabelle) {
					if (z.match(/^[A-Z][A-Z]?$/)) {
						for (j = 0; j < q.codeTabelle[z].length; j++) {
							if (s.substr(i, 1) == q.codeTabelle[z][j]) {
								r += z;
							}
						}
					}
				}
			}
		}

		return r;
	},

	initQuizze : function () {
		var q = this;

		// prüfen, ob Code-Tabelle für UTF-8-Normalisierung und Mehrsprachenunterstützung geladen wurden
		if (!q.codeTabelle || !q.meldungen.en || !q.domSelect) {
			window.setTimeout(q.initQuizze, 100);
			return false;
		}

		// Initialisierung der Quizze
		var quizBereiche = new Array(),
			muster = new RegExp(q.triggerClass),
			i, j, a, gefunden, typ, ok, css;

		// Alle DIVs daraufhin überprüfen, ob sie eine CSS-Klasse haben, die auf ein Quiz schließen lässt
		q.each(q.domSelect("div"), function (d) {
			if (d.className && d.className.match(muster)) {
				quizBereiche.push(d);
			}
		});

		// Alle Quiz-Bereiche gefunden -> Initialisieren
		if (quizBereiche.length > 0) {
			q.each(quizBereiche, function (d) {
				var typ = d.className.replace(/([^ ,]+)-quiz/, "$1"),
					gefunden, ok; // Initialisierung ok?

				if (typeof(q[typ + "Quiz"]) == "function") {
					ok = q[typ + "Quiz"](d); // entsprechende Quiz-Funktion zum Erstellen aufrufen
				}

				// Initialisierung OK? -> Warnungen entfernen
				if (ok) {
					q.each(q.domSelect(".js-hinweis", d), function (j) {
						j.parentNode.removeChild(j);
					});
				}
			});
		}

		// Wenn mindestens ein Quiz initialisiert wurde, dann Seite "bestücken".
		if (q.alleQuizze.quiz0) {
			// CSS für Quizbereiche einbinden
			q.domSelect("head")[0].appendChild(
				q.domCreate({
					tagName : "link",
					rel : "stylesheet",
					type : "text/css",
					media : "screen, projection",
					href : q.baseURL + "css/quiz.css"
				})
			);

			/*
			// Print-CSS für Quizbereiche einbinden
			q.domSelect("head")[0].appendChild(
				q.domCreate({
					tagName : "link",
					rel : "stylesheet",
					type : "text/css",
					media : "print",
					href : q.baseURL + "css/quiz-print.css"
				})
			);
			*/

			// Links innerhalb eines Quizzes solange deaktivieren, bis es gelöst ist:
			q.each(q.alleQuizze, function (a) {
				if (a.felder) {
					q.each(a.felder, function (f) {
						gefunden = [];

						if (f.getElementsByTagName) {
							gefunden = f.getElementsByTagName("a");
						}

						if (f.element && f.element.getElementsByTagName) {
							gefunden = f.element.getElementsByTagName("a");
						}

						q.each(gefunden, function (g) {
							g.quiz = a;
							g.oldOnClick = g.onclick;
							g.onclick = q.linkOnClick; // neue onclick-Funktion, die Klicks blocken kann
						});
					});
				}

				// onclick-EventHandler für jedes <div> eines Quizzes setzen
				if (typeof a.element.onclick == "function") {
					a.element.oldOnClick = a.element.onclick;
				}

				a.element.onclick = function (e) {
					q.aktivesQuiz = this.quiz;
					if (typeof this.oldOnClick == "function") {
						this.oldOnClick(e);
					}
					return true;
				};
			});
		}
	},

	// neue onclick-Funktion für Links
	linkOnClick : function (e) {
		if (this.quiz.typ == "Multiple Choice - Quiz"
			|| this.quiz.typ == "Buchstabenraten-Quiz"
			|| this.quiz.solved
		) {
			if (typeof this.oldOnClick == "function") {
				this.oldOnClick(e);
			}

			return true;
		}

		return false;
	},
	
		startDrag : function (e) {
		var q = Quiz,
			muster = new RegExp("(^|\\s)" + q.draggableClass + "(\\s|$)"),
			test;

		q.dragElm = q.eventElement(e);

		test = q.dragElm;

		/* Nur bei Klick auf ein entsprechend ausgezeichnetes Element
			(oder eines seiner Nachfahren-Elemente) Drag&Drop-Verhalten zeigen! */
		while (test != document.body
			&& (!test.className
				|| !test.className.match(muster)
		)) {
			test = test.parentNode;
		}

		if (test != document.body && test.className.match(muster)) {
			q.dragElm = test;
			q.dragMode = true;

			// aktives Quiz eintragen
			q.aktivesQuiz = q.alleQuizze[q.dragElm.id.replace(/^([^_]+).+/, "$1")];
console.debug("aktives Quiz: "+q.aktivesQuiz.name+"quiz.loesungsClass: "+q.aktivesQuiz.loesungsClass);
		}

		return !q.dragMode;
	},

	whileDrag : function (e) {
		var q = Quiz,
			muster = new RegExp("(^|\\s)" + q.feldClass + "(\\s|$)"),
			top, left, dx, dy, offsetX, offsetY, element;

		e = e || window.event;

		left = e.clientX,
		top = e.clientY

		q.IE = (document.compatMode && document.compatMode == "CSS1Compat") ?
			document.documentElement : document.body || null;

		if (q.IE && typeof (q.IE.scrollLeft) == "number") {
			left += q.IE.scrollLeft;
			top +=  q.IE.scrollTop;
		}

		// Abstand zu den letzten Mauskoordinaten berechnen
		dx = q.mouseLastCoords.left - left;
		dy = q.mouseLastCoords.top - top;

		// Mauskoordinaten speichern
		q.mouseLastCoords.left = left;
		q.mouseLastCoords.top = top;

		// falls gerade kein Element gezogen wird, hier beenden
		if (!q.dragElm || !q.dragMode) {
			return true;
		}

		// falls das zu ziehende Element noch nicht "losgelöst" wurde, dieses beweglich machen
		if (!q.dragged) {
			q.dragElmOldVisibility = q.dragElm.style.visibility;

			// Nur Felder neu positionieren
			if (q.dragElm.className.match(muster)
				|| q.dragElm.style.left == ""
			) {
				q.dragElm.style.top = "0px";
				q.dragElm.style.left = "0px";
			}

			// Markierungseffekt im IE unterbinden
			q.antiMarkierungsModusFuerIE(true);

			q.dragElm.className += " " + q.draggedClass;
		}

		if (q.visibilityCount < 1) {
			// Durchscheinen, damit ein mouseover-Event des unterhalb liegenden Elementes möglich wird
			q.dragElm.style.visibility = "hidden";
		}

		// zu ziehendes Element bewegen
		left = parseInt(q.dragElm.style.left);
		top = parseInt(q.dragElm.style.top);
		q.dragElm.style.left = left - dx + "px";
		q.dragElm.style.top = top - dy + "px";
		q.dragged = true;

		// Zähler zurücksetzen
		q.visibilityCount = q.visibilityCount < 1 ?
			Math.ceil(q.visibilityCountDefault) : q.visibilityCount -1;

		return true;
	},

	stopDrag : function (e) {
		var q = Quiz,
			returnVal;

		if (!q.dragElm || !q.dragElm.className) {
			return false;
		}

		// Anti-Markier-Effekt in IE beenden
		q.antiMarkierungsModusFuerIE();

		if (q.dragged) {
			// eventuelle aktive Eingabefelder deaktivieren - aber nur wenn Drag&Drop stattgefunden hat!
			q.each(q.domSelect("input"), function (i) {
				try { i.blur(); }
				catch (e) { }

				try { i.onblur(); }
				catch (e) { }
			});
		}

		// bewegtes Element wieder eingliedern
		q.dragElm.className = q.dragElm.className.replace(
			new RegExp(" ?" + q.draggedClass), ""
		);

		// Sichtbarkeit wurde nur verändert, wenn das Element wirklich gezogen wurde...
		if (q.dragged) {
			q.dragElm.style.visibility = q.dragElmOldVisibility;
			q.dragElmOldVisibility = "";
		}

		// Position (nur!) bei Feldern wieder zurückstellen
		if (q.dragElm.className.match(new RegExp("(^|\\s)" + q.feldClass + "(\\s|$)"))
			&& q.dragged
		) {
			q.dragElm.style.top = "";
			q.dragElm.style.left = "";
		}

		// Rückgabewert bereitstellen
		returnVal = q.dragged ?
			// für Drag&Drop
			q.auswahl(q.dragElm, q.highlightElm) :
			// für einen simplen Klick (zweiter Parameter false!)
			q.auswahl(q.dragElm, false);

		// Variablen wieder löschen
		q.dragElm = null;
		q.dragged = false;
		q.dragMode = false;

		// gehighlightetes Element wieder abstellen
		if (q.highlightElm) {
			q.highlightElm.className = q.highlightElm.className.replace(
				new RegExp(" ?" + q.highlightClass), ""
			);
			q.highlightElm = null;
		}

		return returnVal;
	},

	highlight : function (e) {
		var q = Quiz,
			old = q.highlightElm,
			test, original, muster;

		if (!q.dragMode) {
			// Kein Drag&Drop-Vorgang!
			return true;
		}

		if (!q.dragElm.style.visibility || q.dragElm.style.visibility != "hidden") {
			// Das zu ziehende Element ist gerade nicht auf unsichtbar geschaltet! Kein Highlighting möglich!
			return true;
		}

		// befinden wir uns innerhalb des richtigen Quizzes?
		original = q.eventElement(e);
		test = original;

		while (!test.tagName || (
			!test.tagName.match(/^div$/i)
			&& test != document.body
		)) {
			test = test.parentNode;
		}

		if (!q.aktivesQuiz
			|| test == document.body
			|| (
				test.tagName.match(/^div$/i)
				&& test.id != q.aktivesQuiz.name
			)
		) {
			// Falsches Quiz! Beenden!
			return true;
		}

		// anvisiertes Lösungs-Element highlighten
		muster = new RegExp(
			"(^|\\s)("
			+ q.aktivesQuiz.loesungsClass
			+ "|"
			+ q.poolClass
			+ ")(\\s|$)");

		/* wenn aktuelles Element nicht die benötigte CSS-Klasse hat
			-> Element im DOM-Baum aufwärts suchen gehen... */
		test = original;

		while (!test.className.match(muster)
			&& test != q.aktivesQuiz.element
			&& test != document.body
		) {
			test = test.parentNode;
		}

		// passendes Element gefunden?
		if (!test.className.match(muster)) {
			// Nein! -> beenden
			return true;
		}

		q.highlightElm = test;

		// Highlighten!
		if (old) {
			// altes Highlight entfernen, falls vorhanden
			muster = new RegExp(" ?" + q.highlightClass, "");
			old.className = old.className.replace(muster, "");
		}

		// neues Element highlighten
		q.highlightElm.className += " " + q.highlightClass;

		return true;
	},

	einBlender : function (e) {
		var q = Quiz;

		if (q.dragElm) {
			q.dragElm.style.visibility = q.dragElmOldVisibility;
		}

		return true;
	},

	antiMarkierungsModusFuerIE : function (schalter) {
		var q = this;

		if (schalter) {
			// Anti-Markierungs-Effekt für IE einschalten
			q.oldDocOnSelectStart = document.onselectstart;
			q.oldDocOnDragStart = document.ondragstart;
			document.onselectstart = function () { return false;};
			document.ondragstart = function () { return false;};

		} else {
			// Anti-Markier-Effekt für IE beenden
			if (q.oldDocOnSelectStart
				|| typeof(document.onselectstart) == "function"
			) {
				document.onselectstart = q.oldDocOnSelectStart;
			}

			if (q.oldDocOnDragStart
				|| typeof(document.ondragstart) == "function"
			) {
				document.ondragstart = q.oldDocOnDragStart;
			}
		}
	}

};


// initialisieren
Quiz.init();
