function getByEmail (email, callback) {
  request({
    url:  "https://techbikers.com/api/auth/account",
    method: "GET",
    json: true,
    headers: {
      "content-type": "application/json",
    },
    auth: {
      username: configuration.adminUsername,
      password: configuration.adminPassword
    },
    qs: {
      email: email
    }
  }, function (err, response, body) {
    if (err) {
      callback(err);
      return false;
    }

    // Not allowed to search for users
    if (response.statusCode === 401) {
      callback(new Error("Admin details are wrong. See Auth0 settings."));
      return false;
    }

    // User not found
    if (response.statusCode === 404) {
      callback(null);
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
