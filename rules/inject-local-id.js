/**
 * Adds the ID of the user object stored on our database
 * to the token returned from Auth0
 */
function (user, context, callback) {
  var namespace = 'https://techbikers.com/';

  // If the user has app_metadata then inject the ID into the token
  if (user.app_metadata) {
    context.idToken[namespace + 'user_id'] = user.app_metadata.id;
  }

  callback(null, user, context);
}
