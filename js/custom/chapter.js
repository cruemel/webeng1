$(document).ready(function() {

	var courses = $("#courses div");
	var tabs = $('#select li');
	var button = $('.chapter em');
	
	var target = $(location).attr('hash');
	
	var current = $("#p01");
	var tab = "";
	
	courses.hide();
	// tabs.attr("class","other");
	
	if (!target) {
		course = courses.filter('.current');
	}
	else {
		course = courses.filter(target.substring(0,4));
		var list = $(target.substring(0,8) + " ol.expand");
		list.addClass('current');
		list.prev("em").removeClass('plus');
		list.prev("em").addClass('minus');
	}
	
	tab = tabs.filter('.' + course.attr('id'));
	
	tab.addClass("current");
		
	course.fadeIn();
    
    tabs.children().click(function(e) {
        e.preventDefault();        
       	courses.hide();
       	tabs.attr("class","");
        $(this).parent().attr("class","current");
        $('#' + $(this).attr('title')).fadeIn();
    });
   
    
    button.click(function () {
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

