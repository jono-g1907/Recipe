Movies Library Application: Router
Movie Router
This router is pretty similar to the actor's router. 

getAll: This function uses the Movie model to retrieve all the documents

getAll: async function (req, res) {
   let movies=await Movie.find();
   res.json(movies);
},
 createOne: This function creates a new movie document

createOne: async function (req, res) {
    let newMovieDetails = req.body;
    let movie=new Movie(newMovieDetails);
    await movie.save();
        res.json(movie);
},
getOne: This function uses the Movie model to retrieve a document (a movie) using its _id

getOne: async function (req, res) {
   let movie=await Movie.findOne({ _id: req.params.id })
        .populate('actors')
        .exec();
        res.json(movie);
        });
},

updateOne and deleteOne functions have the same concepts as their counterparts in  '/router/actor.js'

 

 Now, it's time to implement app.js, which is server-side. References to the required packages:

const express = require('express');
const mongoose = require('mongoose');
 References to the routers:

const actors = require('./routers/actor');
const movies = require('./routers/movie');
 Create an app from Expressjs and configure it:

const app = express();

app.listen(8080);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
 Ask Mongoose to connect to a database named 'movies' :

asycn function connect(){
   await mongoose.connect('mongodb://localhost:27017/movies');
}
connect().catch((err)=>{console.log(err);}
 Now, it's time to create the RESTFul endpoints.

If a GET request arrives with pathname ='/actors', execute actor.getAll

app.get('/actors', actors.getAll);
If a POST request arrives with pathname ='/actors', execute actor.createOne

app.post('/actors', actors.createOne);
If a GET request arrives with pathname ='/actors/:id', where id is the actor's ID, execute actor.getOne

app.get('/actors/:id', actors.getOne);
If a PUT request arrives with pathname ='/actors/:id', where id is the actor's ID, execute actor.updateOne

app.put('/actors/:id', actors.updateOne);
If a DELETE request arrives with pathname ='/actors/:id', where id is the actor's ID, execute actor.deleteOne

app.delete('/actors/:id', actors.deleteOne);
 The RESTFul endpoints for the Movie Schema have the same concepts as their counterparts in Actor So, the app.js in one piece:

//https://hub.packtpub.com/building-movie-api-express/
const express = require('express');
const mongoose = require('mongoose');

const actors = require('./routers/actor');
const movies = require('./routers/movie');

const app = express();

app.listen(8080);


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

asycn function connect(){
   await mongoose.connect('mongodb://localhost:27017/movies');
}
connect().catch((err)=>{console.log(err);}


//Configuring Endpoints
//Actor RESTFul endpoionts 
app.get('/actors', actors.getAll);
app.post('/actors', actors.createOne);
app.get('/actors/:id', actors.getOne);
app.put('/actors/:id', actors.updateOne);
app.post('/actors/:id/movies', actors.addMovie);
app.delete('/actors/:id', actors.deleteOne);


//Movie RESTFul  endpoints
app.get('/movies', movies.getAll);
app.post('/movies', movies.createOne);
app.get('/movies/:id', movies.getOne);
app.put('/movies/:id', movies.updateOne);