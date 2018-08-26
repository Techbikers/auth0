/**
 * Link accounts that share a verified email address
 */
function (user, context, callback) {
  var request = require('request');

  // Check if email is verified, we shouldn't automatically
  // merge accounts if this is not the case.
  if (!user.email || !user.email_verified) {
    return callback(null, user, context);
  }

  // Call Management API to find all users with the current email
  // address but not with the current connection (i.e. has this
  // user already got an account with this email address?)
  request({
    url: `${auth0.baseUrl}/users-by-email`,
    headers: {
      Authorization: `Bearer ${auth0.accessToken}`
    },
    qs: {
      email: user.email
    }
  },
  function(err, response, body) {
    // Error handling
    if (err) return callback(err);
    if (response.statusCode !== 200) return callback(new Error(body));

    // No errors, handle the response body
    var data = JSON.parse(body);

    // Ignore non-verified users and the current user
    data = data.filter(u => u.email_verified && (u.user_id !== user.user_id));

    // We shouldn't be seeing more than one account (as this should always
    // merge any accounts before the count goes higher than 1)
    if (data.length > 1) {
      return callback(new Error('[!] Rule: Multiple user profiles already exist - cannot select base profile to link with'));
    }

    // Skip the rest of the rule if there are no users
    if (data.length === 0) {
      console.log('[-] Skipping link rule');
      return callback(null, user, context);
    }

    // Get our primary user (who we're going to link this new account to)
    var primaryUser = data[0];

    // Get the details of our current user
    var provider = user.identities[0].provider;
    var userId = user.identities[0].user_id;

    // Bit of logging so we know what's going on
    console.log(`[+] Running link user rule`);
    console.log(`    Primary user: ${primaryUser.user_id}`);
    console.log(`    Secondary user: ${user.user_id}`);

    request.post({
      url: `${auth0.baseUrl}/users/${primaryUser.user_id}/identities`,
      headers: {
        Authorization: `Bearer ${auth0.accessToken}`
      },
      json: {
        provider: provider,
        user_id: userId
      }
    },
    function(err, response, body) {
      // Handle any error
      if (response.statusCode >= 400) {
        callback(new Error('Error linking account: ' + response.statusMessage));
      }

      context.primaryUser = primaryUser.user_id;
      callback(null, user, context);
    });
  });
}
