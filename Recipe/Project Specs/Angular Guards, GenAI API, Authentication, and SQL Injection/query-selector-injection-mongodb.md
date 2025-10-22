# Query Selector Injection (MongoDB)

## How secure are MEAN stack applications?

MEAN stack applications are becoming popular due to their lightweight nature, massive ecosystem of middleware plugins and dependencies, and ease of deployment to most cloud vendors. However, these applications might be attacked by common vulnerabilities introduced either by using MEAN stack components in their default configurations or due to common developer mistakes. In this section, we will examine one case.

---

## Query Selector Injection (MongoDB)

MongoDB is vulnerable to an attack called **Query Selector Injection** that uses query selector logic operators to change queries.

### Example

If a client sends a login request (POST) to a server that consists of a username and password, an intruder can intercept the login request and change the POST `pass` parameter to `password[$ne]=null` where `$ne` is the MongoDB query operator “not equal to”.

When Express processes the `x-www-form-urlencoded` request body, this will be parsed into the object:

```json
{ "username": "admin", "password": { "$ne": null } }
```

and passed to the MongoDB query:

```js
db.collection('users').findOne(
  { username: user, password: pass },
  function (err, result) {
    if (result !== null) {
      res.redirect('/');
    } else {
      res.redirect('/login');
    }
  }
);
```

**Example request:**

```
http://localhost:8080/getuser?user=admin&password[%24ne]=null
```

Passing the above object to MongoDB, the query will match the first username that matches `admin` **with a password that is not equal to `null`**, allowing authentication as an administrator without providing a valid password.

---

## Mitigation

The simplest way to mitigate query selector injection is to **cast the values to a `String`** before running the query.

```js
db.collection('users').findOne(
  {
    username: String(user),
    password: String(pass),
  },
  function (err, result) {
    if (result !== null) {
      res.redirect('/');
    } else {
      res.redirect('/login');
    }
  }
);
```
