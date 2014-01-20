$(document).ready(function() {

	var courses = $("#courses div");
	var tabs = $('#select li');
	var chapter = $('.chapter em');
	
	var target = $(location).attr('hash');
	
	courses.hide();
	tabs.attr("class","");
	
	if (!target) {
		var current = courses.filter('.current');
		var id = current.attr('id');
		var now = tabs.children().filter(function(i) {
			return i === 1 || $(this).attr( "title" ) === id;
		});
		
		now.parent().attr("class","current");
		current.fadeIn();
	}
	else {
		var selected = courses.filter(target.substring(0,4));
		var tab = tabs.children().filter(function(i) {
			return i === 0 || $(this).attr('title') === target.substring(1,4);
		});
		tab.parent().attr("class","current");
		selected.fadeIn();
	}
    
    tabs.children().click(function(e) {
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

