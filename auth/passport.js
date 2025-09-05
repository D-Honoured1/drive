/**
 * Passport configuration (local strategy).
 *
 * - Uses passport-local to authenticate using email + password.
 * - serializeUser stores user.id in the session.
 * - deserializeUser retrieves user by id from Prisma.
 *
 * Note: This file exports a setup function that accepts passport instance and prisma client.
 */

const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

module.exports = function (passport, prisma) {
  // LocalStrategy expects function (username, password, done)
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            return done(null, false, { message: 'Incorrect email or password.' });
          }
          const ok = await bcrypt.compare(password, user.password);
          if (!ok) {
            return done(null, false, { message: 'Incorrect email or password.' });
          }
          // Remove password field before attaching user to session object
          const { password: pw, ...userSafe } = user;
          return done(null, userSafe);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Serialize user.id to the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize by user id on each request
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return done(null, false);
      const { password: pw, ...userSafe } = user;
      done(null, userSafe);
    } catch (err) {
      done(err);
    }
  });
};
