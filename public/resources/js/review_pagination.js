//pagination
setTimeout(function(){  
makePager = function(page){
    var show_per_page = 5;
      var number_of_items = $('.card').size();
      var number_of_pages = Math.ceil(number_of_items / show_per_page);
      var number_of_pages_todisplay = 5;
          var navigation_html = '';
          var current_page = page;
          var current_link = (number_of_pages_todisplay >= current_page ? 1 : number_of_pages_todisplay + 1);
          if (current_page > 1)
              current_link = current_page;
          if (current_link != 1) navigation_html += "<a class='nextbutton' href=\"javascript:first();\">« Start&nbsp;</a>&nbsp;<a class='nextbutton' href=\"javascript:previous();\">« Prev&nbsp;</a>&nbsp;";
          if (current_link == number_of_pages - 1) current_link = current_link - 3;
          else if (current_link == number_of_pages) current_link = current_link - 4;
          else if (current_link > 2) current_link = current_link - 2;
          else current_link = 1;
          var pages = number_of_pages_todisplay;
          while (pages != 0) {
              if (number_of_pages < current_link) { break; }
              if (current_link >= 1)
                  navigation_html += "<a class='" + ((current_link == current_page) ? "currentPageButton" : "numericButton") + "' href=\"javascript:showPage(" + current_link + ")\" longdesc='" + current_link + "'>" + (current_link) + "</a>&nbsp;";
              current_link++;
              pages--;
          }
          if (number_of_pages > current_page){
              navigation_html += "<a class='nextbutton' href=\"javascript:next()\">Next »</a>&nbsp;<a class='nextbutton' href=\"javascript:last(" + number_of_pages + ");\">Last »</a>";
          }
                  $('#page_navigation').html(navigation_html);
    }
    var pageSize = 9;
    showPage = function (page) {
          $('.card').hide();
          $('#current_page').val(page);
          $('.card').each(function (n) {
              if (n >= pageSize * (page - 1) && n < pageSize * page)
                  $(this).show();
          });
      makePager(page);
     }
      showPage(1);
     next = function () {
          new_page = parseInt($('#current_page').val()) + 1;
          showPage(new_page);
      }
      last = function (number_of_pages) {
          new_page = number_of_pages;
          $('#current_page').val(new_page);
          showPage(new_page);
      }
      first = function () {
          var new_page = "1";
          $('#current_page').val(new_page);
          showPage(new_page);    
    }
      previous = function () {
          new_page = parseInt($('#current_page').val()) - 1;
          $('#current_page').val(new_page);
          showPage(new_page);
    }
},1000);	