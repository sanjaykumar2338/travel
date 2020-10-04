module.exports = function(app, passport,fs) {

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY	
	
var connection = require('./../../app/database/db.js');


app.get('/store', function(req, res) {
	var category = req.query.category;
	var size = req.query.size;
	var country = req.query.country;

	var search_param = [];
	if(category){
		var innerObj = 'category_id='+category;
		search_param.push(innerObj)
	}
	
	if(size){
		var innerObj = 'size_id='+size;
		search_param.push(innerObj);
	}
	
	if(country){
		var innerObj = 'country_id='+country;
		search_param.push(innerObj);
	}
	
	var search_certi = '';
	if(search_param.length > 0){
		var arr_len = search_param.length;
		search_param.forEach(function(entry,index) {	
			var check = parseInt(index) + 1;
		
			if(check==arr_len){
				search_certi += entry; 
			}else{
				search_certi += entry+' AND '; 	
			}
		  
		});
	}
	
	var query = '';
	if(search_certi==''){
		
		query = 'Select product.id as product_id,product.title,product.description,product.price,product.image,category.name as category_name,size.name as size_name,size.id as size_id,country.name as country_name from product LEFT JOIN category ON category.id = product.category_id LEFT JOIN country ON country.id = product.country_id LEFT JOIN size ON size.id = product.size_id order by product.updated_at desc';
	}else{
		
		query = 'Select product.id as product_id,product.title,product.description,product.price,product.image,category.name as category_name,size.name as size_name,country.name as country_name from product LEFT JOIN category ON category.id = product.category_id LEFT JOIN country ON country.id = product.country_id LEFT JOIN size ON size.id = product.size_id where '+search_certi+' order by product.updated_at desc';
	}
  
	connection.query(query, function(err,result) {
	  console.log(err,'err')	
	  fs.readFile('shipping_method.json', (err, shipping_method_arr) => {
			
		  connection.query('Select * from category', function(err,category_res) {
			connection.query('Select * from size', function(err,size_res) {  
			 connection.query('Select * from country', function(err,country_res) {  
			
				res.render('store.ejs', {
					stripePublicKey:stripePublicKey,
					items: result,
					category:category_res,
					size:size_res,
					country:country_res,
					shipping_method_arr:JSON.parse(shipping_method_arr),
					req:req
				});
			  
			});
			});
		  });
		});
	});
});

app.get('/checkout', async (req, res) => {
  res.render('checkout');
});

app.get('/stripe_payment', function(req, res) {
  res.render('charge.ejs');
});

app.post('/direct_bank_payment', function(req, res) {
      const itemsArray = req.body.items;
      let total = 0
      req.body.items.forEach(function(item) {
        total = total + item.price * item.quantity
      })

      total = total.toFixed(2);
      total = parseFloat(total);
      var amountInCents = Math.floor(total * 100);

    
	  var charge_id = '';
	  var responseJson = JSON.stringify(req.body.items);
	  var values = [];
	  values.push([req.body.iban_bank_random_number,total,req.body.iban_bank,req.body.email_id,charge_id,req.body.shipping_method,req.body.other_info,req.body.recept,req.body.street,req.body.state,req.body.country,req.body.zipcode]);
	  
	  connection.query('INSERT INTO orders (secret_trans_number,paid_amt,payment_method,email,stripe_charge_it,shipping_method,other_info,recept,street,state,country,zip_code) VALUES ?', [values], function(err,result) {
		var error = ''; 
		if(err) {
		  console.log('insert error',err);
		}
	   else {
		  console.log('inserted success');
		  
		  if(req.body.items){
			  req.body.items.forEach(function(item, index) {
				var insert_items = [];  
				insert_items.push([result.insertId,item.id,item.quantity,item.selected_choose]);					
				
				connection.query('INSERT INTO order_items (order_id,product_id,quantity,size) VALUES ?', [insert_items],function(err,result) {
					//console.log(err,result);
				});
				
			  });
		  }
		}
	  });
	  
	  res.json({ message: 'Successfully purchased items' })
      
})

app.post('/checkout', function(req, res) {
      const itemsArray = req.body.items;
      let total = 0
      req.body.items.forEach(function(item) {
        total = total + item.price * item.quantity
      })

      total = total.toFixed(2);
      total = parseFloat(total);
      var amountInCents = Math.floor(total * 100);

      stripe.charges.create({
        amount: amountInCents,
        source: req.body.stripeTokenId,
        currency: 'eur'
      }).then(function(response) {
		  var charge_id = response.id;
          var responseJson = JSON.stringify(req.body.items);
          var values = [];
          values.push([total,'Stripe',response.billing_details.name,charge_id,req.body.shipping_method,req.body.other_info,req.body.recept,req.body.street,req.body.state,req.body.country,req.body.zipcode]);
          
          connection.query('INSERT INTO orders (paid_amt,payment_method,email,stripe_charge_it,shipping_method,other_info,recept,street,state,country,zip_code) VALUES ?', [values], function(err,result) {
			var error = ''; 
            if(err) {
              console.log('insert error',err);
            }
           else {
              console.log('inserted success');
			  
			  if(req.body.items){
				  req.body.items.forEach(function(item, index) {
					var insert_items = [];  
					insert_items.push([result.insertId,item.id,item.quantity,item.selected_choose]);					
					
					connection.query('INSERT INTO order_items (order_id,product_id,quantity,size) VALUES ?', [insert_items],function(err,result) {
						//console.log(err,result);
					});
					
				  });
			  }
            }
          });
		  
		  res.json({ message: 'Successfully purchased items' })
      }).catch(function(err) {
        console.log('Charge Fail',err)
        res.status(500).end()
      })
})

//Manage All the routes of Admin
var year = new Date().getFullYear();

//For Products
app.get("/admin", async  (req, res) => {  	
	res.render('admin/main.ejs',{year:year});
});

app.get("/admin/product", async  (req, res) => {
	res.locals.message = req.flash();
	connection.query('Select product.id as product_id,product.title,product.description,product.price,product.image,category.name as category_name,size.name as size_name,country.name as country_name from product LEFT JOIN category ON category.id = product.category_id LEFT JOIN country ON country.id = product.country_id LEFT JOIN size ON size.id = product.size_id order by product.updated_at desc', function(err,result) {
		
	res.render('admin/product/products.ejs',{
			year:year,
			result:result
		});
	});	
});

app.get("/admin/padd", async  (req, res) => {
	connection.query( 'SELECT * FROM category', function(err1,category_res) {
		connection.query( 'SELECT * FROM country', function(err2,country_res) {
			connection.query( 'SELECT * FROM size', function(err3,size_res) {
				res.render('admin/product/new_product.ejs',{year:year,category:category_res,country:country_res,size:size_res});
			});	
		});	
	});
});

app.get("/admin/edit_product", async  (req, res) => {
	let id = req.query.id;
	var sql = "Select * from product WHERE id = '"+id+"'";
	
	connection.query(sql, function(err,product_response) {
		var product_res = JSON.parse(JSON.stringify(product_response));
		
		connection.query( 'SELECT * FROM category', function(err1,category_res) {
			connection.query( 'SELECT * FROM country', function(err2,country_res) {
				connection.query( 'SELECT * FROM size', function(err3,size_res) {
					res.render('admin/product/edit_product.ejs',{year:year,category:category_res,country:country_res,size:size_res,product:product_res[0]});
				});	
			});	
		});
	});
});

app.post("/admin/save_product", async  (req, res) => {	
	let sampleFile = req.files.images;
	let uni = new Date().getTime();
	var file_name = uni+'_'+req.files.images.name.replace(/ /g,"_");
	
	sampleFile.mv('./public/uploads/product_images/'+file_name,function(res){
		console.log(res,'test');	
	}); 	
	
	var values = [];
	values.push([req.body.title,req.body.description,req.body.price,req.body.country,req.body.category,req.body.size,file_name]);
	
	var error = '';
	connection.query('INSERT INTO product (title,description,price,country_id,category_id,size_id,image) VALUES ?', [values], function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		 
		  error = 'Product added successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/product');
	});
});

