module.exports = function(app, passport) {
    var year = new Date().getFullYear();
 app.get('/', function(req, res){
  res.render('index.ejs');
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
 
app.post('/checkAuth', function(req, res){
    
   if(req.isAuthenticated()){
      let userID = req.user.id;
	  let rating = req.body.rating;
	  let review = req.body.review;
	  let company = req.body.company;
	  
	  let query = "INSERT INTO `company_rating`  (user_id,company_id, rating, review) VALUES ('" + userID + "','" +
                    company + "', '" + rating + "', '" + review + "')";
		db.query(query, (err, result) => {
				if (err) {
					res.send({ status: false,msg:err});
					return;
				}
			
				db.query('SELECT SUM(rating) AS "total_add" FROM company_rating WHERE company_id='+company, (err, result) => {
				
				var sum = JSON.parse(JSON.stringify(result));
				
				var total_add = sum[0].total_add;
				
				db.query('SELECT count(*) AS "total_count" FROM company_rating WHERE company_id='+company, (err, result) => {
					
					var count = JSON.parse(JSON.stringify(result));
					
					var total_count = count[0].total_count;
					
					var rating = total_add / total_count;
					
					var update_sql = 'UPDATE empresas SET rating='+rating+' WHERE id='+company;
					
					console.log(update_sql,'update_sql');
					
					db.query(update_sql, (err, reviews) => {
						
						res.send({ status: true,msg:'Rated successfully',update_sql:update_sql});
					
					});
					
				});
			});
			
		});
   }else{
	  res.send({ status: req.isAuthenticated(),msg:'UnAuthorised'});
   }
   
});


 app.get('/yourEmpresa', isLoggedIn, function (req, res)  {
    let username = req.user.username;
    let query = "SELECT * FROM `empresas` where username = '" + username + "'"; // query database to get all the players


db.query(query, (err, result) => {
    if (err) {
        res.redirect('yourEmpresa.ejs');
    }
    res.render('yourEmpresa.ejs', {
        title: "Welcome to Socka | View Players"
        ,players: result
    });
});

}),

app.get('/get_state', function(req, res){
	db.query('SELECT * FROM distritosportugal', (err, p) => {
		db.query('SELECT * FROM distritos', (err, s) => {
			var swe = JSON.parse(JSON.stringify(s));	
			var port = JSON.parse(JSON.stringify(p));

			res.end(JSON.stringify({ status: 200,s:swe,p:port}));	
		});
	});	
});

app.get('/add',isLoggedIn, function(req, res){
    res.render('add-player.ejs', {
     user:req.user,
     title: "Welcome to Socka | Add a new player"
            ,message: ''
    });
   });


   app.post('/add', isLoggedIn, function (req, res)  {
    if (!req.files) {
        return res.status(400).send("No files were uploaded.");
    }

    let message = '';
    let nome_empresa = req.body.nome_empresa;
    let email = req.body.email;
    let pais = req.body.pais;
    let distrito_nome = req.body.distrito_nome;
    let rua = req.body.rua;
    let codpos = req.body.codpos;
    let telefone = req.body.telefone;
    let username = req.user.username;
    let slogan = req.body.slogan;
    let descricao = req.body.descricao;
    let descricao2 = req.body.descricao2;
        let descricao3 = req.body.descricao3;
        let categoria = req.body.categoria;

    let uploadedFile = req.files.image;
    let image_name = uploadedFile.name;
    let fileExtension = uploadedFile.mimetype.split('/')[1];
    image_name = email + '.' + fileExtension;
	
	let country = req.body.select_country;
	let origin = req.body.from_country_start.toString();
	let destination = req.body.to_country_start.toString();
	
	console.log(origin,'origin');
	console.log(destination,'destination');

    let emailQuery = "SELECT * FROM `empresas` WHERE email = '" + email + "'";

    db.query(emailQuery, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (result.length > 0) {
            message = 'Username already exists';
            res.render('add-player.ejs', {
                message,
                title: "Welcome to Socka | Add a new player"
            });
        } else {
            // check the filetype before uploading it
            if (uploadedFile.mimetype === 'image/png' || uploadedFile.mimetype === 'image/jpeg' || uploadedFile.mimetype === 'image/gif') {
                // upload the file to the /public/assets/img directory
                uploadedFile.mv(`public/assets/img/${image_name}`, (err ) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    // send the player's details to the database
                   
                    let query = "INSERT INTO `empresas`    (username, nome_empresa, email, pais, distrito_nome, rua, codpos, telefone, image, slogan, descricao, descricao2, descricao3, categoria,country,origin,destination) VALUES ('" + username + "','" +
                    nome_empresa + "', '" + email + "', '" + pais + "', '" + distrito_nome + "', '" + rua + "', '" + codpos + "', '" + telefone + "', '" + image_name + "', '" + slogan + "', '" + descricao + "', '" + descricao2 + "', '" + descricao3 + "', '" + categoria + "','" + country + "','" + origin + "','" + destination + "')";
                    db.query(query, (err, result) => {
                        if (err) {
                            return res.status(500).send(err);
                        }
                        res.redirect('/index');
                        
                    });
                });
            } else {
                message = "Invalid File format. Only 'gif', 'jpeg' and 'png' images are allowed.";
                res.render('add-player.ejs', {
                    message,
                    title: "Welcome to Socka | Add a new player",
                    user:req.user
                });
            }
        }
    });
}),
   
   
  

    
  app.get('/yourEmpresa', function(req, res){
    res.render('yourEmpresa.ejs');});    
 
 app.get('/logout', function(req,res){
  req.logout();
  res.redirect('/');
 })
 
 app.get('/empresaProfile', function (req, res)  {
    let playerId = req.params.id;
    let query = "SELECT * FROM `empresas` WHERE id = '" + playerId + "' ";
    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.render('empresaProfile.ejs', {
            title: "Edit  Player"
            ,player: result[0]
            ,message: ''
        });
    });
},)






