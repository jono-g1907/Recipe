Movies Library Application
Develop an application that represents a library for Movies. You have to be able to add, update, retrieve, and delete data. Each movie has:

id

title

year

list of actors

Each actor has:

id

name

birth year

list of movies

Each movie may have one or more actors, and each actor may have participated in multiple movies. In this case, you have many movies related to many actors (many to many relationships). The server has to respond with status codes:

400 if an error occurs

404 if no document can be found

200 (which is the default) if the request is processed successfully

 The structure of the app will be:


The Actor schema
 The schema needs access to the Mongoose library:

const mongoose = require('mongoose');
 Create a new schema

const actorSchema = new mongoose.Schema({});
 The name is a mandatory field of type string

name: {
    type: String,
    required: true
},
 The birth year is a mandatory field of type Integer

bYear: {
       validate: {
           validator: function (newYear) {
               if (Number.isInteger(newYear))
                   return true;
               else return false
           },
           message: 'Birth year should be integer'
       },
       type: Number,
       required: true

   },

The validator is a boolean function that returns true if the birth year is integer and false otherwise. More simply, we can code it:

bYear: {
    validate: {
        validator: Number.isInteger,
        message: 'Birth year should be integer'
    },
    type: Number,
    required: true

}

 Now, let's define the list of moves, which is an array of referencesÂ (i.e. ids) to the 'Movie' collection

movies: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Movie'
}]
 The last step is to export the model that uses the above schema.

module.exports = mongoose.model('Actor', actorSchema);
 The Actor Schema ('/models/actor.js) in one piece:

const mongoose = require('mongoose');

const actorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    bYear: {
        validate: {
            validator: function (newAge) {
                if (Number.isInteger(newAge))
                    return true;
                else return false
            },
            message: 'Birth year should be integer'
        },
        type: Number,
        required: true

    },
    movies: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Movie'
    }]
});
module.exports = mongoose.model('Actor', actorSchema);

The model's name is 'Actor'; therefore, the mongoose will create a collection named 'actors'.

The Movie Schema
The movie Schema ('/models/movie.js') is similar to Actor.

const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true

The model's name is 'Movies'; therefore, the mongoose will create a collection named 'movies'. Lines 13-17 define actors as an array of references (i.e. ids) to the Actor collection. By doing so, each movie document can reference a set of Actors. Two routers for actors and movies will be implemented to better manage and apply the Separation of Concerns principle.

The Actor Router
In this file, all the operations of the 'Actor' collection will be implemented. Firstly, the router needs access to both models (Actor and Movie) and the Mongoose library.

const mongoose = require('mongoose');

const Actor = require('../models/actor');
const Movie = require('../models/movie');
 Next, due to having more than one function to be exported, the router will export an object where each function is a member (property) of that object. 

module.exports = {
// Implement your functions
}
  getAll: is a function that retrieves all the documents from the Actor collection and sends them back as a response.

getAll: async function (req, res) {
   let actors= await Actor.find();
   res.json(actors);
},
res.json() function sends the response in a JSON format. More details: https://expressjs.com/en/api.html#res.json
createOne: is a function that creates a new document based on the parsed data in 'req.body' and saves it in the 'Actor' collection.

createOne: async function (req, res) {
    let newActorDetails = req.body;
    let actor = new Actor(newActorDetails);
    await actor.save();
    res.json(actor);
    
},

  getOne: This function finds one document by an ID

getOne:async function (req, res) {
   let actor=await Actor.findOne({ _id: req.params.id })
        .populate('movies')
        .exec();
    res.json(actor);
},
.populate replaces each ID in the array 'movies' with its document. For example, if there is an actor with two movies, then the output of the above function will be:
{
    "movies": [
        {
            "actors": [],
            "_id": "5b89971ce7ef9220bcada5c2",
            "title": "FIT2095",
            "year": 2015,
            "__v": 0
        },
        {
            "actors": [],
            "_id": "5b8997c4e7ef9220bcada5c3",
            "title": "FIT1051",
            "year": 2020,
            "__v": 0
        }
    ],
    "_id": "5b89692872b3510c78aa14f2",
    "name": "Tim",
    "bYear": 2013,
    "__v": 2
}

But if we omit function populate('movies'), the output will be:
{
    "movies": [
        "5b89971ce7ef9220bcada5c2",
        "5b8997c4e7ef9220bcada5c3"
    ],
    "_id": "5b89692872b3510c78aa14f2",
    "name": "Tim",
    "bYear": 2013,
    "__v": 2
}

More details, please navigate to:https://mongoosejs.com/docs/populate.html
UpdateOne: This function finds a document by its ID and sets new content that is retrieved from 'req.body'

updateOne: async function (req, res) {
  let obj=await  Actor.findOneAndUpdate({ _id: req.params.id }, req.body);
  res.json(obj);
},
deleteOne: This function deletes the document that matches the criteria.

deleteOne: async function (req, res) {
   let obj=await Actor.findOneAndRemove({ _id: req.params.id });
   res.json();
},
  AddMovie: This function adds a movie ID to the list of movies in an actor's document.

addMovie: async function (req, res) {
  let actor=await  Actor.findOne({ _id: req.params.id });
  let movie =await Movie.findOne({ _id: req.body.id });
  actor.movies.push(movie._id);
  await actor.save();
  res.json(actor);
},

The first step is to retrieve the actor's document (line 2), where the ID can be found in the URL's params. The next step is to retrieve the movie (line 6), where its ID is saved in the 'req.body'. After pushing the movie into the actor's document, we save (line 11) it back to the database. 