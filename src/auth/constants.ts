export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'change-this-in-production',
  accessTokenExpiresIn: '15m',
};