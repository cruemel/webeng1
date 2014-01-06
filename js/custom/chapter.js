$(document).ready(function() {

	var arrow = $('.chapter em');
	
	arrow.click(function () {
		var classname = $(this).attr('class');
		if (classname != "minus") {
			$(this).removeClass('plus');
			$(this).addClass('minus');
		}
		else {
			$(this).removeClass('minus');
			$(this).addClass('plus');
		}
		$(this).next("ol.expand").toggle();
	});
});