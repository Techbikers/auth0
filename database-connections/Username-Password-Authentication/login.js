function login (email, password, callback) {
  request({
    url:  "https://techbikers.com/api/auth/verify",
    method: "GET",
    json: true,
    headers: {
      "content-type": "application/json",
    },
    auth: {
      username: email,
      password: password
    }
  }, function (err, response, body) {
    if (err) {
      callback(err);
      return false;
    }

    if (response.statusCode === 401) {
      callback(new WrongUsernameOrPasswordError(email, "Wrong email or password"));
      return false;
    }

    callback(null, {
      user_id: body.id.toString(),
      given_name: body.first_name,
      family_name: body.last_name,
      email: email,
      email_verified: true,
      picture: body.avatar,
      company: body.company,
      website: body.website
    });
  });

}
