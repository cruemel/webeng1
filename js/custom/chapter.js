$(document).ready(function() {

	var arrow = $('.chapter em');
	
	arrow.click(function () {
		var name = $(this).attr('class');
		var regex = /minus/g;
		var match = regex.exec(name);
		if (!match) {
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