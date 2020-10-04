$('.transport').hide();
$('.category_choose').change(function(e){
   if($(this).val()==1){
	 $('.transport').show();
   }else{
	 $('.transport').hide();  
   }	
});


$('.select_country').change(function(e){
	var _that = $(this);
	$.ajax({
        url: "./../get_state",
        type: 'GET',
		dataType: 'json',
		async:false,
        success: function(data) {
            var state = data;
			$("#from_country_start").find('option').remove();
			$("#to_country_start").find('option').remove();
			
			if(_that.val()==1){
				$('.label_form_text').text('Portugal'); 
				$('.label_to_text').text('Switzerland');
				
				var $p = $("#from_country_start");
				$.each(state.p, function(index, element_p) {
					$p.append($("<option />").val(element_p.id).text(element_p.distrito_name));
				});
				
				var $s = $("#to_country_start");
				$.each(state.s, function(index, element_s) {
					$s.append($("<option />").val(element_s.id).text(element_s.distrito));
				});	
			}else{
				$('.label_form_text').text('Switzerland'); 
				$('.label_to_text').text('Portugal'); 

				var $s = $("#from_country_start");
				$.each(state.s, function(index, element_s) {
					$s.append($("<option />").val(element_s.id).text(element_s.distrito));
				});

				var $p = $("#to_country_start");
				$.each(state.p, function(index, element_p) {
					$p.append($("<option />").val(element_p.id).text(element_p.distrito_name));
				});	
			}
		}
    });
});	
