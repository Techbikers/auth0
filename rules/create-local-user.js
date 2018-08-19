/**
 * Creates a user record on the Techbikers server when a user authenticates
 * with Auth0. This should happen during the first login but it will run if
 * we don't have a link to a local user on the Auth0 user.
 */
function (user, context, done) {
  user.app_metadata = user.app_metadata || {};

  // Check to see if the user already has a local record
  if (user.app_metadata.id) {
    return done(null, user, context);
  }

  // Go ahead and create a new user
  request.post({
    url: 'https://api.techbikers.com/riders/',
    json: Object.assign({}, { email: user.email }, user.user_metadata)
  }, function(err, response, body) {
    // Handle errors
    if (err) {
      return done(err);
    }

    // Update the user metadata with the local account id
    user.app_metadata.id = body.id;
    auth0.users.updateAppMetadata(user.user_id, user.app_metadata);

    done(null, user, context);
  });
}
