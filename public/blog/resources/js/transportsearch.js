
          $('#pais2').on('change', function() {
        if( ['1'].indexOf( this.value ) > -1 ) {
            $('.pt').prop('disabled', false).closest('option').show();
            $('.swdes').prop('disabled', false).closest('option').show();
            $('.sw').val('').prop('disabled', true).closest('option').hide();
            $('.ptdes').val('').prop('disabled', true).closest('option').hide();
        } else {
           
       
        if( ['2'].indexOf( this.value ) > -1 ) {
            $('.sw').prop('disabled', false).closest('option').show();
            $('.ptdes').prop('disabled', false).closest('option').show();
       
            $('.pt').val('').prop('disabled', true).closest('option').hide();
            $('.swdes').val('').prop('disabled', true).closest('option').hide();
        }}
    })
    .change();
        