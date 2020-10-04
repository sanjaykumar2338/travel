module.exports = function(app, passport,fs) {

var connection = require('./../../app/database/db.js'); 
 //Manage All the routes of Admin
var year = new Date().getFullYear();

 app.get('/', function(req, res){
  res.render('blog/index.ejs');
 });

 app.get('/login', function(req, res){
  res.render('login.ejs', {message:req.flash('loginMessage')});
 });

 app.post('/login', passport.authenticate('local-login', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
 }),
  function(req, res){
   if(req.body.remember){
    req.session.cookie.maxAge = 1000 * 60 * 3;
   }else{
    req.session.cookie.expires = false;
   }
   res.redirect('/');
  });

 app.get('/signup', function(req, res){
  res.render('signup.ejs', {message: req.flash('signupMessage')});
 });

 app.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/profile',
  failureRedirect: '/signup',
  failureFlash: true
 }));

 app.get('/profile', isLoggedIn, function(req, res){
  res.render('profile.ejs', {
   user:req.user
  });
 });
 app.get('/add', isLoggedIn, function(req, res){
    res.render('add-player.ejs', {
     user:req.user,
     title: "Welcome to Socka | Add a new player"
            ,message: ''
    });
   });
   
   
async function f() {
  return Promise.resolve(1);
}
   
async function getBlogs(){
	var all_blog = [];
	connection.query( 'SELECT * FROM blog_category order by id asc', function(err,category_res) {
		var result = JSON.parse(JSON.stringify(category_res));	
		for(i=1;i<result.length;i++){
			let category = result[i].id;
			
			let sql = 'SELECT blog.*,blog_category.name as category_name FROM blog LEFT JOIN blog_category ON blog_category.id=blog.category_id where category_id='+category+' ORDER BY RAND() LIMIT 3';

			connection.query(sql, function(err1,blog_res) {
				all_blog.push(blog_res);
			});	
		}
	});
	
	return all_blog;
}   
   
   
app.get('/artigos', async function(req, res){
	var all_blog = [];
	connection.query( 'SELECT blog.*,blog_category.name as category_name FROM blog LEFT JOIN blog_category ON blog_category.id=blog.category_id ORDER BY RAND()', function(err,category_res) {
		var result = JSON.parse(JSON.stringify(category_res));
		
		let group = result.reduce((r, a) => {
		 r[a.category_id] = [...r[a.category_id] || [], a];
		 return r;
		}, {});
		
		console.log("group", group);
		res.render('blog/artigos.ejs',{all_blog:group});
	});
});   

app.get('/conteudo', function(req, res){
	let id = req.query.id;
	connection.query( 'SELECT * FROM blog where id='+id+'', function(err,category_res) {
		var result = JSON.parse(JSON.stringify(category_res));
		res.render('blog/conteudo.ejs',{result:result[0]});
	});
});

app.get('/desporto', function(req, res){
  let id = req.query.id;
  
  connection.query( 'SELECT * FROM blog where category_id='+id+'', function(err,category_res) {
	  res.render('blog/desporto.ejs',{result:category_res});
  });
});    
 
 app.get('/logout', function(req,res){
  req.logout();
  res.redirect('/');
 });
 
 //For Blog
app.get("/admin/blog", async  (req, res) => {
  res.locals.message = req.flash();
	
  connection.query('Select blog.*,blog_category.name as category_name from blog LEFT JOIN blog_category ON blog_category.id = blog.category_id order by blog.updated_at DESC', function(err,result) {
	  res.render('admin/blog/index.ejs',{year:year,result:result});
  });	  

});

app.get("/admin/add_blog", async  (req, res) => {
  connection.query( 'SELECT * FROM blog_category', function(err1,category_res) {	
	res.render('admin/blog/add.ejs',{year:year,category:category_res});
  });
});

app.post("/admin/upload_blog_images", async  (req, res) => {
	let sampleFile = req.files.file;
	let uni = new Date().getTime();
	var file_name = uni+'_'+req.files.file.name.replace(/ /g,"_");
	
	sampleFile.mv('./public/uploads/tinymce_images/'+file_name,function(res){
		console.log(res,'test');	
	}); 
	
	 res.end(JSON.stringify({ status: 200,responseText:'image uploaded',location:'./../uploads/tinymce_images/'+file_name }));
});	

