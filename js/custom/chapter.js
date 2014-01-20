$(document).ready(function() {

	var arrow = $('.chapter em');
	
	$("#courses div").hide();
	$("#select li:last").attr("id","current");
	$("#courses div:last").fadeIn();
	
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
    
    $('#select ul li a').click(function(e) {
        e.preventDefault();        
        $("#courses div").hide(); //Hide all content
        $("#select li").attr("id",""); //Reset id's
        $(this).parent().attr("id","current"); // Activate this
        $('#' + $(this).attr('title')).fadeIn(); // Show content for current tab
    });
});

