$(function(){
	
	$('#btnadd').click(function(e){
		let rating = $('.main_form .form-item').find('input:checked').val();
		let url = window.location.href;
		
		
		if(rating==undefined || rating==""){
			alert('Choose Rating');
			return false;
		}
		
		var review = $('#descricao').val();
		if(review==undefined || review==""){
			alert('Write Review');
			return false;
		}

		
		id = url.split('/');
		company = id[id.length-1];
		
		$.post('./../checkAuth',{rating:rating,review:review,company:parseInt(company)}, function(data){
			
			alert(data.msg)
			if(data.status){
				location.reload();
			}
				
			
		});
		
	});

	setTimeout(function(){
	  $('.date_format').each(function(){
		let dte = $(this).text().split('GMT')[0];
		$(this).text(dte);
	  });		
		
	},1000);
});	
	