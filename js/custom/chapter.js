$(document).ready(function() {

	var courses = $("#courses div");
	var tabs = $('#select li');
	var chapter = $('.chapter em');
	
	courses.hide();
	tabs.attr("class","");
	
	var target = $(location).attr('hash');
	
	if (!target) {
		var course = courses.filter('.current');
		var id = course.attr('id');
		var now = $('#select li a').filter(function(i) {
			return i === 1 || $(this).attr( "title" ) === id;
		});
		now.parent().attr("class","current");
		course.fadeIn();
	}
	else {
		var part = target.substring(1,4);
		var selected = courses.filter('#' + part);
		var tab = $('#select li a').filter(function(i) {
			return i === 0 || $(this).attr( "title" ) === part;
		});
		tab.parent().attr("class","current");
		selected.fadeIn();
	}
    
    $('#select li a').click(function(e) {
        e.preventDefault();        
       	courses.hide();
       	tabs.attr("class","");
        $(this).parent().attr("class","current");
        $('#' + $(this).attr('title')).fadeIn();
    });
    
    chapter.click(function () {
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

