import * as Joi from 'joi';

export const validate = (config: Record<string, unknown>) => {
  const schema = Joi.object({
    PORT: Joi.number().default(3000),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().required(),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().required(),
    JWT_ACCESS_SECRET: Joi.string().min(20).required(),
    JWT_REFRESH_SECRET: Joi.string().min(20).required(),
    JWT_ACCESS_TTL: Joi.string().default('15m'),
    JWT_REFRESH_TTL: Joi.string().default('7d'),
    CORS_ORIGIN: Joi.string().allow('').default(''),
    SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
  });

  const { error, value } = schema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return value;
};