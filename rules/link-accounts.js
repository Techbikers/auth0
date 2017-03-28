/**
 * Link accounts that share a verified email address
 */
function (user, context, callback) {
  var request = require('request@2.56.0');
  var async = require('async@2.1.2');
  var userApiUrl = auth0.baseUrl + '/users';

  // Check if email is verified, we shouldn't automatically
  // merge accounts if this is not the case.
  if (!user.email_verified) {
    return callback(null, user, context);
  }

  // Call Management API to find all users with the current email
  // address but not with the current connection (i.e. has this
  // user already got an account with this email address?)
  request({
    url: userApiUrl,
    headers: {
      Authorization: 'Bearer ' + auth0.accessToken
    },
    qs: {
      search_engine: 'v2',
      q: 'email.raw:"' + user.email + '" -user_id:"' + user.user_id + '"'
   }
  },
  function(err, response, body) {
    // Error handling
    if (err) return callback(err);
    if (response.statusCode !== 200) return callback(new Error(body));

    // No errors, handle the response body
    var data = JSON.parse(body);

    // If we have some accounts, link them
    // (there should only ever be one acount returned if any)
    if (data.length > 0) {
      async.each(data, function(targetUser, cb) {
        var aryTmp = targetUser.user_id.split(/\|(.+)/);
        var provider = aryTmp[0];
        var targetUserId = aryTmp[1];

        if (targetUser.email_verified) {
          // Add existing metadata to the user object so that this
          // gets passed through to any other rules
          user.app_metadata = targetUser.app_metadata || {};
          user.user_metadata = targetUser.user_metadata || {};

          // Now update the user with existing metadata
          auth0.users.updateAppMetadata(user.user_id, user.app_metadata).then(
            auth0.users.updateUserMetadata(user.user_id, user.user_metadata)
          ).then(
            // Finally, link the accounts
            function() {
              request.post({
                url: userApiUrl + '/' + user.user_id + '/identities',
                headers: {
                  Authorization: 'Bearer ' + auth0.accessToken
                },
                json: {
                  provider: provider,
                  user_id: targetUserId
                }
              }, function(err, response, body) {
                if (response.statusCode >= 400) {
                  cb(new Error('Error linking account: ' + response.statusMessage));
                } else {
                  cb(err);
                }
              });
            }
          ).catch(
            function(err) {
              cb(err);
            }
          );
        } else {
          cb();
        }
      }, function(err) {
        callback(err, user, context);
      });
    } else {
      callback(null, user, context);
    }
  });
}