app.post("/admin/edit_product_save", async  (req, res) => {	
    let id = req.query.id;
	
	var file_name = req.query.image_name;
    if(req.files){
		let sampleFile = req.files.images;
		let uni = new Date().getTime();
		file_name = uni+'_'+req.files.images.name.replace(/ /g,"_");
		sampleFile.mv('./public/uploads/product_images/'+file_name);
		
		if (fs.existsSync('./uploads/product_images/'+req.query.image_name)) {
			fs.unlinkSync('./uploads/product_images/'+req.query.image_name,function(err){
				console.log(err);
			});	
		}	
	}
	
	var values = [];
	values.push([req.body.title,req.body.description,req.body.price,req.body.country,req.body.category,req.body.size,file_name,id]);
	var sql = "UPDATE product set title =? , description =?, price =?, country_id =?, category_id=?,size_id =?, image =?  WHERE id = ?";
	var error = '';
	connection.query(sql, [req.body.title,req.body.description,req.body.price,req.body.country,req.body.category,req.body.size,file_name,id], function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		 
		  error = 'Product updated successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/product');
	});
});

app.get("/admin/delete_product", async  (req, res) => {
	let id = req.query.id;
	let image = req.query.image;
	
	var sql = "DELETE FROM product WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  if (fs.existsSync('./uploads/product_images/'+image)) {	
			fs.unlinkSync('./uploads/product_images/'+image);	
		  }
		  error = 'Product Deleted successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/product');
	});
});

