RESTFul API
What is RESTFul API?
RESTFul API is an application programming interface that uses HTTP requests to perform the four CRUD operations (Create, Retrieve, Update, Delete) on data. REST stands for Representational State Transfer. It is a stateless architecture (sender or receiver retains, i.e. no information) that uses the Web's existing protocols and technologies. The REST architecture consists of:

clients

servers

resources

a vocabulary of HTTP operations known as request methods (such as GET, PUT, or DELETE).

Benefits of REST
The separation between the client and the server

The REST API is always independent of the type of platform or language.

With REST, data produced and consumed is separated from the technologies that facilitate production and consumption. As a result, REST performs well, is highly scalable, simple, and easy to modify and extend.

Since REST is based on standard HTTP operations, it uses verbs with specific meanings, such as "get" or "delete", which avoids ambiguity. Resources are assigned individual URIs, adding flexibility.

The following diagram depicts the RESTEFul architecture that consists of a set of different types of clients sending requests and receiving responses from a RESTFul API server which is in turn connected to a database (such as MongoDB). 


HTTP methods
HTTP has defined a set of methods that indicates the type of action to be performed on the resources.

GET method requests data from the resource and should not produce any side effects. E.g. GET /actors returns the list of all actors.

POST method requests the server to create a resource in the database, mostly when a web form is submitted. E.g POST /movies creates a new movie where the movie's property could be in the request's body. POST is non-idempotent which means multiple requests will have different effects.

PUT method requests the server to update a resource or create the resource if it doesn't exist. E.g. PUT /movie/23 will request the server to update, or create, if it doesn't exist, the movie with id =23. PUT is idempotent, which means multiple requests will have the same effects.

DELETE method requests that the resources, or their instance, should be removed from the database. E.g. DELETE /actors/103 will request the server to delete an actor with ID=103 from the actor's collection.

HTTP response status codes
When the client sends an HTTP request to the server, the client should get feedback on whether it passed or failed. HTTP status codes are a set of standardised codes which has various explanations in various scenarios. For example:

Successful responses

200 OK

201 Created

202 Accepted

Client error responses

400 Bad Request

404 Not Found

405 Method Not Allowed

Server error responses

500 Internal Server Error

501 Not Implemented

503 Service Unavailable

The full list of status codes can be found HERE. 