async function f() {
    return Promise.resolve(1);
  }
     
  async function getBlogs(){
      var all_blog = [];
     db.query( 'SELECT * FROM blog_category order by id asc', function(err,category_res) {
          var result = JSON.parse(JSON.stringify(category_res));	
          for(i=1;i<result.length;i++){
              let category = result[i].id;
              
              let sql = 'SELECT blog.*,blog_category.name as category_name FROM blog LEFT JOIN blog_category ON blog_category.id=blog.category_id where category_id='+category+' ORDER BY RAND() LIMIT 3';
  
              db.query(sql, function(err1,blog_res) {
                  all_blog.push(blog_res);
              });	
          }
      });
      
      return all_blog;
  }   
     
     
  app.get('/artigos', async function(req, res){
      var all_blog = [];
      db.query( 'SELECT blog.*,blog_category.name as category_name FROM blog LEFT JOIN blog_category ON blog_category.id=blog.category_id ORDER BY RAND()', function(err,category_res) {
          var result = JSON.parse(JSON.stringify(category_res));
          
          let group = result.reduce((r, a) => {
           r[a.category_id] = [...r[a.category_id] || [], a];
           return r;
          }, {});
          
          
          res.render('blog/artigos.ejs',{all_blog:group});
      });
  });   
  
  app.get('/conteudo', function(req, res){
      let id = req.query.id;
      db.query('Select blog.*,blog_category.name as category_name from blog LEFT JOIN blog_category ON blog_category.id = blog.category_id where blog.id='+id, function(err,category_res) {
          var result = JSON.parse(JSON.stringify(category_res));
		
          res.render('blog/conteudo.ejs',{result:result[0]});
      });
  });
  
  app.get('/desporto', function(req, res){
    let id = req.query.id;
    
    db.query( 'SELECT * FROM blog where category_id='+id+'', function(err,category_res) {
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
      
    db.query('Select blog.*,blog_category.name as category_name from blog LEFT JOIN blog_category ON blog_category.id = blog.category_id order by blog.updated_at DESC', function(err,result) {
        res.render('admin/blog/index.ejs',{year:year,result:result});
    });	  
  
  });
  
  app.get("/admin/add_blog", async  (req, res) => {
    db.query( 'SELECT * FROM blog_category', function(err1,category_res) {	
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
      db.query('INSERT INTO blog (category_id,blog_title,blog_desc,full_description,image) VALUES ?', [values], function(err,result) {
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
      db.query(sql, function(err,result) {
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
      db.query(sql, function(err,result) {
          if(err) {
             req.flash('success',err.sqlMessage);
             res.redirect('/admin/blog');
          }
          else {
             var result = JSON.parse(JSON.stringify(result));
             db.query('Select * from blog_category order by updated_at DESC', function(err,category_result) {
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
          
      db.query(sql, [req.body.category,req.body.name,req.body.description,req.body.full_description,file_name,req.query.id], function(err,result) {
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
      
    db.query('Select * from blog_category order by updated_at DESC', function(err,result) {
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
      db.query('INSERT INTO blog_category (name) VALUES ?', [values], function(err,result) {
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
      db.query(sql, function(err,result) {
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
      db.query(sql, function(err,result) {
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
      db.query(sql, function(err,result) {
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