app.post("/admin/blog_save", async  (req, res) => {
	var category = req.body.category;
	var name = req.body.name;
	var description = req.body.description;
	var full_description = req.body.full_description;
	
	let sampleFile = req.files.images;
	let uni = new Date().getTime();
	var file_name = uni+'_'+req.files.images.name.replace(/ /g,"_");
	
	sampleFile.mv('./public/uploads/blog_images/'+file_name,function(res){
		console.log(res,'test');	
	}); 
	
	var values = [];
	values.push([category,name,description,full_description,file_name]);
	
	var error = '';
	connection.query('INSERT INTO blog (category_id,blog_title,blog_desc,full_description,image) VALUES ?', [values], function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Blog added successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/blog');
	});
});

app.get("/admin/blog_delete", async  (req, res) => {
	let id = req.query.id;
	let image = req.query.image;
	
	var sql = "DELETE FROM blog WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  console.log(fs.existsSync('./public/uploads/blog_images/'+image));
		  if (fs.existsSync('./public/uploads/blog_images/'+image)) {	
			  fs.unlinkSync('./public/uploads/blog_images/'+image);	
		  }
		  
		  error = 'Blog Deleted successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/blog');
	});
});

app.get("/admin/blog_edit", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "SELECT * FROM blog WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		   req.flash('success',err.sqlMessage);
		   res.redirect('/admin/blog');
		}
		else {
		   var result = JSON.parse(JSON.stringify(result));
		   connection.query('Select * from blog_category order by updated_at DESC', function(err,category_result) {
			   console.log(result[0]);
				res.render('admin/blog/edit.ejs',{year:year,blog:result[0],category:category_result});
		   });
		}
	});
});

app.post("/admin/blog_save_edit", async  (req, res) => {
	let id = req.query.id;
	
	var category = req.body.category;
	var name = req.body.name;
	var description = req.body.description;
	var full_description = req.body.full_description;
	
	var file_name = req.query.image_name;
    if(req.files){
		let sampleFile = req.files.images;
		let uni = new Date().getTime();
		file_name = uni+'_'+req.files.images.name.replace(/ /g,"_");
		sampleFile.mv('./public/uploads/blog_images/'+file_name);
		
		if (fs.existsSync('./public/uploads/blog_images/'+req.query.image_name)) {
			fs.unlinkSync('./public/uploads/blog_images/'+req.query.image_name,function(err){
				console.log(err);
			});	
		}	
	}

	var values = [];
	values.push([category,name,description,full_description,file_name,id]);
	var sql = "UPDATE blog set category_id =? , blog_title =?, blog_desc =?, full_description =?,image =? WHERE id = ?";
	
	var error = '';
    	
	connection.query(sql, [req.body.category,req.body.name,req.body.description,req.body.full_description,file_name,req.query.id], function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		 
		  error = 'Blog updated successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/blog');
	});
});
 
 
 //For Blog Category
app.get("/admin/blog_category", async  (req, res) => {
  res.locals.message = req.flash();
	
  connection.query('Select * from blog_category order by updated_at DESC', function(err,result) {
	  res.render('admin/blog_category/index.ejs',{year:year,result:result});
  });	  

});

app.get("/admin/blog_cadd", async  (req, res) => {
  res.render('admin/blog_category/add.ejs',{year:year});
});

app.post("/admin/blog_savecategory", async  (req, res) => {
	var name = req.body.name;
	
	var values = [];
	values.push([name]);
	
	var error = '';
	connection.query('INSERT INTO blog_category (name) VALUES ?', [values], function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Category added successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/blog_category');
	});
});

app.get("/admin/blog_delete_category", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "DELETE FROM blog_category WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Category Deleted successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/blog_category');
	});
});

app.get("/admin/blog_edit_category", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "SELECT * FROM blog_category WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
			
		   req.flash('success',err.sqlMessage);
		   res.redirect('/admin/blog_category');
		}
		else {
		   var result = JSON.parse(JSON.stringify(result));
		   res.render('admin/blog_category/edit.ejs',{year:year,result:result[0]});
		}
	});
});

app.post("/admin/blog_save_edit_category", async  (req, res) => {
	let id = req.query.id;
	
	var name = req.body.name;
	var sql = "UPDATE blog_category SET name='"+name+"' WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		    error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		   error = 'Category updated successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/blog_category');
	});
});

};

function isLoggedIn(req, res, next){
 if(req.isAuthenticated())
  return next();

 res.redirect('/login');
};




