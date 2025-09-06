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
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          console.log('Passport LocalStrategy - checking user:', email);
          
          const user = await prisma.user.findUnique({ where: { email } });
          
          if (!user) {
            console.log('User not found:', email);
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          console.log('User found, comparing passwords...');
          const isValidPassword = await bcrypt.compare(password, user.password);
          
          if (!isValidPassword) {
            console.log('Password mismatch for user:', email);
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          // Remove password field before returning user
          const { password: pw, ...userSafe } = user;
          console.log('Authentication successful for:', email);
          return done(null, userSafe);
          
        } catch (err) {
          console.error('Passport LocalStrategy error:', err);
          return done(err);
        }
      }
    )
  );

  // Serialize user.id to the session
  passport.serializeUser((user, done) => {
    console.log('Serializing user ID:', user.id);
    done(null, user.id);
  });

  // Deserialize by user id on each request
  passport.deserializeUser(async (id, done) => {
    try {
      console.log('Deserializing user ID:', id);
      const user = await prisma.user.findUnique({ where: { id } });
      
      if (!user) {
        console.log('User not found during deserialization:', id);
        return done(null, false);
      }
      
      const { password: pw, ...userSafe } = user;
      console.log('User deserialized:', userSafe.email);
      done(null, userSafe);
    } catch (err) {
      console.error('Deserialization error:', err);
      done(err);
    }
  });
};