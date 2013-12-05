/* Skript zum Anhaengen von WAI-ARIA-Rollen-Attributen mit jQuery: */
$(document).ready(function() {
	$("#main").attr("role","main");
	$("#wiki_search").attr("role","search");
	$("#Suchbegriff").attr("aria-required","true");
});