//For Orders
app.get("/admin/order", async  (req, res) => {
  res.locals.message = req.flash();
	
  connection.query('Select * from orders order by id', function(err,result) {
	  res.render('admin/order/order.ejs',{year:year,result:result});
  });	  

});

app.get("/admin/delete_order", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "DELETE FROM orders WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  sql = "DELETE FROM order_items WHERE order_id = '"+id+"'";	
		  connection.query(sql, function(err,result) {

		  });
		  
		  error = 'Order Deleted successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/order');
	});  

});

app.get("/admin/view_order_items", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "SELECT * FROM order_items INNER JOIN product on product.id=order_items.product_id WHERE order_id = '"+id+"' order by order_items.product_id DESC";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Category Deleted successfully';
		}
		
		res.render('admin/order/view_order_details.ejs',{year:year,result:result});
	});
});

//For Category
app.get("/admin/category", async  (req, res) => {
  res.locals.message = req.flash();
	
  connection.query('Select * from category order by updated_at DESC', function(err,result) {
	  res.render('admin/category/index.ejs',{year:year,result:result});
  });	  

});

app.get("/admin/cadd", async  (req, res) => {
  res.render('admin/category/add.ejs',{year:year});
});

app.post("/admin/savecategory", async  (req, res) => {
	var name = req.body.name;
	
	var values = [];
	values.push([name]);
	
	var error = '';
	connection.query('INSERT INTO category (name) VALUES ?', [values], function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Category added successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/category');
	});
});

app.get("/admin/delete_category", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "DELETE FROM category WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Category Deleted successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/category');
	});
});

app.get("/admin/edit_category", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "SELECT * FROM category WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
			
		   req.flash('success',err.sqlMessage);
		   res.redirect('/admin/category');
		}
		else {
		   var result = JSON.parse(JSON.stringify(result));
		   res.render('admin/category/edit.ejs',{year:year,result:result[0]});
		}
	});
});

app.post("/admin/save_edit_category", async  (req, res) => {
	let id = req.query.id;
	
	var name = req.body.name;
	var sql = "UPDATE category SET name='"+name+"' WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		    error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		   error = 'Category updated successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/category');
	});
});

//For SIZE
app.get("/admin/size", async  (req, res) => {
  res.locals.message = req.flash();
	
  connection.query('Select * from size order by updated_at DESC', function(err,result) {
	  res.render('admin/size/index.ejs',{year:year,result:result});
  });	  

});

app.get("/admin/sadd", async  (req, res) => {
  res.render('admin/size/add.ejs',{year:year});
});

app.post("/admin/savesize", async  (req, res) => {
	var name = req.body.name;
	
	var values = [];
	values.push([name]);
	
	var error = '';
	connection.query('INSERT INTO size (name) VALUES ?', [values], function(err,result) {
		if(err) {
		   error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Size added successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/size');
	});
});

app.get("/admin/delete_size", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "DELETE FROM size WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Size Deleted successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/size');
	});
});

app.get("/admin/edit_size", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "SELECT * FROM size WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		   req.flash('success',err.sqlMessage);
		   res.redirect('/admin/size');
		}
		else {
		   var result = JSON.parse(JSON.stringify(result));
		   res.render('admin/size/edit.ejs',{year:year,result:result[0]});
		}
	});
});

app.post("/admin/save_edit_size", async  (req, res) => {
	let id = req.query.id;
	
	var name = req.body.name;
	var sql = "UPDATE size SET name='"+name+"' WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		   error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		   error = 'Size updated successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/size');
	});
});

//For Country
app.get("/admin/country", async  (req, res) => {
  res.locals.message = req.flash();
	
  connection.query('Select * from country order by updated_at DESC', function(err,result) {
	  res.render('admin/country/index.ejs',{year:year,result:result});
  });	  

});

app.get("/admin/coadd", async  (req, res) => {
  res.render('admin/country/add.ejs',{year:year});
});

app.post("/admin/savecountry", async  (req, res) => {
	var name = req.body.name;
	
	var values = [];
	values.push([name]);
	
	var error = '';
	connection.query('INSERT INTO country (name) VALUES ?', [values], function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Country added successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/country');
	});
});

app.get("/admin/delete_country", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "DELETE FROM country WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Country Deleted successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/country');
	});
});

app.get("/admin/edit_country", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "SELECT * FROM country WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
			
		   req.flash('success',err.sqlMessage);
		   res.redirect('/admin/country');
		}
		else {
		   var result = JSON.parse(JSON.stringify(result));
		   res.render('admin/country/edit.ejs',{year:year,result:result[0]});
		}
	});
});

app.post("/admin/save_edit_country", async  (req, res) => {
	let id = req.query.id;
	
	var name = req.body.name;
	var sql = "UPDATE country SET name='"+name+"' WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		   error = err.sqlMessage;
		}
		else {
		   error = 'Country updated successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/country');
	});
});
};